import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useDbStore } from '../../mock/db';
import BookingStub from '../../components/BookingStub';
import BoleiaButton from '../../components/BoleiaButton';
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

	const list = tab === 'upcoming' ? upcoming : history;

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
									</Text>
								</Pressable>
							);
						})}
					</View>

					{list.length === 0 ? (
						<Text
							className="font-sans text-[13px]"
							style={{ color: themeColors.secondary }}
						>
							Nenhuma reserva{' '}
							{tab === 'upcoming' ? 'próxima' : 'no histórico'}{' '}
							por aqui.
						</Text>
					) : (
						list.map(({ booking, ride }) => (
							<View key={booking.id} className="mb-4">
								<BookingStub
									booking={booking}
									ride={ride}
									onPress={() =>
										navigation.navigate('RideDetail', {
											rideId: ride.id,
										})
									}
									footer={
										booking.status === 'em_viagem' ? (
											<BoleiaButton
												title="Acompanhar ao vivo"
												onPress={() =>
													navigation.navigate(
														'ActiveRide',
														{ rideId: ride.id },
													)
												}
											/>
										) : booking.status === 'concluida' ? (
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
															subject: 'driver',
														},
													)
												}
											/>
										) : undefined
									}
								/>
							</View>
						))
					)}
				</ScrollView>
			)}
		</SafeAreaView>
	);
}
