import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useSessionUserId } from '../../hooks/useSessionUser';
import BookingStub from '../../components/BookingStub';
import BoleiaButton from '../../components/BoleiaButton';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import GroupLabel from '../../components/GroupLabel';
import { listMyBookings, getRide } from '../../lib/api';
import { toBooking, toRide } from '../../lib/rideMapper';

import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
	BoleiaMainStackParamList,
	PassengerTabsParamList,
} from '../../types/navigation';

const UPCOMING = ['pedido', 'confirmada', 'em_viagem'];
const HISTORY = ['concluida', 'recusada', 'cancelada', 'expirada'];

export default function BookingsScreen() {
	const { themeColors } = useThemeColors();
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'Main'>
		>();
	const tabNavigation =
		useNavigation<BottomTabNavigationProp<PassengerTabsParamList>>();
	const [tab, setTab] = useState<'upcoming' | 'history'>('upcoming');
	const sessionUserId = useSessionUserId();

	const { data: apiBookings, isLoading } = useQuery({
		queryKey: ['myBookings'],
		queryFn: listMyBookings,
		enabled: !!sessionUserId,
	});

	// Cada reserva traz só um resumo da corrida. Para desenhar o cartão com a
	// rota e as paragens é preciso o detalhe de cada uma; o cache do React Query
	// evita repetir o pedido quando se abre o mesmo cartão outra vez.
	const rides = useQuery({
		queryKey: [
			'bookingRides',
			(apiBookings ?? []).map((b) => b.rideId).join(','),
		],
		enabled: (apiBookings ?? []).length > 0,
		queryFn: async () => {
			const ids = [...new Set((apiBookings ?? []).map((b) => b.rideId))];
			const rows = await Promise.all(ids.map((id) => getRide(id)));
			return Object.fromEntries(rows.map((r) => [r.id, r]));
		},
	});

	const all = useMemo(
		() =>
			(apiBookings ?? [])
				.map((b) => {
					const api = rides.data?.[b.rideId];
					return api
						? { booking: toBooking(b), ride: toRide(api) }
						: null;
				})
				.filter((x): x is NonNullable<typeof x> => x !== null),
		[apiBookings, rides.data],
	);

	const upcoming = useMemo(
		() =>
			all
				.filter((x) => UPCOMING.includes(x.booking.status))
				.sort(
					(a, b) =>
						Date.parse(a.ride.departure) -
						Date.parse(b.ride.departure),
				),
		[all],
	);

	const history = useMemo(
		() =>
			all
				.filter((x) => HISTORY.includes(x.booking.status))
				.sort(
					(a, b) =>
						Date.parse(b.ride.departure) -
						Date.parse(a.ride.departure),
				),
		[all],
	);

	const groups = useMemo(() => {
		const map = new Map<string, typeof history>();
		for (const x of history) {
			const label = new Date(x.ride.departure).toLocaleDateString(
				'pt-PT',
				{ month: 'long', year: 'numeric' },
			);
			const month = label.charAt(0).toUpperCase() + label.slice(1);
			const list = map.get(month) ?? [];
			list.push(x);
			map.set(month, list);
		}
		return [...map.entries()];
	}, [history]);

	return (
		<SafeAreaView
			className="flex-1 px-5"
			style={{ backgroundColor: themeColors.background }}
		>
			<ScreenHeader
				title="As tuas reservas"
				meta={
					all.length > 0
						? `${upcoming.length} próxima${upcoming.length === 1 ? '' : 's'} · ${history.length} no histórico`
						: null
				}
			/>

			{isLoading ? (
				<View className="flex-1 justify-center pb-10">
					<Text
						className="font-sans text-body-small text-center"
						style={{ color: themeColors.secondary }}
					>
						A carregar as tuas reservas…
					</Text>
				</View>
			) : all.length === 0 ? (
				<View className="flex-1 justify-center pb-10">
					<EmptyState
						icon="car-outline"
						title="Ainda não tens reservas"
						copy="Pesquisa uma viagem e pede a tua boleia. A reserva aparece aqui."
						actionTitle="Ver viagens ativas"
						onAction={() =>
							tabNavigation.navigate('PassengerExplore')
						}
					/>
				</View>
			) : (
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ paddingBottom: 40 }}
				>
					<View
						className="flex-row rounded-xl p-1 mt-4 mb-4"
						style={{ backgroundColor: themeColors.card }}
					>
						{(
							[
								{ key: 'upcoming', label: 'Próximas' },
								{ key: 'history', label: 'Histórico' },
							] as const
						).map((opt) => {
							const active = tab === opt.key;
							const count =
								opt.key === 'upcoming'
									? upcoming.length
									: history.length;
							return (
								<Pressable
									key={opt.key}
									onPress={() => setTab(opt.key)}
									className="flex-1 rounded-xl min-h-[44px] items-center justify-center"
									style={{
										backgroundColor: active
											? themeColors.primary
											: 'transparent',
									}}
								>
									<Text
										className="font-sansBold text-body-small"
										style={{
											color: active
												? themeColors.onPrimary
												: themeColors.secondary,
										}}
									>
										{opt.label}
										{count > 0 ? ` · ${count}` : ''}
									</Text>
								</Pressable>
							);
						})}
					</View>

					{tab === 'upcoming' ? (
						upcoming.length === 0 ? (
							<EmptyState
								icon="car-outline"
								title="Nenhuma reserva próxima"
								copy="Vê as viagens ativas em Explorar e pede a tua boleia."
							/>
						) : (
							upcoming.map(({ booking, ride }, i) => {
								return (
									<Animated.View
										key={booking.id}
										entering={FadeInDown.delay(
											i * 70,
										).duration(260)}
										className="mb-4"
									>
										<BookingStub
											booking={booking}
											ride={ride}
											onPress={() =>
												navigation.navigate(
													'RideDetail',
													{ rideId: ride.id },
												)
											}
											footer={
												booking.status ===
												'em_viagem' ? (
													<BoleiaButton
														title="Acompanhar ao vivo"
														onPress={() =>
															navigation.navigate(
																'ActiveRide',
																{
																	rideId: ride.id,
																},
															)
														}
													/>
												) : booking.status ===
												  'concluida' ? (
													<BoleiaButton
														title="Avaliar motorista"
														variant="outline"
														onPress={() =>
															navigation.navigate(
																'Review',
																{
																	rideId: ride.id,
																	toUserId:
																		ride.driverId,
																	subject:
																		'driver',
																},
															)
														}
													/>
												) : undefined
											}
										/>
									</Animated.View>
								);
							})
						)
					) : history.length === 0 ? (
						<EmptyState
							icon="receipt-outline"
							title="Nenhuma viagem concluída"
							copy="O teu histórico de boleias aparece aqui."
						/>
					) : (
						groups.map(([month, items]) => (
							<View key={month} className="mb-5">
								<View className="flex-row items-center mb-3">
									<View className="flex-1">
										<GroupLabel>{month}</GroupLabel>
									</View>
									<Text
										className="font-sansMedium text-body-xs ml-3"
										style={{ color: themeColors.secondary }}
									>
										{items.length}
									</Text>
								</View>
								{items.map(({ booking, ride }, i) => (
									<View
										key={booking.id}
										className={i > 0 ? 'mt-3' : ''}
									>
										<BookingStub
											booking={booking}
											ride={ride}
											footer={
												booking.status ===
												'concluida' ? (
													<BoleiaButton
														title="Avaliar motorista"
														variant="outline"
														onPress={() =>
															navigation.navigate(
																'Review',
																{
																	rideId: ride.id,
																	toUserId:
																		ride.driverId,
																	subject:
																		'driver',
																},
															)
														}
													/>
												) : undefined
											}
										/>
									</View>
								))}
							</View>
						))
					)}
				</ScrollView>
			)}
		</SafeAreaView>
	);
}
