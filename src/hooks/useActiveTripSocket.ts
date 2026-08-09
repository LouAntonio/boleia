import { useEffect, useState, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { socketManager } from '../lib/socket-manager';
import { useQueryClient } from '@tanstack/react-query';
import { tripKeys } from '../lib/queryKeys';

interface UseActiveTripSocketOptions {
	tripId: string | undefined;
	enabled?: boolean;
}

export type DispatchStatus =
	| 'idle'
	| 'searching'
	| 'offering'
	| 'expired'
	| 'accepted'
	| 'no_drivers';

export function useActiveTripSocket({
	tripId,
	enabled = true,
}: UseActiveTripSocketOptions) {
	const accessToken = useAuthStore((state) => state.accessToken);
	const queryClient = useQueryClient();

	const [driverLocation, setDriverLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);
	const [dispatchStatus, setDispatchStatus] =
		useState<DispatchStatus>('idle');
	const [offeringDriverName, setOfferingDriverName] = useState<string | null>(
		null,
	);

	const cleanupFns = useRef<(() => void)[]>([]);

	const connect = useCallback(() => {
		if (!accessToken) return;
		socketManager.connect(accessToken);
	}, [accessToken]);

	const disconnect = useCallback(() => {
		socketManager.disconnect();
	}, []);

	useEffect(() => {
		if (!enabled || !tripId || !accessToken) return;

		connect();
		socketManager.joinTrip(tripId);

		const off1 = socketManager.on('trip:status', () => {
			queryClient.invalidateQueries({
				queryKey: tripKeys.detail(tripId),
			});
		});

		const off2 = socketManager.on('trip:driver_assigned', () => {
			queryClient.invalidateQueries({
				queryKey: tripKeys.detail(tripId),
			});
		});

		const off3 = socketManager.on('trip:location', (data) => {
			setDriverLocation({ lat: data.lat, lng: data.lng });
		});

		const off4 = socketManager.on('trip:delivery_status', () => {
			queryClient.invalidateQueries({
				queryKey: tripKeys.detail(tripId),
			});
		});

		const off5 = socketManager.on('trip:payment_update', () => {
			queryClient.invalidateQueries({
				queryKey: tripKeys.detail(tripId),
			});
		});

		const off6 = socketManager.on('trip:no_drivers', (data) => {
			setDispatchStatus('no_drivers');
			Alert.alert(
				'Sem motoristas',
				data.message || 'Nenhum motorista disponível no momento.',
			);
		});

		const off7 = socketManager.on('trip:offer', (data) => {
			setDispatchStatus('offering');
			setOfferingDriverName(data.driverName);
			queryClient.invalidateQueries({
				queryKey: tripKeys.detail(tripId),
			});
		});

		const off8 = socketManager.on('trip:offer_accepted', () => {
			setDispatchStatus('accepted');
			setOfferingDriverName(null);
			queryClient.invalidateQueries({
				queryKey: tripKeys.detail(tripId),
			});
		});

		const off9 = socketManager.on('trip:offer_expired', () => {
			setDispatchStatus('expired');
			setOfferingDriverName(null);
			queryClient.invalidateQueries({
				queryKey: tripKeys.detail(tripId),
			});
		});

		const off10 = socketManager.on('trip:offer_rejected', () => {
			setDispatchStatus('expired');
			setOfferingDriverName(null);
			queryClient.invalidateQueries({
				queryKey: tripKeys.detail(tripId),
			});
		});

		const off11 = socketManager.on('error', (data) => {
			console.warn('[Socket error]', data.message);
		});

		cleanupFns.current = [
			off1,
			off2,
			off3,
			off4,
			off5,
			off6,
			off7,
			off8,
			off9,
			off10,
			off11,
		];

		return () => {
			socketManager.leaveTrip(tripId);
			for (const cleanup of cleanupFns.current) {
				cleanup();
			}
			cleanupFns.current = [];
			setDriverLocation(null);
			setDispatchStatus('idle');
			setOfferingDriverName(null);
		};
	}, [tripId, enabled, accessToken, connect, queryClient]);

	return {
		connect,
		disconnect,
		driverLocation,
		dispatchStatus,
		offeringDriverName,
	};
}
