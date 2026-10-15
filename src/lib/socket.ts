import { io, Socket } from 'socket.io-client';
import { API_URL } from '@env';
import { sessionTokenOrNull } from './auth-cookie';

let socket: Socket | null = null;
let currentToken: string | null = null;

/**
 * Eventos emitidos pelo gateway `/trips` do backend.
 *
 * As chaves têm de coincidir com `RideEvent` em `back/src/rides/ride-events.ts`.
 * Os eventos de corrida chegam a toda a gente na sala; os de reserva são
 *filtrados por `isForCurrentUser` porque a sala inclui driver e passageiro.
 */
export const TripEventName = {
	RIDE_SNAPSHOT: 'ride:snapshot',
	RIDE_STARTED: 'ride:started',
	RIDE_PROGRESS: 'ride:progress',
	RIDE_FINISHED: 'ride:finished',
	RIDE_CANCELLED: 'ride:cancelled',
	BOOKING_CREATED: 'booking:created',
	BOOKING_DECIDED: 'booking:decided',
	BOOKING_CANCELLED: 'booking:cancelled',
} as const;

export type TripEventName = (typeof TripEventName)[keyof typeof TripEventName];

/** Quando o utilizador entra ou sai da sala de uma corrida. */
export const RoomEvent = {
	JOIN: 'join:trip',
	LEAVE: 'leave:trip',
} as const;

export function getSocket(): Socket | null {
	return socket;
}

export function isSocketConnected(): boolean {
	return socket?.connected === true;
}

/**
 * Abre (ou reabre) a ligação ao gateway.
 *
 * O token vem do cookie que o `expoClient` guarda, e é lido a cada tentativa em
 * vez de numa constante de módulo: uma sessão nova não pode continuar a usar o
 * token antigo, porque o gateway rejeita a ligação e o `reconnection` do socket
 * não conseguiria corrigir isso sozinho.
 *
 * O gateway só aceita Bearer no *handshake* e não olha para cookies, e é por isso
 * que o valor do cookie é que vai lá — a ponte entre os dois está em
 * `auth-cookie.ts`, e é a mesma que dá o header `Cookie` ao axios.
 */
export async function connectSocket(): Promise<Socket | null> {
	const token = await sessionTokenOrNull();
	if (!token) {
		return null;
	}
	// Uma ligação viva com o mesmo token é reutilizada tal como está.
	if (socket?.connected && currentToken === token) {
		return socket;
	}
	if (socket) {
		socket.removeAllListeners();
		socket.disconnect();
	}

	currentToken = token;
	socket = io(`${API_URL}/trips`, {
		auth: { token },
		transports: ['websocket'],
		reconnection: true,
		reconnectionAttempts: 10,
		reconnectionDelay: 2000,
	});

	return socket;
}

export function disconnectSocket(): void {
	if (socket) {
		socket.removeAllListeners();
		socket.disconnect();
		socket = null;
	}
	currentToken = null;
}

/** Entra na sala de uma corrida para receber os eventos ao vivo. */
export function joinTripRoom(rideId: string): void {
	socket?.emit(RoomEvent.JOIN, rideId);
}

export function leaveTripRoom(rideId: string): void {
	socket?.emit(RoomEvent.LEAVE, rideId);
}

/**
 * A sala de uma corrida inclui o motorista e os passageiros com reserva
 * aceite, por isso um `booking:decided` não é necessariamente sobre este
 * utilizador. O `passengerId` presente no payload é o que permite filtrar.
 */
export function isForCurrentUser(
	payload: { passengerId?: string } | null | undefined,
	userId: string | null | undefined,
): boolean {
	if (!payload || !userId) {
		return false;
	}
	return payload.passengerId === userId;
}

/**
 * Re-entra na sala quando a ligação volta.
 *
 * Sem isto, uma queda de rede deixava o ecrã de acompanhamento em silêncio
 * até a app ser reaberta, porque o servidor esquece as salas de cada socket.
 */
export function rejoinTripRoomOnReconnect(rideId: string): void {
	if (socket) {
		socket.on('connect', () => joinTripRoom(rideId));
	}
}
