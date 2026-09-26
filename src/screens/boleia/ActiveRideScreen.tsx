import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useThemeColors } from '../../hooks/useThemeColors';
import BackButton from '../../components/BackButton';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import RouteStrip, { StripStop } from '../../components/RouteStrip';
import SectionTitle from '../../components/SectionTitle';
import { getRide, listRideBookings } from '../../lib/api';
import { toRide, rideProgressFraction } from '../../lib/rideMapper';
import {
	getSocket,
	joinTripRoom,
	leaveTripRoom,
	rejoinTripRoomOnReconnect,
	TripEventName,
} from '../../lib/socket';
import { useAppStore } from '../../store/appStore';

/**
 * Acompanhamento ao vivo de uma corrida.
 *
 * A corrida é lida por REST e o progresso chega por WebSocket: o motorista
 * avança a paragem com `PATCH /api/rides/:id/progress` e todos os que estão
 * na sala vêem o marcador mover-se sem recarregar. A ligação é refeita e a
 * sala reentrada ao reconectar, porque o servidor esquece as salas de cada
 * socket.
 */
export default function ActiveRideScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'ActiveRide'>
		>();
	const route = useRoute<RouteProp<BoleiaMainStackParamList, 'ActiveRide'>>();
	const { themeColors } = useThemeColors();
	const currentRole = useAppStore((s) => s.currentRole);
	const queryClient = useQueryClient();
	const rideId = route.params.rideId;

	const [live, setLive] = useState(false);

	const { data: apiRide, isLoading } = useQuery({
		queryKey: ['ride', rideId],
		queryFn: () => getRide(rideId),
	});

	// O motorista precisa de saber quantas pessoas seguem a bordo. A identidade
	// dos passageiros não vem no payload, por isso mostramos a contagem.
	const { data: bookings } = useQuery({
		queryKey: ['rideBookings', rideId],
		queryFn: () => listRideBookings(rideId),
		enabled: currentRole === 'driver',
	});
	const onBoardCount = useMemo(
		() =>
			(bookings ?? []).filter(
				(b) => b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS',
			).length,
		[bookings],
	);

	useEffect(() => {
		const socket = getSocket();
		if (!socket) {
			return;
		}
		joinTripRoom(rideId);
		rejoinTripRoomOnReconnect(rideId);
		setLive(socket.connected);

		// Cada evento invalida a cache da corrida, em vez de tentar replicar
		// aqui a mesma lógica de mapeamento que o `toRide` faz. O servidor é a
		// fonte de verdade e a resposta é sempre coerente.
		const refresh = () => {
			setLive(true);
			void queryClient.invalidateQueries({ queryKey: ['ride', rideId] });
		};
		const onDisconnect = () => setLive(false);
		const onConnect = () => setLive(true);

		socket.on('connect', onConnect);
		socket.on('disconnect', onDisconnect);
		socket.on(TripEventName.RIDE_PROGRESS, refresh);
		socket.on(TripEventName.RIDE_STARTED, refresh);
		socket.on(TripEventName.RIDE_FINISHED, refresh);
		socket.on(TripEventName.RIDE_CANCELLED, refresh);

		return () => {
			socket.off('connect', onConnect);
			socket.off('disconnect', onDisconnect);
			socket.off(TripEventName.RIDE_PROGRESS, refresh);
			socket.off(TripEventName.RIDE_STARTED, refresh);
			socket.off(TripEventName.RIDE_FINISHED, refresh);
			socket.off(TripEventName.RIDE_CANCELLED, refresh);
			leaveTripRoom(rideId);
		};
	}, [rideId, queryClient]);

	const ride = apiRide ? toRide(apiRide) : undefined;

	if (!ride) {
		return (
			<SafeAreaView
				className="flex-1 items-center justify-center px-5"
				style={{ backgroundColor: themeColors.background }}
			>
				<Text style={{ color: themeColors.secondary }}>
					{isLoading
						? 'A carregar a viagem…'
						: 'Viagem não encontrada.'}
				</Text>
			</SafeAreaView>
		);
	}

	if (ride.status === 'cancelada') {
		return (
			<SafeAreaView
				className="flex-1 items-center justify-center px-5"
				style={{ backgroundColor: themeColors.background }}
			>
				<Text style={{ color: themeColors.secondary }}>
					Esta viagem foi cancelada.
				</Text>
			</SafeAreaView>
		);
	}

	const progress =
		ride.status === 'em_curso'
			? rideProgressFraction(ride)
			: ride.status === 'concluida'
				? 1
				: 0;

	const stops: StripStop[] = [
		{
			...ride.origin,
			kind: 'origin',
			place: ride.origin.name,
			time: ride.origin.time,
			km: '',
		},
		...ride.stops.map((s, i) => ({
			place: s.name,
			time: s.time,
			km: '',
			kind: 'stop' as const,
			key: i,
		})),
		{
			...ride.destination,
			kind: 'destination',
			place: ride.destination.name,
			time: ride.destination.time,
			km: '',
		},
	];

	// A pista é actualizada só quando o servidor a manda, pelo que o
	// diagnóstico de rede vale mais do que um "ligado" permanente.
	const liveLabel = live ? 'Ao vivo' : 'Sem ligação';

	return (
		<SafeAreaView
			className="flex-1 px-5"
			style={{ backgroundColor: themeColors.background }}
		>
			<View className="flex-row items-center pt-2 pb-3">
				<BackButton onPress={() => navigation.goBack()} />
				<View className="flex-1">
					<Text
						className="font-sansMedium text-body-xs"
						style={{ color: themeColors.secondary }}
					>
						Viagem ao vivo
					</Text>
					<Text
						className="font-sansExtraBold text-title-tertiary -mt-0.5"
						style={{ color: themeColors.text }}
					>
						{ride.routeName}
					</Text>
				</View>
				<View className="items-end">
					<View className="flex-row items-center mb-0.5">
						<View
							className="w-2 h-2 rounded-full mr-1.5"
							style={{
								backgroundColor: live
									? themeColors.success
									: themeColors.border,
							}}
						/>
						<Text
							className="font-sansMedium text-body-xs"
							style={{
								color: live
									? themeColors.success
									: themeColors.secondary,
							}}
						>
							{liveLabel}
						</Text>
					</View>
				</View>
			</View>

			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingBottom: 48 }}
			>
				{ride.status === 'em_curso' && (
					<Text
						className="font-sans text-body-small mb-3"
						style={{ color: themeColors.secondary }}
					>
						{/*
						 * O progresso vem do servidor, que só o avança quando o
						 * motorista confirma a paragem. Dizer que a "pista
						 * enche" seria prometer algo que a app não mede.
						 */}
						O ponto no percurso é actualizado pelo motorista a cada
						paragem.
					</Text>
				)}
				<View
					className="p-4 rounded-xl border"
					style={{
						borderColor: themeColors.border,
						backgroundColor: themeColors.card,
					}}
				>
					<RouteStrip
						origin={stops[0]}
						stops={stops.slice(1, -1)}
						destination={stops[stops.length - 1]}
						progress={progress}
					/>
				</View>

				{currentRole === 'driver' && (
					<View className="mt-5">
						<SectionTitle>Bordo</SectionTitle>
						<View
							className="p-3 rounded-xl border"
							style={{
								borderColor: themeColors.border,
								backgroundColor: themeColors.card,
							}}
						>
							<Text
								className="font-sans text-body-small"
								style={{ color: themeColors.secondary }}
							>
								{onBoardCount === 0
									? 'Ainda sem passageiros confirmados.'
									: `${onBoardCount} passageiro${onBoardCount === 1 ? '' : 's'} a bordo.`}
							</Text>
						</View>
					</View>
				)}

				{/* Segurança */}
				<View className="mt-6">
					<SectionTitle>Segurança</SectionTitle>
					<View className="flex-row">
						<Pressable
							onPress={async () => {
								try {
									await Share.share({
										message: `Estou a viajar na Boleia: ${ride.routeName}.`,
									});
								} catch {
									// o utilizador cancelou a partilha
								}
							}}
							className="flex-1 mr-2 items-center py-3.5 rounded-xl border"
							style={{
								borderColor: themeColors.border,
								backgroundColor: themeColors.card,
							}}
						>
							<Ionicons
								name="share-outline"
								size={22}
								color={themeColors.text}
							/>
							<Text
								className="font-sansMedium text-body-xs mt-1"
								style={{ color: themeColors.text }}
							>
								Partilhar viagem
							</Text>
						</Pressable>
						<View
							className="flex-1 items-center py-3.5 rounded-xl"
							style={{
								backgroundColor: themeColors.background,
								borderWidth: 1,
								borderColor: themeColors.border,
							}}
						>
							<Ionicons
								name="alert-circle-outline"
								size={22}
								color={themeColors.border}
							/>
							<Text
								className="font-sansMedium text-body-xs mt-1"
								style={{ color: themeColors.secondary }}
							>
								SOS em breve
							</Text>
						</View>
					</View>
					<Text
						className="font-sans text-body-xs mt-2"
						style={{ color: themeColors.secondary }}
					>
						A central de emergência ainda não está disponível. Numa
						situação de perigo, liga directamente para os serviços
						de emergência locais.
					</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
