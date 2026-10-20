import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WEB_URL } from '@env';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '../../lib/queryKeys';
import {
	apiErrorMessage,
	cancelRide,
	decideBooking,
	finishRide,
	getRide,
	listRideBookings,
	startRide,
} from '../../lib/api';
import { toBooking, toRide, rideProgressFraction } from '../../lib/rideMapper';
import type { BoleiaMainStackParamList } from '../../types/navigation';
import { useThemeColors } from '../../hooks/useThemeColors';
import BackButton from '../../components/BackButton';
import BoleiaButton from '../../components/BoleiaButton';
import Card from '../../components/Card';
import RouteStrip, { StripStop } from '../../components/RouteStrip';
import StatusStamp from '../../components/StatusStamp';
import {
	durationBetween,
	fmtDayMonth,
	fmtKz,
	hhmm,
	dateOf,
} from '../../lib/format';

/**
 * Detalhe de uma boleia do motorista.
 *
 * A lista de viagens deixou de ter os botões de gestão em cada cartão: iniciar,
 * terminar, cancelar e decidir pedidos vivem aqui, sobre uma viagem concreta.
 * Os pedidos mostram nome e telefone, que é o que o motorista precisa para
 * combinar o embarque.
 */
export default function DriverTripScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'DriverTrip'>
		>();
	const route = useRoute<RouteProp<BoleiaMainStackParamList, 'DriverTrip'>>();
	const { themeColors } = useThemeColors();
	const queryClient = useQueryClient();

	const [busy, setBusy] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const { data: apiRide, isLoading } = useQuery({
		queryKey: qk.ride.of(route.params.rideId),
		queryFn: () => getRide(route.params.rideId),
	});
	const { data: apiBookings = [] } = useQuery({
		queryKey: qk.rideBookings.of(route.params.rideId),
		queryFn: () => listRideBookings(route.params.rideId),
		enabled: Boolean(apiRide),
	});

	const ride = apiRide ? toRide(apiRide) : undefined;
	const bookings = apiBookings.map(toBooking);
	const pending = bookings.filter((booking) => booking.status === 'pedido');
	const confirmed = bookings.filter(
		(booking) =>
			booking.status === 'confirmada' || booking.status === 'em_viagem',
	);

	const refresh = async () => {
		await Promise.all([
			queryClient.invalidateQueries({
				queryKey: qk.ride.of(route.params.rideId),
			}),
			queryClient.invalidateQueries({ queryKey: qk.myRides.all }),
			queryClient.invalidateQueries({
				queryKey: qk.rideBookings.of(route.params.rideId),
			}),
		]);
	};

	const run = async (key: string, action: () => Promise<unknown>) => {
		setBusy(key);
		setError(null);
		try {
			await action();
			await refresh();
		} catch (err) {
			setError(
				apiErrorMessage(err, 'Não foi possível concluir a acção.'),
			);
		} finally {
			setBusy(null);
		}
	};

	const decide = (bookingId: string, decision: 'CONFIRMED' | 'REJECTED') =>
		run(bookingId, () =>
			decideBooking(
				bookingId,
				decision,
				decision === 'REJECTED'
					? 'O lugar não está a bater certo com a tua rota.'
					: undefined,
			),
		);

	if (isLoading) {
		return (
			<SafeAreaView
				className="flex-1 items-center justify-center px-6"
				style={{ backgroundColor: themeColors.background }}
			>
				<Text style={{ color: themeColors.secondary }}>
					A carregar a viagem…
				</Text>
			</SafeAreaView>
		);
	}

	if (!ride) {
		return (
			<SafeAreaView
				className="flex-1 items-center justify-center px-6"
				style={{ backgroundColor: themeColors.background }}
			>
				<Text
					style={{
						color: themeColors.secondary,
						textAlign: 'center',
					}}
				>
					Viagem não encontrada.
				</Text>
			</SafeAreaView>
		);
	}

	const free = Math.max(0, ride.seatsTotal - ride.seatsTaken);
	const dateLabel = fmtDayMonth(dateOf(ride.departure));
	const origin: StripStop = {
		place: ride.origin.name,
		time: hhmm(ride.departure),
		kind: 'origin',
	};
	const stops: StripStop[] = ride.stops.map((stop) => ({
		place: stop.name,
		time: stop.time,
		kind: 'stop',
	}));
	const destination: StripStop = {
		place: ride.destination.name,
		time: hhmm(ride.arrival),
		kind: 'destination',
	};

	const shareRide = () =>
		void Share.share({
			message: `${ride.routeName}\n${WEB_URL}/viagens/${ride.id}`,
			title: 'Boleia',
		});

	return (
		<SafeAreaView
			className="flex-1"
			style={{ backgroundColor: themeColors.background }}
		>
			<View className="px-5 flex-row items-center pt-2 pb-3">
				<View className="mr-3">
					<BackButton onPress={() => navigation.goBack()} />
				</View>
				<View className="flex-1">
					<Text
						className="font-sansMedium text-body-xs"
						style={{ color: themeColors.secondary }}
					>
						Gestão da viagem
					</Text>
					<Text
						className="font-sansExtraBold text-title-secondary -mt-0.5"
						style={{ color: themeColors.text }}
						numberOfLines={1}
					>
						{ride.routeName}
					</Text>
				</View>
				<Pressable
					onPress={shareRide}
					accessibilityRole="button"
					accessibilityLabel="Partilhar viagem"
					hitSlop={8}
					className="w-11 h-11 items-center justify-center rounded-full"
					style={({ pressed }) => ({
						backgroundColor: pressed
							? themeColors.card
							: 'transparent',
					})}
				>
					<Ionicons
						name="share-outline"
						size={22}
						color={themeColors.text}
					/>
				</Pressable>
			</View>

			<ScrollView
				className="flex-1 px-5"
				contentContainerStyle={{ paddingBottom: 48 }}
				showsVerticalScrollIndicator={false}
			>
				<Card padded={false}>
					<View className="p-4">
						<View className="flex-row items-start justify-between">
							<View className="flex-1 mr-3">
								<Text
									className="font-sansExtraBold text-title-secondary"
									style={{ color: themeColors.text }}
								>
									{ride.origin.name} → {ride.destination.name}
								</Text>
								<Text
									className="font-sansMedium text-body-xs mt-1"
									style={{ color: themeColors.secondary }}
								>
									{dateLabel} · {hhmm(ride.departure)} →{' '}
									{hhmm(ride.arrival)} ·{' '}
									{durationBetween(
										ride.departure,
										ride.arrival,
									)}
								</Text>
							</View>
							<StatusStamp status={ride.status} />
						</View>

						<View className="mt-4">
							<RouteStrip
								origin={origin}
								stops={stops}
								destination={destination}
								progress={rideProgressFraction(ride)}
							/>
						</View>

						<View
							className="mt-4 pt-3 border-t flex-row items-center justify-between"
							style={{ borderColor: themeColors.border }}
						>
							<Text
								className="font-sansBold text-title-tertiary"
								style={{ color: themeColors.text }}
							>
								{fmtKz(ride.pricePerSeat)}
								<Text
									className="font-sans text-body-xs"
									style={{ color: themeColors.secondary }}
								>
									{' '}
									/lugar
								</Text>
							</Text>
							<Text
								className="font-sansMedium text-body-xs"
								style={{ color: themeColors.secondary }}
							>
								{free} livre{free === 1 ? '' : 's'} ·{' '}
								{ride.seatsTaken} de {ride.seatsTotal}
							</Text>
						</View>
					</View>
				</Card>

				{error ? (
					<Text
						className="font-sans text-body-xs mt-3"
						style={{ color: themeColors.error }}
					>
						{error}
					</Text>
				) : null}

				<View className="mt-4">
					<Card>
						<Text
							className="font-sansBold text-label"
							style={{ color: themeColors.text }}
						>
							Gerir viagem
						</Text>
						<View className="mt-3">
							{ride.status === 'programada' ? (
								<BoleiaButton
									title={
										busy === 'start'
											? 'A iniciar…'
											: 'Iniciar viagem'
									}
									onPress={() =>
										void run('start', () =>
											startRide(ride.id),
										)
									}
									disabled={busy !== null}
								/>
							) : null}

							{ride.status === 'em_curso' ? (
								<BoleiaButton
									title={
										busy === 'finish'
											? 'A terminar…'
											: 'Chegar ao destino'
									}
									onPress={() =>
										void run('finish', () =>
											finishRide(ride.id),
										)
									}
									disabled={busy !== null}
								/>
							) : null}

							{ride.status === 'programada' ? (
								<View className="mt-2">
									<BoleiaButton
										title={
											busy === 'cancel'
												? 'A cancelar…'
												: 'Cancelar viagem'
										}
										variant="outline"
										onPress={() =>
											void run('cancel', () =>
												cancelRide(
													ride.id,
													'Cancelada pelo motorista.',
												),
											)
										}
										disabled={busy !== null}
									/>
								</View>
							) : null}

							{ride.status !== 'programada' &&
							ride.status !== 'em_curso' ? (
								<Text
									className="font-sans text-body-small"
									style={{ color: themeColors.secondary }}
								>
									Esta viagem já terminou.
								</Text>
							) : null}
						</View>
					</Card>
				</View>

				<View className="mt-4">
					<Card>
						<View className="flex-row items-center justify-between">
							<Text
								className="font-sansBold text-label"
								style={{ color: themeColors.text }}
							>
								Pedidos de lugar
							</Text>
							<Text
								className="font-sansMedium text-body-xs"
								style={{ color: themeColors.secondary }}
							>
								{pending.length} à espera
							</Text>
						</View>

						{pending.length === 0 ? (
							<Text
								className="font-sans text-body-small mt-2"
								style={{ color: themeColors.secondary }}
							>
								Sem pedidos à espera. Assim que alguém reservar,
								aparece aqui.
							</Text>
						) : (
							pending.map((booking) => (
								<View
									key={booking.id}
									className="mt-4 pt-4 border-t"
									style={{
										borderTopColor: themeColors.border,
									}}
								>
									<Text
										className="font-sansBold text-body-small"
										style={{ color: themeColors.text }}
									>
										{booking.passenger?.name ??
											'Passageiro'}
									</Text>
									<Text
										className="font-sans text-body-xs mt-0.5"
										style={{
											color: themeColors.secondary,
										}}
									>
										{booking.seats} lugar
										{booking.seats > 1 ? 'es' : ''} ·{' '}
										{fmtKz(booking.amount)}
									</Text>
									{booking.passenger?.phone ? (
										<Text
											className="font-sansMedium text-body-xs mt-1"
											style={{
												color: themeColors.secondary,
											}}
										>
											{booking.passenger.phone}
										</Text>
									) : null}
									<View className="flex-row mt-3">
										<View className="flex-1 mr-2">
											<BoleiaButton
												small
												title="Aceitar"
												onPress={() =>
													void decide(
														booking.id,
														'CONFIRMED',
													)
												}
												disabled={busy !== null}
											/>
										</View>
										<View className="flex-1">
											<BoleiaButton
												small
												title="Recusar"
												variant="outline"
												onPress={() =>
													void decide(
														booking.id,
														'REJECTED',
													)
												}
												disabled={busy !== null}
											/>
										</View>
									</View>
								</View>
							))
						)}

						{confirmed.length > 0 ? (
							<View
								className="mt-4 pt-4 border-t"
								style={{ borderTopColor: themeColors.border }}
							>
								<Text
									className="font-sansMedium text-body-xs"
									style={{
										color: themeColors.secondary,
									}}
								>
									{confirmed.length}{' '}
									{confirmed.length === 1
										? 'pessoa confirmada'
										: 'pessoas confirmadas'}{' '}
									a bordo
								</Text>
								{confirmed.map((booking) => (
									<Text
										key={booking.id}
										className="font-sans text-body-small mt-1"
										style={{ color: themeColors.text }}
									>
										{booking.passenger?.name ??
											'Passageiro'}{' '}
										· {booking.seats} lugar
										{booking.seats > 1 ? 'es' : ''}
										{booking.passenger?.phone
											? ` · ${booking.passenger.phone}`
											: ''}
									</Text>
								))}
							</View>
						) : null}
					</Card>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
