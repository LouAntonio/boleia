// Simulação "em tempo real" + segurança (SOS) — mock do canal live
import { useDbStore } from '../db';
import { UID, nowISO } from '../helpers';
import { InAppNotification, SosEvent } from '../../types/boleia';
import { rideById } from './rideRepo';

function notify(
	userId: string,
	kind: InAppNotification['kind'],
	title: string,
	message: string,
	data: Record<string, string> | null,
) {
	useDbStore.getState().mutate((db) => {
		db.notifications.unshift({
			id: UID.next('nt'),
			userId,
			kind,
			title,
			message,
			data,
			read: false,
			createdAt: nowISO(),
		});
	});
}

function stepCountFor(rideId: string): number {
	const ride = rideById(rideId);
	if (!ride) return 1;
	return 1 + ride.stops.length + 1; // origem + paragens + destino
}

// Motorista dá partida: a viagem deiça de programada e avança "ao vivo"
export function startRide(rideId: string): void {
	useDbStore.getState().mutate((db) => {
		const ride = db.rides.find((r) => r.id === rideId);
		if (!ride || ride.status !== 'programada') return;
		ride.status = 'em_curso';
		ride.vinculos = ['0'];

		for (const b of db.bookings) {
			if (b.rideId === rideId && b.status === 'confirmada') {
				b.status = 'em_viagem';
				b.updatedAt = nowISO();
			}
		}
	});
	const ride = rideById(rideId);
	if (!ride) return;
	notify(
		ride.driverId,
		'ride',
		'Viagem em curso',
		`A tua viagem ${ride.routeName} arrancou.`,
		{ rideId },
	);
	for (const b of useDbStore.getState().db.bookings) {
		if (b.rideId === rideId && b.status === 'em_viagem') {
			notify(
				b.passengerId,
				'ride',
				'Viagem começou',
				`O motorista arrancou no ${ride.routeName}. Segue a viagem em direto.`,
				{ rideId },
			);
		}
	}
}

// Avanço de 1 "vínculo" da estrada por tick; ao completar, a viagem conclui
export function advanceLive(): void {
	const stepFor = (rideId: string) => stepCountFor(rideId);
	const rides = useDbStore
		.getState()
		.db.rides.filter((r) => r.status === 'em_curso');

	for (const ride of rides) {
		const total = stepFor(ride.id);
		if (ride.vinculos.length >= total) {
			finalizeRide(ride.id);
			continue;
		}
		useDbStore.getState().mutate((db) => {
			const r = db.rides.find((x) => x.id === ride.id);
			if (r && r.status === 'em_curso') {
				r.vinculos.push(String(r.vinculos.length));
			}
		});
	}
}

// Chegada: reservas concluídas + motorista recebe o valor das boleias
function finalizeRide(rideId: string): void {
	let routeName = '';
	useDbStore.getState().mutate((db) => {
		const ride = db.rides.find((r) => r.id === rideId);
		if (!ride) return;
		routeName = ride.routeName;
		ride.status = 'concluida';

		for (const b of db.bookings) {
			if (b.rideId !== rideId) continue;
			if (b.status === 'em_viagem' || b.status === 'confirmada') {
				b.status = 'concluida';
				b.updatedAt = nowISO();
				const driver = db.users.find((u) => u.id === ride.driverId);
				if (driver) {
					const fee = Math.round(b.amount * 0.9);
					driver.wallet += fee;
					db.transactions.unshift({
						id: UID.next('tx'),
						userId: driver.id,
						kind: 'credito',
						amount: fee,
						reference: `Viagem concluída · ${ride.routeName}`,
						bookingId: b.id,
						createdAt: nowISO(),
					});
				}
				if (b.passengerId) {
					notify(
						b.passengerId,
						'ride',
						'Chegada',
						`Chegaste ao destino no ${ride.routeName}. Avalia o motorista para fechares a viagem.`,
						{ rideId },
					);
				}
			}
		}
	});
	notify(
		useDbStore.getState().db.rides.find((r) => r.id === rideId)?.driverId ??
			'',
		'ride',
		'Viagem concluída',
		`O ${routeName} terminou. O valor das boleias está na tua carteira.`,
		{ rideId },
	);
}

// ---- SOS ------------------------------------------------------------------
export function sendSos(
	rideId: string,
	fromUserId: string,
	message: string,
): SosEvent {
	const event: SosEvent = {
		id: UID.next('sos'),
		rideId,
		fromUserId,
		message,
		createdAt: nowISO(),
	};
	useDbStore.getState().mutate((db) => {
		db.sos.unshift(event);
	});
	return event;
}
