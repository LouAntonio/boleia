import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useThemeColors } from '../../hooks/useThemeColors';
import { fmtKz } from '../../lib/format';
import TripStripCard from '../../components/TripStripCard';
import StatusStamp from '../../components/StatusStamp';
import BoleiaButton from '../../components/BoleiaButton';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import {
	apiErrorMessage,
	cancelRide,
	decideBooking,
	listMyRides,
	listRideBookings,
	startRide,
} from '../../lib/api';
import { toRide, toBooking } from '../../lib/rideMapper';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
	BoleiaMainStackParamList,
	DriverTabsParamList,
} from '../../types/navigation';

/**
 * Painel do motorista: as suas corridas e os pedidos de boleia de cada uma.
 *
 * Uma corrida pendente de decisão é a única acção que bloqueia alguém: o
 * passageiro fica à espera até o pedido expirar. Por isso a decisão dá erro
 * visível, em vez de o botão fingir que resultou.
 */
export default function TripsScreen() {
	const { themeColors } = useThemeColors();
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'Main'>
		>();
	const tabNavigation =
		useNavigation<BottomTabNavigationProp<DriverTabsParamList>>();
	const queryClient = useQueryClient();

	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState<string | null>(null);

	const { data: page, isLoading } = useQuery({
		queryKey: ['myRides'],
		queryFn: () => listMyRides({ limit: 50 }),
	});
	const mine = page?.rows ?? [];

	const { data: bookingsByRide } = useQuery({
		queryKey: ['rideBookings', mine.map((r) => r.id).join(',')],
		enabled: mine.length > 0,
		queryFn: async () => {
			const entries = await Promise.all(
				mine.map(async (ride) => {
					const rows = await listRideBookings(ride.id);
					return [ride.id, rows] as const;
				}),
			);
			return Object.fromEntries(entries);
		},
	});

	const decideById = async (
		bookingId: string,
		decision: 'CONFIRMED' | 'REJECTED',
	) => {
		setBusy(bookingId);
		setError(null);
		try {
			await decideBooking(
				bookingId,
				decision,
				decision === 'REJECTED'
					? 'O lugar não está a bater certo com a tua rota.'
					: undefined,
			);
			await queryClient.invalidateQueries({ queryKey: ['rideBookings'] });
		} catch (err) {
			setError(apiErrorMessage(err, 'Não foi possível responder.'));
		} finally {
			setBusy(null);
		}
	};

	const begin = async (rideId: string) => {
		setBusy(rideId);
		setError(null);
		try {
			await startRide(rideId);
			await queryClient.invalidateQueries({ queryKey: ['myRides'] });
			navigation.navigate('ActiveRide', { rideId });
		} catch (err) {
			setError(
				apiErrorMessage(err, 'Não foi possível iniciar a viagem.'),
			);
		} finally {
			setBusy(null);
		}
	};

	/*
	 * Cancelar uma corrida agendada.
	 *
	 * Sem isto, `cancelRide` era código morto e uma corrida que o motorista
	 * já não queria continuava agendada para sempre — com lugares bloqueados e
	 * passageiros à espera de uma resposta que não viria. O cancelamento fecha
	 * os pedidos pendentes e devolve os lugares, e o passageiro é avisado.
	 */
	const abort = async (rideId: string) => {
		setBusy(rideId);
		setError(null);
		try {
			await cancelRide(rideId, 'Cancelada pelo motorista.');
			await queryClient.invalidateQueries({ queryKey: ['myRides'] });
			await queryClient.invalidateQueries({ queryKey: ['rideBookings'] });
		} catch (err) {
			setError(
				apiErrorMessage(err, 'Não foi possível cancelar a viagem.'),
			);
		} finally {
			setBusy(null);
		}
	};

	if (!isLoading && mine.length === 0) {
		return (
			<SafeAreaView
				className="flex-1 px-5"
				style={{ backgroundColor: themeColors.background }}
			>
				<ScreenHeader
					title="As tuas viagens"
					meta="Viagens publicadas e pedidos de boleia"
				/>
				<View className="flex-1 justify-center pb-10">
					<EmptyState
						icon="add-circle-outline"
						title="Ainda nada publicado"
						copy="Publica a tua primeira viagem e gere aqui os pedidos de boleia."
						actionTitle="Publicar viagem"
						onAction={() => tabNavigation.navigate('DriverPublish')}
					/>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView
			className="flex-1 px-5"
			style={{ backgroundColor: themeColors.background }}
		>
			<ScreenHeader
				title="As tuas viagens"
				meta={`${mine.length} viagem${mine.length === 1 ? '' : 's'} publicada${mine.length === 1 ? '' : 's'}`}
			/>
			<ScrollView
				className="flex-1 mt-4"
				contentContainerStyle={{ paddingBottom: 48 }}
			>
				{error ? (
					<Text
						className="font-sans text-body-xs mb-3"
						style={{ color: themeColors.error }}
					>
						{error}
					</Text>
				) : null}

				{mine.map((apiRide) => {
					const ride = toRide(apiRide);
					const bookings = (bookingsByRide?.[apiRide.id] ?? []).map(
						toBooking,
					);
					const pending = bookings.filter(
						(b) => b.status === 'pedido',
					);
					return (
						<View key={ride.id} className="mb-5">
							<TripStripCard
								ride={ride}
								onPress={() =>
									navigation.navigate('RideDetail', {
										rideId: ride.id,
									})
								}
							/>
							{ride.status === 'programada' && (
								<View
									className="mx-1 -mt-1 rounded-b-2xl px-3 pb-3 pt-2"
									style={{
										backgroundColor: themeColors.background,
									}}
								>
									<BoleiaButton
										title={
											busy === ride.id
												? 'A iniciar…'
												: 'Iniciar viagem'
										}
										onPress={() => void begin(ride.id)}
										disabled={busy === ride.id}
									/>
									<View className="mt-2">
										<BoleiaButton
											title="Cancelar viagem"
											variant="outline"
											onPress={() => void abort(ride.id)}
											disabled={busy === ride.id}
										/>
									</View>
								</View>
							)}
							{ride.status === 'em_curso' && (
								<View
									className="mx-1 -mt-1 rounded-b-2xl px-3 pb-3 pt-2"
									style={{
										backgroundColor: themeColors.background,
									}}
								>
									{/*
									 * "Gerir viagem", não "Acompanhar ao vivo": o
									 * ecrã para onde vai tem os controlos de avançar
									 * paragem e terminar. Dizer só "acompanhar"
									 * descrevia metade do que se lá faz.
									 */}
									<BoleiaButton
										title="Gerir viagem"
										onPress={() =>
											navigation.navigate('ActiveRide', {
												rideId: ride.id,
											})
										}
									/>
								</View>
							)}
							{bookings.length > 0 && (
								<View
									className="mx-1 -mt-1 rounded-b-2xl px-3 pb-3"
									style={{
										backgroundColor: themeColors.background,
									}}
								>
									{pending.length > 0 ? (
										pending.map((b) => (
											<BookingRequest
												key={b.id}
												booking={b}
												ride={ride}
												busy={busy === b.id}
												onAccept={() =>
													decideById(
														b.id,
														'CONFIRMED',
													)
												}
												onDecline={() =>
													decideById(b.id, 'REJECTED')
												}
											/>
										))
									) : (
										<View className="flex-row items-center justify-between pt-2">
											<Text
												className="font-sans text-body-xs"
												style={{
													color: themeColors.secondary,
												}}
											>
												Reservas desta viagem
											</Text>
											<View className="flex-row items-center">
												{bookings.map((b) => (
													<View
														key={b.id}
														className="mr-2"
													>
														<StatusStamp
															status={b.status}
														/>
													</View>
												))}
											</View>
										</View>
									)}
								</View>
							)}
						</View>
					);
				})}
			</ScrollView>
		</SafeAreaView>
	);
}

/** Um pedido à espera de resposta, com os dois botões de decisão. */
function BookingRequest({
	booking,
	ride,
	busy,
	onAccept,
	onDecline,
}: {
	booking: ReturnType<typeof toBooking>;
	ride: ReturnType<typeof toRide>;
	busy: boolean;
	onAccept: () => void;
	onDecline: () => void;
}) {
	const { themeColors } = useThemeColors();

	return (
		<View
			className="pt-3 border-t"
			style={{ borderTopColor: themeColors.border }}
		>
			{/*
			 * A identidade do passageiro não vem no payload das reservas. O
			 * backend envia só o que o motorista precisa para decidir: lugares
			 * e trajeto. Inventar um nome a partir de um id seria pior.
			 */}
			<View className="flex-row items-center justify-between">
				<Text
					className="font-sansBold text-body-small flex-1"
					style={{ color: themeColors.text }}
				>
					Pedido de boleia
				</Text>
				<Text
					className="font-sansMedium text-body-small"
					style={{ color: themeColors.secondary }}
				>
					{booking.seats} lugar{booking.seats > 1 ? 'es' : ''} ·{' '}
					{fmtKz(booking.amount)}
				</Text>
			</View>
			<Text
				className="font-sansMedium text-body-xs mt-0.5"
				style={{ color: themeColors.secondary }}
			>
				{ride.origin.name} → {ride.destination.name}
			</Text>
			<Text
				className="font-sansMedium text-body-xs"
				style={{ color: themeColors.secondary }}
			>
				Saída {ride.departure.slice(0, 10)} ·{' '}
				{ride.departure.slice(11, 16)}
			</Text>
			<View className="flex-row mt-2.5">
				<View className="flex-1 mr-2">
					<BoleiaButton
						small
						title="Aceitar"
						onPress={onAccept}
						disabled={busy}
					/>
				</View>
				<View className="flex-1">
					<BoleiaButton
						small
						title="Recusar"
						variant="outline"
						onPress={onDecline}
						disabled={busy}
					/>
				</View>
			</View>
		</View>
	);
}
