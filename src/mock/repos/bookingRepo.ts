// Reservas — pedido, confirmação, recusa, cancelamento, carteira e avisos
import { useDbStore } from '../db';
import { UID, nowISO } from '../helpers';
import { Booking, PaymentKind, InAppNotification } from '../../types/boleia';
import { rideById } from './rideRepo';

const AUTO_CONFIRM_MS = 6000; // demo: motorista "aceita rápido" se não agir

export type BookRequest = {
	rideId: string;
	passengerId: string;
	seats: number;
	paymentMethod: PaymentKind;
	pickStopIndex: number;
	dropStopIndex: number;
};

export type BookResult =
	| { ok: true; bookingId: string }
	| { ok: false; error: 'cheia' | 'sem_fundos' | 'inválida' };

function userName(id: string): string {
	const user = useDbStore.getState().db.users.find((u) => u.id === id);
	return user ? `${user.firstName} ${user.lastName}`.trim() : id;
}

function notify(
	userId: string,
	kind: InAppNotification['kind'],
	title: string,
	message: string,
	data: Record<string, string> | null,
) {
	const n: InAppNotification = {
		id: UID.next('nt'),
		userId,
		kind,
		title,
		message,
		data,
		read: false,
		createdAt: nowISO(),
	};
	useDbStore.getState().mutate((db) => {
		db.notifications.unshift(n);
		if (db.notifications.length > 24) db.notifications.pop();
	});
}

function refund(passengerId: string, amount: number, reference: string) {
	useDbStore.getState().mutate((db) => {
		const user = db.users.find((u) => u.id === passengerId);
		if (user) user.wallet += amount;
		db.transactions.unshift({
			id: UID.next('tx'),
			userId: passengerId,
			kind: 'credito',
			amount,
			reference,
			bookingId: null,
			createdAt: nowISO(),
		});
	});
}

export function requestBooking(req: BookRequest): BookResult {
	const ride = rideById(req.rideId);
	if (!ride || ride.status !== 'programada' || req.seats <= 0) {
		return { ok: false, error: 'inválida' };
	}
	const available = ride.seatsTotal - ride.seatsTaken;
	if (available < req.seats) return { ok: false, error: 'cheia' };

	const { db } = useDbStore.getState();
	const passenger = db.users.find((u) => u.id === req.passengerId);
	const amount = req.seats * ride.pricePerSeat;

	if (req.paymentMethod === 'carteira') {
		if (!passenger || passenger.wallet < amount) {
			return { ok: false, error: 'sem_fundos' };
		}
		// reserva retirada da carteira
		useDbStore.getState().mutate((d) => {
			const u = d.users.find((x) => x.id === req.passengerId);
			if (u) u.wallet -= amount;
			d.transactions.unshift({
				id: UID.next('tx'),
				userId: req.passengerId,
				kind: 'debito',
				amount,
				reference: `Reserva ${ride.routeName} (${req.seats} lugar${req.seats > 1 ? 'es' : ''})`,
				bookingId: null,
				createdAt: nowISO(),
			});
		});
	}

	const booking: Booking = {
		id: UID.next('bk'),
		rideId: req.rideId,
		passengerId: req.passengerId,
		seats: req.seats,
		amount,
		paymentMethod: req.paymentMethod,
		pickStopIndex: req.pickStopIndex,
		dropStopIndex: req.dropStopIndex,
		status: 'pedido',
		reason: null,
		createdAt: nowISO(),
		updatedAt: nowISO(),
	};

	useDbStore.getState().mutate((d) => {
		d.bookings.unshift(booking);
	});

	notify(
		req.passengerId,
		'booking',
		'Pedido enviado',
		`Estás na fila do ${ride.routeName}. O motorista ${userName(ride.driverId)} decide em breve.`,
		{ rideId: ride.id, bookingId: booking.id },
	);

	scheduleAutoConfirm(booking.id);
	return { ok: true, bookingId: booking.id };
}

function scheduleAutoConfirm(bookingId: string) {
	setTimeout(() => {
		const booking = useDbStore
			.getState()
			.db.bookings.find((b) => b.id === bookingId);
		if (booking && booking.status === 'pedido') {
			confirmBooking(bookingId);
		}
	}, AUTO_CONFIRM_MS);
}

export function confirmBooking(bookingId: string): void {
	useDbStore.getState().mutate((db) => {
		const booking = db.bookings.find((b) => b.id === bookingId);
		if (!booking || booking.status !== 'pedido') return;
		const ride = db.rides.find((r) => r.id === booking.rideId);
		if (!ride || ride.status !== 'programada') return;
		if (ride.seatsTotal - ride.seatsTaken < booking.seats) return;

		booking.status = 'confirmada';
		booking.updatedAt = nowISO();
		ride.seatsTaken += booking.seats;
	});
	const latest = useDbStore
		.getState()
		.db.bookings.find((b) => b.id === bookingId);
	if (!latest) return;
	const ride = rideById(latest.rideId);
	const driverName = ride ? userName(ride.driverId) : 'O motorista';
	notify(
		latest.passengerId,
		'booking',
		'Reserva confirmada',
		`${driverName} confirmou o teu lugar no ${ride?.routeName ?? 'trajeto'}. Apresenta o teu número ao embarcar.`,
		{ rideId: latest.rideId, bookingId: latest.id },
	);
}

export function declineBooking(bookingId: string, reason: string): void {
	let booking: Booking | undefined;
	useDbStore.getState().mutate((db) => {
		const b = db.bookings.find((x) => x.id === bookingId);
		if (!b) return;
		booking = b;
		b.status = 'recusada';
		b.reason = reason;
		b.updatedAt = nowISO();
	});
	if (!booking) return;
	if (booking.paymentMethod === 'carteira') {
		refund(
			booking.passengerId,
			booking.amount,
			`Reembolso · reserva recusada (${rideById(booking.rideId)?.routeName ?? ''})`,
		);
	}
	notify(
		booking.passengerId,
		'booking',
		'Reserva recusada',
		`O motorista recusou o teu pedido. ${reason ? `Motivo: ${reason}.` : ''} ${booking.paymentMethod === 'carteira' ? 'O valor foi devolvido à tua carteira.' : ''}`,
		{ rideId: booking.rideId, bookingId: booking.id },
	);
}

export function cancelBooking(
	bookingId: string,
	reason: string,
): { ok: boolean; error?: string } {
	let booking: Booking | undefined;
	useDbStore.getState().mutate((db) => {
		const b = db.bookings.find((x) => x.id === bookingId);
		if (!b) return;
		if (b.status === 'concluida' || b.status === 'em_viagem') {
			return;
		}
		booking = b;
		const wasConfirmed = b.status === 'confirmada';
		b.status = 'cancelada';
		b.reason = reason;
		b.updatedAt = nowISO();
		const ride = db.rides.find((r) => r.id === b.rideId);
		if (ride && wasConfirmed) {
			ride.seatsTaken = Math.max(0, ride.seatsTaken - b.seats);
		}
	});
	if (!booking) return { ok: false };
	if (booking.paymentMethod === 'carteira') {
		refund(
			booking.passengerId,
			booking.amount,
			`Reembolso · reserva cancelada (${rideById(booking.rideId)?.routeName ?? ''})`,
		);
	}
	return { ok: true };
}
