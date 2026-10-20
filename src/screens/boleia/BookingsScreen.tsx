import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '../../lib/queryKeys';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useSessionUserId } from '../../hooks/useSessionUser';
import BookingStub from '../../components/BookingStub';
import BoleiaButton from '../../components/BoleiaButton';
import ScreenHeader from '../../components/ScreenHeader';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import GroupLabel from '../../components/GroupLabel';
import { listMyBookings, getRide, cancelBooking } from '../../lib/api';
import { apiErrorMessage } from '../../lib/api';
import { toBooking, toRide } from '../../lib/rideMapper';
import { MONTHS_PT } from '../../utils/date';
import { dateOf } from '../../lib/format';

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
	const queryClient = useQueryClient();
	const [cancellingId, setCancellingId] = useState<string | null>(null);

	const { data: apiBookings, isLoading } = useQuery({
		queryKey: qk.myBookings.all,
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
			/*
			 * `allSettled` e não `all`, e a diferença é visível: com `all`, uma
			 * única corrida que falhasse (uma viagem apagada pelo motorista, um
			 * 500) fazia a promessa toda rejeitar, `rides.data` ficava
			 * `undefined` e **todas** as reservas desapareciam — sem erro, sem
			 * esqueleto, com o ecrã a dizer "Ainda não tens reservas". A pessoa
			 * concluía que tinha perdido tudo.
			 *
			 * Uma corrida que falhou simplesmente não desenha; as restantes,
			 * sim.
			 */
			const settled = await Promise.allSettled(
				ids.map((id) => getRide(id)),
			);
			return Object.fromEntries(
				settled
					.filter(
						(
							r,
						): r is PromiseFulfilledResult<
							Awaited<ReturnType<typeof getRide>>
						> => r.status === 'fulfilled',
					)
					.map((r) => [r.value.id, r.value]),
			);
		},
	});

	/**
	 * Cancelar uma reserva, com confirmação.
	 *
	 * O `Alert` não é formalidade: `cancelBooking` desfaz a reserva e devolve
	 * os lugares ao motorista. Um toque acidental numa tela onde o cartão
	 * inteiro é `Pressable` seria irreversível.
	 */
	function confirmCancel(bookingId: string) {
		Alert.alert(
			'Cancelar reserva?',
			'O lugar volta a ficar disponível para outra pessoa.',
			[
				{ text: 'Manter', style: 'cancel' },
				{
					text: 'Cancelar reserva',
					style: 'destructive',
					onPress: () => void doCancel(bookingId),
				},
			],
		);
	}

	async function doCancel(bookingId: string) {
		setCancellingId(bookingId);
		try {
			await cancelBooking(bookingId, 'Mudei de planos');
			// A reserva sai do ecrã e o lugar volta à corrida: as duas listas
			// mudaram.
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: qk.myBookings.all }),
				queryClient.invalidateQueries({
					queryKey: qk.ride.of(bookingId),
				}),
				queryClient.invalidateQueries({ queryKey: qk.rides.all }),
			]);
			setCancellingId(null);
		} catch (error) {
			setCancellingId(null);
			Alert.alert(
				'Não foi possível cancelar',
				apiErrorMessage(error, 'Tenta de novo daqui a pouco.'),
			);
		}
	}

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
		/*
		 * Agrupar por mês com `toLocaleDateString('pt-PT')` tinha dois
		 * problemas: o ICU do Hermes sem dados devolve o mês em inglês ("march
		 * 2026") dentro de um produto em PT-AO, e a data vinha no fuso do
		 * dispositivo, não em WAT — uma reserva de 1 de Abril às 00:30 WAT
		 * agrupava em Março para quem está em UTC.
		 *
		 * `MONTHS_PT` e `dateOf` resolvem os dois sem depender do locale.
		 */
		const map = new Map<string, typeof history>();
		for (const x of history) {
			const d = dateOf(x.ride.departure);
			const month = `${MONTHS_PT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
			const key = month.charAt(0).toUpperCase() + month.slice(1);
			const list = map.get(key) ?? [];
			list.push(x);
			map.set(key, list);
		}
		return [...map.entries()];
	}, [history]);

	return (
		<SafeAreaView
			className="flex-1"
			edges={['left', 'right', 'bottom']}
			style={{ backgroundColor: themeColors.background }}
		>
			<AppHeader />

			<View className="flex-1 px-5">
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
						showsVerticalScrollIndicator={false}
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
												onCancel={() =>
													confirmCancel(booking.id)
												}
												cancelling={
													cancellingId === booking.id
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
											style={{
												color: themeColors.secondary,
											}}
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
			</View>
		</SafeAreaView>
	);
}
