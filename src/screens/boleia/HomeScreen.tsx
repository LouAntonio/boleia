import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useSessionUser, useSessionUserId } from '../../hooks/useSessionUser';
import { Eligibility, fetchEligibility } from '../../lib/eligibility';
import { useAppStore } from '../../store/appStore';
import { useDbStore } from '../../mock/db';
import { initials } from '../../mock/helpers';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import TripSearch from '../../components/TripSearch';
import Card from '../../components/Card';
import SectionTitle from '../../components/SectionTitle';

import TripListingCard from '../../components/TripListingCard';

// Viagens que o passageiro pode ainda embarcar.
const UPCOMING_STATUSES = ['pedido', 'confirmada', 'em_viagem'];

function BrandHeader({
	role,
	name,
	initialsLabel,
	onProfile,
}: {
	role: 'passenger' | 'driver';
	name?: string;
	initialsLabel: string;
	onProfile: () => void;
}) {
	const { themeColors } = useThemeColors();
	const hour = new Date().getHours();
	const greeting =
		hour < 12 ? 'Bom dia' : hour < 19 ? 'Boa tarde' : 'Boa noite';
	return (
		<View className="mb-5 flex-row items-start justify-between">
			<View className="flex-1 mr-3">
				<View className="flex-row items-baseline">
					<Text
						className="font-sansExtraBold text-title-primary"
						style={{ color: themeColors.text }}
					>
						Boleia
					</Text>
					<Text
						className="font-sansMedium text-body-xs ml-2"
						style={{ color: themeColors.secondary }}
					>
						{role === 'passenger' ? 'PASSAGEIRO' : 'MOTORISTA'}
					</Text>
				</View>
				<Text
					className="font-sansExtraBold text-title-secondary mt-0.5"
					style={{ color: themeColors.text }}
				>
					{greeting}, {name ?? 'viajante'}.
				</Text>
			</View>
			<Pressable
				onPress={onProfile}
				accessibilityRole="button"
				accessibilityLabel="Abrir perfil"
				className="w-12 h-12 rounded-full items-center justify-center"
				style={{
					backgroundColor: themeColors.accentWeak,
					borderWidth: 1,
					borderColor: themeColors.border,
				}}
			>
				<Text
					className="font-sansExtraBold text-label"
					style={{ color: themeColors.primary }}
				>
					{initialsLabel}
				</Text>
			</Pressable>
		</View>
	);
}

function CheckRow({
	index,
	label,
	done,
	locked,
	onPress,
}: {
	index: number;
	label: string;
	done: boolean;
	locked?: boolean;
	onPress?: () => void;
}) {
	const { themeColors } = useThemeColors();
	return (
		<Pressable
			onPress={onPress}
			disabled={locked || !onPress}
			className="flex-row items-center py-3"
			style={({ pressed }) => ({
				opacity: pressed ? 0.7 : 1,
			})}
		>
			<Text
				className="font-sansMedium text-body-xs w-6"
				style={{
					color: done ? themeColors.success : themeColors.secondary,
				}}
			>
				{index}
			</Text>
			<Text
				className="font-sansMedium text-body-small flex-1"
				style={{
					color: locked ? themeColors.secondary : themeColors.text,
				}}
			>
				{label}
			</Text>
			<Ionicons
				name={
					done
						? 'checkmark-circle'
						: locked
							? 'lock-closed-outline'
							: 'chevron-forward'
				}
				size={20}
				color={
					done
						? themeColors.success
						: locked
							? themeColors.border
							: themeColors.secondary
				}
			/>
		</Pressable>
	);
}

export default function HomeScreen() {
	const { themeColors } = useThemeColors();
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'Main'>
		>();
	const currentRole = useAppStore((s) => s.currentRole);
	const me = useSessionUser();
	const sessionUserId = useSessionUserId();
	const rides = useDbStore((s) => s.db.rides);
	const bookings = useDbStore((s) => s.db.bookings);
	const [elig, setElig] = useState<Eligibility | null>(null);
	useFocusEffect(
		useCallback(() => {
			let alive = true;
			fetchEligibility().then((e) => {
				if (alive) setElig(e);
			});
			return () => {
				alive = false;
			};
		}, []),
	);
	const kycOk = elig?.loaded
		? elig.kycDriver?.status === 'VERIFIED'
		: me?.kyc?.status === 'verificado';
	const vehicleOk = elig?.loaded
		? elig.verifiedVehicles.length > 0
		: me?.vehicle?.status === 'verificado';
	const ready = !!(kycOk && vehicleOk);

	const goToTab = (name: string) =>
		(navigation as unknown as { navigate: (n: string) => void }).navigate(
			name,
		);

	// Próxima reserva do passageiro — faixa "A seguir".
	const nextUp = bookings
		.filter(
			(b) =>
				b.passengerId === sessionUserId &&
				UPCOMING_STATUSES.includes(b.status),
		)
		.flatMap((b) => {
			const ride = rides.find((r) => r.id === b.rideId);
			return ride ? [{ booking: b, ride }] : [];
		})
		.sort(
			(a, b) =>
				Date.parse(a.ride.departure) - Date.parse(b.ride.departure),
		)[0];

	// Próximos embarques — mesma montra do Explorar, só os 3 primeiros.
	const nextRides = rides
		.filter(
			(r) =>
				r.status === 'programada' &&
				r.seatsTaken < r.seatsTotal &&
				Date.parse(r.departure) > Date.now(),
		)
		.sort((a, b) => Date.parse(a.departure) - Date.parse(b.departure))
		.slice(0, 3);

	// O ponto é reforço visual; o significado real está em `statusLabel` (regra
	// do design system: nunca só cor). "A aguardar" é pendente, não um aviso —
	// por isso é neutro. `caution` foi descartado aqui por ser demasiado claro
	// sobre `card` (~1.6:1, abaixo do mínimo de 3:1 para elemento não-textual).
	const statusDot =
		nextUp?.booking.status === 'em_viagem'
			? themeColors.primary
			: nextUp?.booking.status === 'confirmada'
				? themeColors.success
				: themeColors.secondary;
	const statusLabel =
		nextUp?.booking.status === 'em_viagem'
			? 'Ao vivo'
			: nextUp?.booking.status === 'confirmada'
				? 'Confirmada'
				: 'A aguardar';

	return (
		<SafeAreaView
			className="flex-1"
			style={{ backgroundColor: themeColors.background }}
		>
			<ScrollView
				className="flex-1 px-5"
				contentContainerStyle={{ paddingBottom: 40 }}
				keyboardShouldPersistTaps="handled"
			>
				<BrandHeader
					role={currentRole}
					name={
						me
							? `${me.firstName}${me.lastName ? ` ${me.lastName}` : ''}`
							: undefined
					}
					initialsLabel={
						me ? initials(me.firstName, me.lastName) : '?'
					}
					onProfile={() =>
						goToTab(
							currentRole === 'passenger'
								? 'PassengerProfile'
								: 'DriverProfile',
						)
					}
				/>

				{currentRole === 'passenger' ? (
					<View>
						<TripSearch />

						{nextUp ? (
							<View className="mt-6">
								<SectionTitle>A seguir</SectionTitle>
								<View className="mt-4">
									<Card>
										<Pressable
											onPress={() =>
												navigation.navigate(
													'RideDetail',
													{
														rideId: nextUp.ride.id,
													},
												)
											}
											className="flex-row items-center"
											style={({ pressed }) => ({
												opacity: pressed ? 0.7 : 1,
											})}
										>
											<View
												className="w-2.5 h-2.5 rounded-full mr-2.5"
												style={{
													backgroundColor: statusDot,
												}}
											/>
											<View className="flex-1">
												<Text
													className="font-sansExtraBold text-label"
													style={{
														color: themeColors.text,
													}}
													numberOfLines={1}
												>
													{nextUp.ride.origin.name} →{' '}
													{
														nextUp.ride.destination
															.name
													}
												</Text>
												<Text
													className="font-sansMedium text-body-xs mt-0.5"
													style={{
														color: themeColors.secondary,
													}}
												>
													{statusLabel} ·{' '}
													{new Date(
														nextUp.ride.departure,
													).toLocaleDateString(
														'pt-PT',
														{
															weekday: 'short',
															day: 'numeric',
															month: 'short',
														},
													)}
												</Text>
											</View>
											<Ionicons
												name="chevron-forward"
												size={18}
												color={themeColors.secondary}
											/>
										</Pressable>
									</Card>
								</View>
							</View>
						) : null}

						{nextRides.length > 0 ? (
							<View className="mt-6">
								<View className="flex-row items-center justify-between mb-4">
									<SectionTitle>
										Embarques próximos
									</SectionTitle>
									<Pressable
										onPress={() =>
											goToTab('PassengerExplore')
										}
									>
										<Text
											className="font-sansBold text-body-xs"
											style={{
												color: themeColors.secondary,
											}}
										>
											Ver tudo →
										</Text>
									</Pressable>
								</View>
								{nextRides.map((ride) => (
									<View key={ride.id} className="mb-4">
										<TripListingCard
											ride={ride}
											onPress={() =>
												navigation.navigate(
													'RideDetail',
													{ rideId: ride.id },
												)
											}
										/>
									</View>
								))}
							</View>
						) : null}
					</View>
				) : (
					<View>
						<SectionTitle>Painel de motorista</SectionTitle>
						<View className="mt-4">
							<Card>
								<Text
									className="font-sansExtraBold text-title-secondary"
									style={{ color: themeColors.text }}
								>
									A tua central
								</Text>
								<Text
									className="font-sans text-body-small mt-1 leading-5"
									style={{ color: themeColors.secondary }}
								>
									Três passos até à estrada. Demora cerca de 5
									minutos.
								</Text>
								<View
									className="mt-2 border-t"
									style={{
										borderColor: themeColors.border,
									}}
								>
									<CheckRow
										index={1}
										label="BI e carta de condução"
										done={!!kycOk}
										onPress={() =>
											navigation.navigate('Kyc')
										}
									/>
									<View
										className="border-t"
										style={{
											borderColor: themeColors.border,
										}}
									/>
									<CheckRow
										index={2}
										label="Viatura"
										done={!!vehicleOk}
										onPress={() =>
											navigation.navigate('Vehicle')
										}
									/>
									<View
										className="border-t"
										style={{
											borderColor: themeColors.border,
										}}
									/>
									<CheckRow
										index={3}
										label="Publicar viagem"
										done={false}
										locked={!ready}
										onPress={
											ready
												? () => goToTab('DriverPublish')
												: undefined
										}
									/>
								</View>
							</Card>
						</View>
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}
