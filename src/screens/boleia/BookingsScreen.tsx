import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useDbStore } from '../../mock/db';
import { initials } from '../../mock/helpers';
import BookingStub from '../../components/BookingStub';
import HistoryReceipt from '../../components/HistoryReceipt';
import BoleiaButton from '../../components/BoleiaButton';
import { Ionicons } from '@expo/vector-icons';
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

	const rides = useDbStore((s) => s.db.rides);
	const bookings = useDbStore((s) => s.db.bookings);
	const users = useDbStore((s) => s.db.users);
	const all = useMemo(
		() =>
			bookings
				.filter((b) => b.passengerId === 'u_me_001')
				.flatMap((b) => {
					const ride = rides.find((r) => r.id === b.rideId);
					return ride ? [{ booking: b, ride }] : [];
				}),
		[bookings, rides],
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
			<View className="mt-2">
				<Text
					className="font-mono text-[10px] uppercase tracking-[3px]"
					style={{ color: themeColors.laterite }}
				>
					Reservas · bilhetes
				</Text>
				<Text
					className="font-display text-[22px]"
					style={{ color: themeColors.text }}
				>
					As tuas reservas
				</Text>
				{all.length > 0 ? (
					<Text
						className="font-mono text-[11px] mt-0.5"
						style={{ color: themeColors.secondary }}
					>
						{upcoming.length} próxima
						{upcoming.length === 1 ? '' : 's'} · {history.length} no
						histórico
					</Text>
				) : null}
			</View>

			{all.length === 0 ? (
				<View className="flex-1 justify-center pb-10">
					<View
						className="items-center p-5 rounded-2xl border"
						style={{
							borderColor: themeColors.border,
							backgroundColor: themeColors.card,
						}}
					>
						<Text
							className="font-display text-[18px]"
							style={{ color: themeColors.text }}
						>
							Ainda não tens reservas
						</Text>
						<Text
							className="font-sans text-[13px] text-center mt-1 leading-5"
							style={{ color: themeColors.secondary }}
						>
							Pesquisa uma viagem e pede uma boleia. O bilhete
							aparece aqui.
						</Text>
						<View className="w-full mt-4">
							<BoleiaButton
								title="Procurar boleia"
								onPress={() =>
									tabNavigation.navigate('PassengerHome')
								}
							/>
						</View>
					</View>
				</View>
			) : (
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ paddingBottom: 40 }}
				>
					<View
						className="flex-row rounded-full p-1 border mt-3 mb-4"
						style={{
							borderColor: themeColors.border,
							backgroundColor: themeColors.card,
						}}
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
									className="flex-1 rounded-full py-2 items-center"
									style={{
										backgroundColor: active
											? themeColors.text
											: 'transparent',
									}}
								>
									<Text
										className="font-sansMedium text-[12px]"
										style={{
											color: active
												? themeColors.card
												: themeColors.secondary,
										}}
									>
										{opt.label}
										{count > 0 ? ` (${count})` : ''}
									</Text>
								</Pressable>
							);
						})}
					</View>

					{tab === 'upcoming' ? (
						upcoming.length === 0 ? (
							<Text
								className="font-sans text-[13px]"
								style={{ color: themeColors.secondary }}
							>
								Nenhuma reserva próxima por aqui. Pesquisa uma
								boleia na Home.
							</Text>
						) : (
							upcoming.map(({ booking, ride }, i) => {
								const driver = users.find(
									(u) => u.id === ride.driverId,
								);
								const othersUsers = bookings
									.filter(
										(b) =>
											b.rideId === ride.id &&
											b.passengerId !== 'u_me_001' &&
											(b.status === 'confirmada' ||
												b.status === 'em_viagem'),
									)
									.map((b) =>
										users.find(
											(u) => u.id === b.passengerId,
										),
									)
									.filter(
										(u): u is NonNullable<typeof u> => !!u,
									);
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

										<View
											className="mt-2 rounded-2xl border overflow-hidden"
											style={{
												borderColor: themeColors.border,
												backgroundColor:
													themeColors.card,
											}}
										>
											<Pressable
												onPress={() =>
													navigation.navigate(
														'PublicProfile',
														{
															userId: ride.driverId,
														},
													)
												}
												className="flex-row items-center px-4 py-3"
												style={({ pressed }) => ({
													opacity: pressed ? 0.7 : 1,
												})}
											>
												<View
													className="w-10 h-10 rounded-full items-center justify-center"
													style={{
														backgroundColor:
															themeColors.primary,
													}}
												>
													<Text
														className="font-display text-[14px]"
														style={{
															color: themeColors.text,
														}}
													>
														{driver
															? initials(
																	driver.firstName,
																	driver.lastName,
																)
															: '?'}
													</Text>
												</View>
												<View className="flex-1 ml-3">
													<Text
														className="font-sansBold text-[14px]"
														style={{
															color: themeColors.text,
														}}
													>
														{driver
															? `${driver.firstName} ${driver.lastName}`
															: '—'}
													</Text>
													<Text
														className="font-mono text-[11px] mt-0.5"
														style={{
															color: themeColors.laterite,
														}}
													>
														★{' '}
														{driver?.rating?.toFixed(
															1,
														) ?? 'novo'}{' '}
														·{' '}
														{driver?.vehicle
															? `${driver.vehicle.make} ${driver.vehicle.model}`
															: 'viatura'}
													</Text>
												</View>
												<Ionicons
													name="chevron-forward"
													size={16}
													color={themeColors.border}
												/>
											</Pressable>

											<View
												className="border-t px-4 py-3"
												style={{
													borderTopColor:
														themeColors.border,
												}}
											>
												<Text
													className="font-mono text-[9px] uppercase tracking-[2px]"
													style={{
														color: themeColors.secondary,
													}}
												>
													A bordo contigo ·{' '}
													{othersUsers.length}
												</Text>
												{othersUsers.length === 0 ? (
													<Text
														className="font-sans text-[12px] mt-1"
														style={{
															color: themeColors.secondary,
														}}
													>
														Só tu a bordo por agora.
													</Text>
												) : (
													<View className="flex-row flex-wrap mt-1.5">
														{othersUsers.map(
															(u) => (
																<Pressable
																	key={u.id}
																	onPress={() =>
																		navigation.navigate(
																			'PublicProfile',
																			{
																				userId: u.id,
																			},
																		)
																	}
																	className="flex-row items-center rounded-full border py-1 pl-1 pr-3 mr-2 mb-2"
																	style={({
																		pressed,
																	}) => ({
																		borderColor:
																			themeColors.border,
																		backgroundColor:
																			themeColors.card,
																		opacity:
																			pressed
																				? 0.7
																				: 1,
																	})}
																>
																	<View
																		className="w-7 h-7 rounded-full items-center justify-center"
																		style={{
																			backgroundColor:
																				themeColors.border,
																		}}
																	>
																		<Text
																			className="font-sansBold text-[10px]"
																			style={{
																				color: themeColors.text,
																			}}
																		>
																			{initials(
																				u.firstName,
																				u.lastName,
																			)}
																		</Text>
																	</View>
																	<Text
																		className="font-sansMedium text-[12px] ml-2"
																		style={{
																			color: themeColors.text,
																		}}
																	>
																		{
																			u.firstName
																		}{' '}
																		{
																			u.lastName
																		}
																	</Text>
																</Pressable>
															),
														)}
													</View>
												)}
											</View>
										</View>
									</Animated.View>
								);
							})
						)
					) : history.length === 0 ? (
						<Text
							className="font-sans text-[13px]"
							style={{ color: themeColors.secondary }}
						>
							Nenhuma viagem concluída ainda.
						</Text>
					) : (
						groups.map(([month, items]) => (
							<View key={month} className="mb-5">
								<View className="flex-row items-center mb-2">
									<Text
										className="font-mono text-[10px] uppercase tracking-[3px]"
										style={{ color: themeColors.laterite }}
									>
										{month}
									</Text>
									<View
										className="flex-1 border-t ml-3"
										style={{
											borderColor: themeColors.border,
										}}
									/>
									<Text
										className="font-mono text-[10px] ml-3"
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
										<HistoryReceipt
											booking={booking}
											ride={ride}
											onReview={
												booking.status === 'concluida'
													? () =>
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
													: undefined
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
