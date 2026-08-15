// Viagens — pesquisa útil, publicação e evolução de estado
import { useDbStore } from '../db';
import { UID, nowISO, toAscii } from '../helpers';
import { Ride, RouteStop } from '../../types/boleia';
import { localityById, PROVINCE_COORDS } from '../locale';

export type RideInput = {
	driverId: string;
	originLocalityId: string;
	destinationLocalityId: string;
	departureISO: string;
	arrivalISO?: string; // chegada definida pelo motorista (opcional)
	seatsTotal: number;
	pricePerSeat: number;
	stops?: RouteStopInput[];
};

export type RouteStopInput = {
	localityId?: string; // vazio = ponto digitado à mão
	name: string;
};

export type RideMode = 'intermunicipal' | 'interprovincial';

// Origem e destino na mesma província = intermunicipal.
export function rideMode(ride: Ride): RideMode {
	const origin = localityById(ride.origin.localityId);
	const destination = localityById(ride.destination.localityId);
	return origin.province === destination.province
		? 'intermunicipal'
		: 'interprovincial';
}

export function rideById(id: string): Ride | undefined {
	return useDbStore.getState().db.rides.find((r) => r.id === id);
}

export function ridesForDriver(driverId: string): Ride[] {
	return useDbStore
		.getState()
		.db.rides.filter((r) => r.driverId === driverId);
}

// Uma viagem "serve" a procura se o trajeto cobre origem→destino pedidos.
// Casa por nome de município OU de província — a pesquisa interprovincial
// pede só províncias, a intermunicipal só municípios.
function covers(ride: Ride, query: { from?: string; to?: string }): boolean {
	const places = [
		toAscii(ride.origin.name),
		...ride.stops.map((s) => toAscii(s.name)),
		toAscii(ride.destination.name),
		toAscii(localityById(ride.origin.localityId).province),
		...ride.stops
			.filter((s) => !!s.localityId)
			.map((s) => toAscii(localityById(s.localityId).province)),
		toAscii(localityById(ride.destination.localityId).province),
	];
	const has = (q?: string) =>
		!q ||
		places.some(
			(name) => toAscii(q).length > 1 && name.includes(toAscii(q)),
		);
	return has(query.from) && has(query.to);
}

export type SearchParams = {
	from?: string; // município OU província de partida
	to?: string; // município OU província de chegada
	date?: string; // yyyy-mm-dd (exata)
	dateFrom?: string; // yyyy-mm-dd (início do intervalo)
	dateTo?: string; // yyyy-mm-dd (fim do intervalo)
	mode?: RideMode;
};

export function searchRides(params: SearchParams): Ride[] {
	const { db } = useDbStore.getState();
	let rides = db.rides.filter(
		(r) =>
			r.status === 'programada' &&
			r.seatsTaken < r.seatsTotal &&
			Date.parse(r.departure) > Date.now(),
	);

	// discriminação útil: coberta, não cheia, ordenada pela proximidade
	rides = rides.filter((r) => covers(r, params));

	if (params.mode) {
		rides = rides.filter((r) => rideMode(r) === params.mode);
	}

	if (params.dateFrom || params.dateTo) {
		rides = rides.filter((r) => {
			const day = r.departure.slice(0, 10);
			if (params.dateFrom && day < params.dateFrom) return false;
			if (params.dateTo && day > params.dateTo) return false;
			return true;
		});
	} else if (params.date) {
		rides = rides.filter((r) => r.departure.slice(0, 10) === params.date);
	}

	return rides.sort(
		(a, b) => Date.parse(a.departure) - Date.parse(b.departure),
	);
}

export function nextDays(count = 4): string[] {
	const days: string[] = [];
	for (let i = 0; i < count; i++) {
		const d = new Date();
		d.setDate(d.getDate() + i);
		days.push(d.toISOString().slice(0, 10));
	}
	return days;
}

// Estima o trajeto de uma viagem: origem → paragens → destino, com hora e km
// por paragem. A distância total vem das coordenadas representativas das
// províncias; paragens sem coordenadas recebem km proporcional à ordem.
// Partilhado entre a pista ao vivo da publicação e o createRide.
export function estimateRoute(input: {
	originLocalityId: string;
	destinationLocalityId: string;
	departureISO: string;
	stops?: RouteStopInput[];
}): {
	origin: RouteStop;
	stops: RouteStop[];
	destination: RouteStop;
	distanceKm: number;
} {
	const originLoc = localityById(input.originLocalityId);
	const destLoc = localityById(input.destinationLocalityId);
	const dep = new Date(input.departureISO);
	dep.setSeconds(0, 0);

	const originCoords = PROVINCE_COORDS[originLoc.province];
	const destCoords = PROVINCE_COORDS[destLoc.province];
	const distanceKm = Math.max(
		25,
		Math.round(
			Math.abs((destCoords?.lng ?? 0) - (originCoords?.lng ?? 0)) * 95 +
				Math.abs((destCoords?.lat ?? 0) - (originCoords?.lat ?? 0)) *
					111,
		),
	);

	const origin: RouteStop = {
		localityId: originLoc.id,
		name: originLoc.municipality,
		time: hhmmText(dep.getTime()),
		km: 0,
	};

	const stops: RouteStop[] = (input.stops ?? [])
		.map((s, i) => {
			const n = (input.stops ?? []).length;
			const km = Math.round(((i + 1) / (n + 1)) * distanceKm);
			const name = s.name.trim() || localityById(s.localityId ?? '').name;
			return {
				localityId: s.localityId ?? '',
				name,
				time: hhmmText(dep.getTime() + km * 1.05 * 60000),
				km,
			};
		})
		.filter((s) => s.name.length > 0);

	const arrival = new Date(dep.getTime() + distanceKm * 1.22 * 60000);
	const destination: RouteStop = {
		localityId: destLoc.id,
		name: destLoc.municipality,
		time: hhmmText(arrival.getTime()),
		km: distanceKm,
	};

	return { origin, stops, destination, distanceKm };
}

export function createRide(input: RideInput): Ride {
	const { origin, stops, destination, distanceKm } = estimateRoute({
		originLocalityId: input.originLocalityId,
		destinationLocalityId: input.destinationLocalityId,
		departureISO: input.departureISO,
		stops: input.stops,
	});

	const dep = new Date(input.departureISO);
	dep.setSeconds(0, 0);

	const arrivalMs = input.arrivalISO
		? new Date(input.arrivalISO).getTime()
		: dep.getTime() + distanceKm * 1.22 * 60000;

	const ride: Ride = {
		id: UID.next('ride'),
		driverId: input.driverId,
		routeName: `${origin.name} → ${destination.name}`,
		origin,
		stops,
		destination: { ...destination, time: hhmmText(arrivalMs) },
		departure: dep.toISOString(),
		arrival: new Date(arrivalMs).toISOString(),
		seatsTotal: input.seatsTotal,
		seatsTaken: 0,
		pricePerSeat: input.pricePerSeat,
		status: 'programada',
		vinculos: [],
		createdAt: nowISO(),
	};

	useDbStore.getState().mutate((db) => {
		db.rides.push(ride);
	});
	return ride;
}

function hhmmText(ms: number): string {
	const t = new Date(ms);
	return `${String(t.getHours()).padStart(2, '0')}:${String(
		t.getMinutes(),
	).padStart(2, '0')}`;
}

export function setVinculo(rideId: string, vinculo: string): void {
	useDbStore.getState().mutate((db) => {
		const ride = db.rides.find((r) => r.id === rideId);
		if (ride && !ride.vinculos.includes(vinculo)) {
			ride.vinculos.push(vinculo);
		}
	});
}

export function rideProgress(ride: Ride): number {
	const stepCount = 1 + ride.stops.length + 1;
	const done = ride.vinculos.length;
	return Math.max(0, Math.min(1, (done / stepCount) * 0.9));
}
