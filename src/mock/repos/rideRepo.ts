// Viagens — pesquisa útil, publicação e evolução de estado
import { useDbStore } from '../db';
import { UID, nowISO, hhmm, toAscii } from '../helpers';
import { Ride, RouteStop } from '../../types/boleia';
import { localityById } from '../locale';

export type RideInput = {
	driverId: string;
	originLocalityId: string;
	destinationLocalityId: string;
	departureISO: string;
	seatsTotal: number;
	pricePerSeat: number;
};

export function rideById(id: string): Ride | undefined {
	return useDbStore.getState().db.rides.find((r) => r.id === id);
}

export function ridesForDriver(driverId: string): Ride[] {
	return useDbStore
		.getState()
		.db.rides.filter((r) => r.driverId === driverId);
}

// Uma viagem "serve" a procura se o trajeto cobre origem→destino pedidos.
function covers(ride: Ride, query: { from?: string; to?: string }): boolean {
	const names = [
		toAscii(ride.origin.name),
		...ride.stops.map((s) => toAscii(s.name)),
		toAscii(ride.destination.name),
	];
	const has = (q?: string) =>
		!q ||
		names.some(
			(name) => toAscii(q).length > 1 && name.includes(toAscii(q)),
		);
	return has(query.from) && has(query.to);
}

export type SearchParams = {
	from?: string; // município/localidade de partida
	to?: string; // município/localidade de chegada
	date?: string; // yyyy-mm-dd
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

	if (params.date) {
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

export function createRide(input: RideInput): Ride {
	const originLoc = localityById(input.originLocalityId);
	const destLoc = localityById(input.destinationLocalityId);
	const dep = new Date(input.departureISO);
	dep.setSeconds(0, 0);

	const buildStop = (loc: ReturnType<typeof localityById>, km: number) => {
		const t = new Date(dep.getTime() + km * 1.05 * 60000);
		return {
			localityId: loc.id,
			name: loc.municipality,
			time: `${String(t.getHours()).padStart(2, '0')}:${String(
				t.getMinutes(),
			).padStart(2, '0')}`,
			km,
		};
	};

	// trajeto simplificado: origem → (opcional 1 paragem) → destino
	const stops: RouteStop[] = [];
	const mid = insertMidStop(
		input.originLocalityId,
		input.destinationLocalityId,
	);
	const distanceKm = Math.round(
		Math.abs(destLoc.lng - originLoc.lng) * 95 +
			Math.abs(destLoc.lat - originLoc.lat) * 111,
	);

	const departure = dep.toISOString();
	const arrival = new Date(
		Date.parse(departure) + distanceKm * 1.22 * 60000,
	).toISOString();

	if (mid) {
		const midKm = Math.round(distanceKm * 0.45);
		stops.push({
			localityId: mid.id,
			name: mid.municipality,
			time: `${hhmmText(Date.parse(departure) + midKm * 1.05 * 60000)}`,
			km: midKm,
		});
	}

	const ride: Ride = {
		id: UID.next('ride'),
		driverId: input.driverId,
		routeName: `${originLoc.municipality} → ${destLoc.municipality}`,
		origin: buildStop(originLoc, 0),
		stops,
		destination: {
			localityId: destLoc.id,
			name: destLoc.municipality,
			time: hhmm(arrival),
			km: distanceKm,
		},
		departure,
		arrival,
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

function insertMidStop(
	_fromId: string,
	_toId: string,
): ReturnType<typeof localityById> | null {
	// paragens intermédias derivadas da trajetória (rota demo já as tem)
	return null;
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
