import type { ApiBooking, ApiRide, ApiRideStop } from './api';
import type {
	Booking,
	BookingStatus,
	PaymentKind,
	Ride,
	RouteStop,
} from '../types/boleia';

/**
 * Adapta a resposta do backend ao `Ride` que os componentes esperam.
 *
 * O backend devolve as paragens num array ordenado por `sequence`, enquanto a
 * app desenha origem, intermédias e destino em campos separados. Adaptar aqui
 * em vez de mudar os componentes evita espalhar o formato do backend por todo
 * o código de apresentação.
 */
export function toRide(ride: ApiRide): Ride {
	const stops = ride.stops ?? [];
	const origin = stops.find((s) => s.kind === 'ORIGIN');
	const destination = stops.find((s) => s.kind === 'DESTINATION');
	const intermediate = stops
		.filter((s) => s.kind === 'INTERMEDIATE')
		.map(toRouteStop);

	return {
		id: ride.id,
		driverId: ride.driverId,
		routeName: ride.routeName,
		// Uma corrida sem paragens é um dado incoerente do servidor, não uma
		// corrida sem origem. Usar o `routeName` evita renderizar campos vazios.
		origin: origin ? toRouteStop(origin) : fallbackStop(ride, 'Origem'),
		stops: intermediate,
		destination: destination
			? toRouteStop(destination)
			: fallbackStop(ride, 'Destino'),
		departure: ride.departureAt,
		arrival: ride.arrivalAt,
		seatsTotal: ride.seatsTotal,
		seatsTaken: ride.seatsTaken,
		pricePerSeat: ride.pricePerSeat,
		status: toRideStatus(ride.status),
		// `vinculos` só existia na simulação de mock; o acompanhamento real vem
		// por WebSocket, logo fica vazio.
		vinculos: [],
		// Paragem em que a corrida está, usada para o progresso e o marcador.
		progressIndex: ride.progressIndex ?? 0,
		createdAt: ride.departureAt,
	};
}

/**
 * Adapta a reserva do backend ao `Booking` que os cartões esperam.
 *
 * Os estados vêm em maiúsculas do servidor e a UI usa rótulos em português.
 * `pickStopIndex`/`dropStopIndex` são opcionais no servidor: quando o
 * passageiro não escolhe, assume a origem e o destino da corrida.
 */
export function toBooking(booking: ApiBooking): Booking {
	return {
		id: booking.id,
		rideId: booking.rideId,
		passengerId: booking.passengerId,
		seats: booking.seats,
		amount: booking.amount,
		paymentMethod: toPaymentKind(booking.paymentMethod),
		pickStopIndex: booking.pickStopIndex ?? 0,
		dropStopIndex: booking.dropStopIndex ?? 0,
		status: toBookingStatus(booking.status),
		// Motivo de recusa ou cancelamento: é o que a app mostra para explicar
		// ao passageiro porque é que o pedido não avançou.
		reason: booking.reason,
		createdAt: booking.createdAt,
		updatedAt: booking.createdAt,
	};
}

/**
 * O backend conhece `WALLET` e `MULTICAIXA`, mas a v1 da app só usa dinheiro.
 * Os restantes mapeiam-se assim mesmo, para que uma reserva feita noutro
 * cliente continue legível em vez de cair num `default` silencioso.
 */
function toPaymentKind(method: ApiBooking['paymentMethod']): PaymentKind {
	switch (method) {
		case 'WALLET':
			return 'carteira';
		case 'MULTICAIXA':
			return 'multicaixa';
		default:
			return 'dinheiro';
	}
}

function toBookingStatus(status: ApiBooking['status']): BookingStatus {
	switch (status) {
		case 'REQUESTED':
			return 'pedido';
		case 'CONFIRMED':
			return 'confirmada';
		case 'IN_PROGRESS':
			return 'em_viagem';
		case 'COMPLETED':
			return 'concluida';
		case 'REJECTED':
			return 'recusada';
		case 'CANCELLED':
			return 'cancelada';
		default:
			return 'expirada';
	}
}

/** Lugares ainda disponíveis. */
export function seatsLeft(ride: Ride): number {
	return Math.max(0, ride.seatsTotal - ride.seatsTaken);
}

/**
 * Progresso da corrida, de 0 a 1, a partir da paragem em que está.
 *
 * Substituía `rideProgress`, que media os vínculos da simulação. Agora a paragem
 * é real e vem do backend (`progressIndex`, também actualizado por WebSocket),
 * por isso o progresso é a fracção do percurso já percorrida.
 */
export function rideProgressFraction(ride: Ride): number {
	const steps = ride.stops.length + 2; // origem + intermédias + destino
	if (steps <= 0) return 0;
	const done = Math.min(ride.progressIndex ?? 0, steps - 1);
	return Math.max(0, Math.min(1, done / (steps - 1)));
}

function toRouteStop(stop: ApiRideStop): RouteStop {
	return {
		localityId: stop.localityId ?? '',
		name: stop.name,
		// O backend já devolve a hora em WAT formatada; o mock guardava "HH:MM"
		// e a app compõe a linha "sai 08:30 · Talatona".
		time: stop.timeLabel,
		km: 0,
	};
}

function fallbackStop(ride: ApiRide, label: string): RouteStop {
	return {
		localityId: '',
		name: label,
		time: '',
		km: 0,
	};
}

/**
 * Traduz o estado do backend para o que a UI sabe mostrar.
 *
 * A app conhece os quatro estados; qualquer valor novo que o servidor
 * introduza é tratado como agendado, que é o estado mais próximo de "ainda
 * não aconteceu" e evita mostrar um estado vazio no cartão.
 */
function toRideStatus(status: ApiRide['status']): Ride['status'] {
	switch (status) {
		case 'IN_PROGRESS':
			return 'em_curso';
		case 'COMPLETED':
			return 'concluida';
		case 'CANCELLED':
			return 'cancelada';
		default:
			return 'programada';
	}
}
