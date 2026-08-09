import {
	connectSocket,
	disconnectSocket,
	joinTripRoom,
	leaveTripRoom,
	getSocket,
} from './socket';
import type { SocketEventMap } from '../types/socket';

class SocketManager {
	private static instance: SocketManager;
	private tripRoomRefs = new Map<string, number>();
	private isConnected = false;
	private pendingRejoin = false;

	private constructor() {}

	static getInstance(): SocketManager {
		if (!SocketManager.instance) {
			SocketManager.instance = new SocketManager();
		}
		return SocketManager.instance;
	}

	connect(token: string) {
		if (this.isConnected) return;

		const socket = connectSocket(token);
		this.isConnected = true;
		this.pendingRejoin = false;

		socket.on('connect', () => {
			this.isConnected = true;
			if (this.pendingRejoin) {
				this.rejoinAllRooms();
				this.pendingRejoin = false;
			}
		});

		socket.on('disconnect', () => {
			this.isConnected = false;
			this.pendingRejoin = true;
		});

		socket.on('reconnect', () => {
			this.isConnected = true;
			if (this.pendingRejoin) {
				this.rejoinAllRooms();
				this.pendingRejoin = false;
			}
		});
	}

	disconnect() {
		if (this.tripRoomRefs.size > 0) {
			return;
		}
		disconnectSocket();
		this.isConnected = false;
		this.pendingRejoin = false;
	}

	joinTrip(tripId: string) {
		const current = this.tripRoomRefs.get(tripId) ?? 0;
		this.tripRoomRefs.set(tripId, current + 1);

		if (current === 0) {
			joinTripRoom(tripId);
		}
	}

	leaveTrip(tripId: string) {
		const current = this.tripRoomRefs.get(tripId) ?? 0;

		if (current <= 1) {
			this.tripRoomRefs.delete(tripId);
			leaveTripRoom(tripId);
		} else {
			this.tripRoomRefs.set(tripId, current - 1);
		}
	}

	on<K extends keyof SocketEventMap>(
		event: K,
		handler: (data: SocketEventMap[K]) => void,
	): () => void {
		const socket = getSocket();
		if (!socket) {
			return () => {};
		}

		const wrappedHandler = (data: SocketEventMap[K]) => {
			handler(data);
		};

		socket.on(event as string, wrappedHandler);

		return () => {
			socket.off(event as string, wrappedHandler);
		};
	}

	private rejoinAllRooms() {
		for (const tripId of this.tripRoomRefs.keys()) {
			joinTripRoom(tripId);
		}
	}
}

export const socketManager = SocketManager.getInstance();
