import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '../../lib/queryKeys';
import { useThemeColors } from '../../hooks/useThemeColors';
import BackButton from '../../components/BackButton';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import RouteStrip, { StripStop } from '../../components/RouteStrip';
import SectionTitle from '../../components/SectionTitle';
import BoleiaButton from '../../components/BoleiaButton';
import {
	getRide,
	listRideBookings,
	setRideProgress,
	finishRide,
} from '../../lib/api';
import { apiErrorMessage } from '../../lib/api';
import { toRide, rideProgressFraction } from '../../lib/rideMapper';
import {
	getSocket,
	joinTripRoom,
	leaveTripRoom,
	rejoinTripRoomOnReconnect,
	TripEventName,
} from '../../lib/socket';
import { useSessionUserId } from '../../hooks/useSessionUser';

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
	const queryClient = useQueryClient();
	const rideId = route.params.rideId;

	const [live, setLive] = useState(false);
	const [busy, setBusy] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);

	const { data: apiRide, isLoading } = useQuery({
		queryKey: qk.ride.of(rideId),
		queryFn: () => getRide(rideId),
	});

	const ride = apiRide ? toRide(apiRide) : undefined;

	/*
	 * Motorista por posse, não por preferência.
	 *
	 * `currentRole` é o botão "estou a conduzir" do perfil: qualquer passageiro o
	 * pode ligar. Gatear os controlos por aí mostrava-os a quem conduz e
	 * escondia-os de quem conduz com o interruptor desligado.
	 */ const sessionUserId = useSessionUserId();
	const isDriver = !!ride && ride.driverId === sessionUserId;

	// O motorista precisa de saber quantas pessoas seguem a bordo. A identidade
	// dos passageiros não vem no payload, por isso mostramos a contagem.
	const { data: bookings } = useQuery({
		queryKey: qk.rideBookings.of(rideId),
		queryFn: () => listRideBookings(rideId),
		enabled: isDriver,
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
			void queryClient.invalidateQueries({
				queryKey: qk.ride.of(rideId),
			});
		};
		const onDisconnect = () => setLive(false);
		const onConnect = () => setLive(true);

		socket.on('connect', onConnect);
		socket.on('disconnect', onDisconnect);
		socket.on(TripEventName.RIDE_SNAPSHOT, refresh);
		socket.on(TripEventName.RIDE_PROGRESS, refresh);
		socket.on(TripEventName.RIDE_STARTED, refresh);
		socket.on(TripEventName.RIDE_FINISHED, refresh);
		socket.on(TripEventName.RIDE_CANCELLED, refresh);

		return () => {
			socket.off('connect', onConnect);
			socket.off('disconnect', onDisconnect);
			socket.off(TripEventName.RIDE_SNAPSHOT, refresh);
			socket.off(TripEventName.RIDE_PROGRESS, refresh);
			socket.off(TripEventName.RIDE_STARTED, refresh);
			socket.off(TripEventName.RIDE_FINISHED, refresh);
			socket.off(TripEventName.RIDE_CANCELLED, refresh);
			leaveTripRoom(rideId);
		};
	}, [rideId, queryClient]);

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

	/*
	 * Quantas paragens existem, para o servidor e para o cliente contarem igual.
	 *
	 * `countStops` do servidor inclui ORIGIN e DESTINATION, e `ride.stops` no
	 * cliente só tem as intermédias — daí o `+ 2`. O mesmo `+ 2` está em
	 * `rideProgressFraction`. Com `+ 1` aqui, o botão deixaria de funcionar
	 * exactamente na última paragem, que é a que mais interessa marcar.
	 */
	const totalStops = ride.stops.length + 2;
	const lastIndex = totalStops - 1;
	const isAtLastStop = ride.progressIndex >= lastIndex;

	const advance = async () => {
		if (busy) return;
		setBusy('progress');
		setActionError(null);
		try {
			await setRideProgress(
				ride.id,
				Math.min(ride.progressIndex + 1, lastIndex),
			);
			await queryClient.invalidateQueries({
				queryKey: qk.ride.of(rideId),
			});
			await queryClient.invalidateQueries({ queryKey: qk.myRides.all });
		} catch (e) {
			setActionError(
				apiErrorMessage(e, 'Não foi possível marcar a paragem.'),
			);
		} finally {
			setBusy(null);
		}
	};

	const finish = async () => {
		if (busy) return;
		setBusy('finish');
		setActionError(null);
		try {
			await finishRide(ride.id);
			await queryClient.invalidateQueries({
				queryKey: qk.ride.of(rideId),
			});
			await queryClient.invalidateQueries({ queryKey: qk.myRides.all });
			await queryClient.invalidateQueries({
				queryKey: qk.rideBookings.of(rideId),
			});
		} catch (e) {
			setActionError(
				apiErrorMessage(e, 'Não foi possível terminar a viagem.'),
			);
		} finally {
			setBusy(null);
		}
	};

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

				{isDriver ? (
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
				) : null}

				{/*
				 * Os controlos da viagem só existem para quem conduz, e só
				 * durante. Sem isto, uma corrida iniciada na app não podia ser
				 * avançada nem terminada: as funções existiam, o botão é que
				 * não estava em lado nenhum, e `IN_PROGRESS → COMPLETED` só
				 * acontecia a partir de um `PATCH` à mão.
				 */}
				{isDriver && ride.status === 'em_curso' ? (
					<View className="mt-5">
						<SectionTitle>Viagem</SectionTitle>

						{!isAtLastStop ? (
							<BoleiaButton
								title={`Marcar ${stops[ride.progressIndex + 1]?.place ?? 'a paragem'} como alcançada`}
								onPress={advance}
								loading={busy === 'progress'}
								disabled={busy !== null}
							/>
						) : (
							<Text
								className="font-sans text-body-small"
								style={{ color: themeColors.secondary }}
							>
								Última paragem alcançada.
							</Text>
						)}

						<View className="mt-2">
							<BoleiaButton
								title="Terminar viagem"
								variant="outline"
								onPress={finish}
								loading={busy === 'finish'}
								disabled={busy !== null}
							/>
						</View>

						{actionError ? (
							<Text
								role="alert"
								className="font-sans text-body-small mt-2"
								style={{ color: themeColors.error }}
							>
								{actionError}
							</Text>
						) : null}
					</View>
				) : null}

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
