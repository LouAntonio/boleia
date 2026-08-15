import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useSessionUserId } from '../../hooks/useSessionUser';
import { useDbStore } from '../../mock/db';
import { fmtKz, initials } from '../../mock/helpers';
import SectionTitle from '../../components/SectionTitle';
import TripStripCard from '../../components/TripStripCard';
import StatusStamp from '../../components/StatusStamp';
import BoleiaButton from '../../components/BoleiaButton';
import { ridesForDriver } from '../../mock/repos/rideRepo';
import { confirmBooking, declineBooking } from '../../mock/repos/bookingRepo';
import { startRide } from '../../mock/repos/liveRepo';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';

export default function TripsScreen() {
	const { themeColors } = useThemeColors();
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'Main'>
		>();
	const mine = ridesForDriver(useSessionUserId());
	const allBookings = useDbStore((s) => s.db.bookings);
	const users = useDbStore((s) => s.db.users);

	if (mine.length === 0) {
		return (
			<SafeAreaView
				className="flex-1 px-5"
				style={{ backgroundColor: themeColors.background }}
			>
				<View className="mt-2 mb-4">
					<Text
						className="font-mono text-[10px] uppercase tracking-[3px]"
						style={{ color: themeColors.laterite }}
					>
						Viagens · talões
					</Text>
					<Text
						className="font-display text-[22px] -mt-0.5"
						style={{ color: themeColors.text }}
					>
						As tuas viagens
					</Text>
				</View>
				<SectionTitle tone="laterite">
					Ainda nada publicado
				</SectionTitle>
				<Text
					className="font-sans text-[13px]"
					style={{ color: themeColors.secondary }}
				>
					Publica a tua primeira viagem e gere aqui os pedidos de
					boleia.
				</Text>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView
			className="flex-1 px-5"
			style={{ backgroundColor: themeColors.background }}
		>
			<View className="mt-2 mb-4">
				<Text
					className="font-mono text-[10px] uppercase tracking-[3px]"
					style={{ color: themeColors.laterite }}
				>
					Viagens · talões
				</Text>
				<Text
					className="font-display text-[22px] -mt-0.5"
					style={{ color: themeColors.text }}
				>
					As tuas viagens
				</Text>
				<Text
					className="font-mono text-[11px]"
					style={{ color: themeColors.secondary }}
				>
					{mine.length} viagem
					{mine.length === 1 ? '' : 's'} publicada
					{mine.length === 1 ? '' : 's'}
				</Text>
			</View>
			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingBottom: 48 }}
			>
				{mine.map((ride) => {
					const bookings = allBookings.filter(
						(b) => b.rideId === ride.id,
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
									className="mx-1 -mt-1 rounded-b-2xl border border-t-0 px-3 pb-3 pt-2"
									style={{
										borderColor: themeColors.border,
										backgroundColor: themeColors.card,
									}}
								>
									<View className="flex-row">
										<View className="flex-1 mr-2">
											<BoleiaButton
												title="Iniciar viagem"
												onPress={() => {
													startRide(ride.id);
													navigation.navigate(
														'ActiveRide',
														{ rideId: ride.id },
													);
												}}
											/>
										</View>
									</View>
								</View>
							)}
							{ride.status === 'em_curso' && (
								<View
									className="mx-1 -mt-1 rounded-b-2xl border border-t-0 px-3 pb-3 pt-2"
									style={{
										borderColor: themeColors.border,
										backgroundColor: themeColors.card,
									}}
								>
									<View className="flex-row">
										<View className="flex-1 mr-2">
											<BoleiaButton
												title="Acompanhar ao vivo"
												onPress={() =>
													navigation.navigate(
														'ActiveRide',
														{ rideId: ride.id },
													)
												}
											/>
										</View>
									</View>
								</View>
							)}
							{bookings.length > 0 && (
								<View
									className="mx-1 -mt-1 rounded-b-2xl border border-t-0 px-3 pb-3"
									style={{
										borderColor: themeColors.border,
										backgroundColor: themeColors.card,
									}}
								>
									{pending.length > 0 ? (
										pending.map((b) => {
											const pax = users.find(
												(u) => u.id === b.passengerId,
											);
											return (
												<View
													key={b.id}
													className="pt-3 border-t"
													style={{
														borderTopColor:
															themeColors.border,
													}}
												>
													<View className="flex-row items-center justify-between">
														<View className="flex-row items-center flex-1 mr-2">
															<View
																className="w-8 h-8 rounded-full items-center justify-center mr-2"
																style={{
																	backgroundColor:
																		themeColors.border,
																}}
															>
																<Text
																	className="font-sansBold text-[11px]"
																	style={{
																		color: themeColors.text,
																	}}
																>
																	{pax
																		? initials(
																				pax.firstName,
																				pax.lastName,
																			)
																		: '?'}
																</Text>
															</View>
															<Text
																className="font-sansBold text-[14px]"
																style={{
																	color: themeColors.text,
																}}
															>
																{pax
																	? `${pax.firstName} ${pax.lastName}`
																	: 'Passageiro'}
															</Text>
														</View>
														<Text
															className="font-mono text-[13px]"
															style={{
																color: themeColors.secondary,
															}}
														>
															{b.seats} lugar
															{b.seats > 1
																? 'es'
																: ''}{' '}
															· {fmtKz(b.amount)}
														</Text>
													</View>
													<Text
														className="font-mono text-[11px] mt-0.5"
														style={{
															color: themeColors.secondary,
														}}
													>
														BL-
														{b.id
															.replace(/^bk_/, '')
															.toUpperCase()}
														{' · '}
														{
															ride.origin.name
														} →{' '}
														{ride.destination.name}
													</Text>
													<Text
														className="font-mono text-[11px]"
														style={{
															color: themeColors.secondary,
														}}
													>
														Saída{' '}
														{ride.departure.slice(
															0,
															10,
														)}
														{' · '}
														{ride.departure.slice(
															11,
															16,
														)}
													</Text>
													<View className="flex-row mt-2.5">
														<View className="flex-1 mr-2">
															<BoleiaButton
																small
																title="Aceitar"
																onPress={() =>
																	confirmBooking(
																		b.id,
																	)
																}
															/>
														</View>
														<View className="flex-1">
															<BoleiaButton
																small
																title="Recusar"
																variant="outline"
																onPress={() =>
																	declineBooking(
																		b.id,
																		'Lota não a bater certo',
																	)
																}
															/>
														</View>
													</View>
												</View>
											);
										})
									) : (
										<View className="flex-row items-center justify-between pt-2">
											<Text
												className="font-sans text-[12px]"
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

									{ride.status === 'concluida' &&
										bookings
											.filter(
												(b) => b.status === 'concluida',
											)
											.map((b) => {
												const pax = users.find(
													(u) =>
														u.id === b.passengerId,
												);
												return (
													<View
														key={b.id}
														className="pt-3 border-t flex-row items-center justify-between"
														style={{
															borderTopColor:
																themeColors.border,
														}}
													>
														<View className="flex-row items-center mr-2">
															<View
																className="w-8 h-8 rounded-full items-center justify-center mr-2"
																style={{
																	backgroundColor:
																		themeColors.border,
																}}
															>
																<Text
																	className="font-sansBold text-[11px]"
																	style={{
																		color: themeColors.text,
																	}}
																>
																	{pax
																		? initials(
																				pax.firstName,
																				pax.lastName,
																			)
																		: '?'}
																</Text>
															</View>
															<Text
																className="font-sansMedium text-[13px]"
																style={{
																	color: themeColors.text,
																}}
															>
																{pax
																	? `${pax.firstName} ${pax.lastName}`
																	: 'Passageiro'}
															</Text>
														</View>
														<View className="flex-1 ml-3">
															<BoleiaButton
																small
																variant="outline"
																title="Avaliar passageiro"
																onPress={() =>
																	navigation.navigate(
																		'Review',
																		{
																			rideId: ride.id,
																			toUserId:
																				b.passengerId,
																			subject:
																				'passenger',
																		},
																	)
																}
															/>
														</View>
													</View>
												);
											})}
								</View>
							)}
						</View>
					);
				})}
			</ScrollView>
		</SafeAreaView>
	);
}
