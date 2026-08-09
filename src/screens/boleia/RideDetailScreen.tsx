import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import TripStripCard from '../../components/TripStripCard';
import StatusStamp from '../../components/StatusStamp';
import BoleiaButton from '../../components/BoleiaButton';
import SectionTitle from '../../components/SectionTitle';
import { rideProgress } from '../../mock/repos/rideRepo';
import { requestBooking } from '../../mock/repos/bookingRepo';
import { useDbStore } from '../../mock/db';
import { fmtKz, initials } from '../../mock/helpers';
import { PaymentKind } from '../../types/boleia';

const METHODS: { kind: PaymentKind; label: string }[] = [
	{ kind: 'carteira', label: 'Carteira Boleia' },
	{ kind: 'dinheiro', label: 'Pagamento ao motorista' },
	{ kind: 'multicaixa', label: 'Multicaixa' },
];

export default function RideDetailScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'RideDetail'>
		>();
	const route = useRoute<RouteProp<BoleiaMainStackParamList, 'RideDetail'>>();
	const { themeColors } = useThemeColors();

	const ride = useDbStore((s) =>
		s.db.rides.find((r) => r.id === route.params.rideId),
	);
	const me = useDbStore((s) => s.db.users.find((u) => u.id === 'u_me_001'));
	const driver = useDbStore((s) =>
		s.db.users.find((u) => u.id === ride?.driverId),
	);
	const myBooking = useDbStore((s) =>
		s.db.bookings.find(
			(b) =>
				b.rideId === route.params.rideId &&
				b.passengerId === 'u_me_001' &&
				b.status !== 'cancelada',
		),
	);

	const [pick, setPick] = useState(0);
	const [drop, setDrop] = useState(ride ? ride.stops.length + 1 : 1);
	const [seats, setSeats] = useState(1);
	const [method, setMethod] = useState<PaymentKind>('carteira');
	const [result, setResult] = useState<
		{ ok: true; bookingId: string } | { ok: false; error: string } | null
	>(null);
	const [pending, setPending] = useState(false);

	if (!ride) {
		return (
			<SafeAreaView
				className="flex-1 items-center justify-center"
				style={{ backgroundColor: themeColors.background }}
			>
				<Text style={{ color: themeColors.secondary }}>
					Viagem não encontrada.
				</Text>
			</SafeAreaView>
		);
	}

	const available = ride.seatsTotal - ride.seatsTaken;
	const total = seats * ride.pricePerSeat;
	const stops = [ride.origin, ...ride.stops, ride.destination];
	const walletOk = me ? me.wallet >= total : false;

	if (myBooking) {
		return (
			<SafeAreaView
				className="flex-1 px-5"
				style={{ backgroundColor: themeColors.background }}
			>
				<Header
					title="Detalhe da viagem"
					onBack={() => navigation.goBack()}
				/>
				<ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
					<TripStripCard ride={ride} />
					<View
						className="mt-4 p-4 rounded-2xl border"
						style={{
							borderColor: themeColors.border,
							backgroundColor: themeColors.card,
						}}
					>
						<View className="flex-row items-center justify-between">
							<Text
								className="font-sansBold text-[15px]"
								style={{ color: themeColors.text }}
							>
								A tua reserva
							</Text>
							<StatusStamp status={myBooking.status} />
						</View>
						<Text
							className="font-sans text-[13px] mt-1"
							style={{ color: themeColors.secondary }}
						>
							{myBooking.seats} lugar
							{myBooking.seats > 1 ? 'es' : ''} ·{' '}
							{fmtKz(myBooking.amount)} ·{' '}
							{stops[myBooking.pickStopIndex].name} →{' '}
							{stops[myBooking.dropStopIndex].name}
						</Text>
						{myBooking.status === 'pedido' && (
							<Text
								className="font-sans text-[12px] mt-2"
								style={{ color: themeColors.laterite }}
							>
								O motorista confirma em ~6s (demo).
							</Text>
						)}
					</View>
					{myBooking.status === 'em_viagem' && (
						<View className="mt-4">
							<BoleiaButton
								title="Acompanhar ao vivo"
								onPress={() =>
									navigation.navigate('ActiveRide', {
										rideId: ride.id,
									})
								}
							/>
						</View>
					)}
					{myBooking.status === 'concluida' && (
						<View className="mt-4">
							<BoleiaButton
								title="Avaliar motorista"
								variant="outline"
								onPress={() =>
									navigation.navigate('Review', {
										rideId: ride.id,
										toUserId: ride.driverId,
									})
								}
							/>
						</View>
					)}
				</ScrollView>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView
			className="flex-1 px-5"
			style={{ backgroundColor: themeColors.background }}
		>
			<Header
				title="Detalhe da viagem"
				onBack={() => navigation.goBack()}
			/>
			<ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
				<TripStripCard ride={ride} progress={rideProgress(ride)} />

				{/* Motorista */}
				<Pressable
					onPress={() =>
						navigation.navigate('PublicProfile', {
							userId: ride.driverId,
						})
					}
					className="mt-4 p-3 rounded-2xl border flex-row items-center"
					style={{
						borderColor: themeColors.border,
						backgroundColor: themeColors.card,
					}}
				>
					<View
						className="w-11 h-11 rounded-full items-center justify-center"
						style={{ backgroundColor: themeColors.primary }}
					>
						<Text
							className="font-display text-[15px]"
							style={{ color: themeColors.text }}
						>
							{driver
								? initials(driver.firstName, driver.lastName)
								: '?'}
						</Text>
					</View>
					<View className="flex-1 ml-3">
						<Text
							className="font-sansBold text-[14px]"
							style={{ color: themeColors.text }}
						>
							{driver
								? `${driver.firstName} ${driver.lastName}`
								: '—'}
						</Text>
						<Text
							className="font-mono text-[12px]"
							style={{ color: themeColors.laterite }}
						>
							★ {driver?.rating?.toFixed(1) ?? 'novo'} ·{' '}
							{driver?.vehicle
								? `${driver.vehicle.make} ${driver.vehicle.model}`
								: 'viatura'}
						</Text>
					</View>
					<Ionicons
						name="chevron-forward"
						size={18}
						color={themeColors.border}
					/>
				</Pressable>

				{/* Reserva */}
				<View className="mt-6">
					<SectionTitle>Pedir boleia</SectionTitle>

					<Text
						className="font-sansMedium text-[12px] uppercase tracking-wider mb-1.5"
						style={{ color: themeColors.laterite }}
					>
						Subir e descer
					</Text>
					<View className="flex-row flex-wrap">
						{stops.map((s, i) => {
							const active = i === pick || i === drop;
							const done =
								pick < drop && i >= pick && i <= drop
									? 'between'
									: '';
							return (
								<Pressable
									key={i}
									onPress={() => {
										if (i === pick) {
											setPick(Math.min(i, drop - 1));
										} else if (i === drop) {
											setDrop(Math.max(i, pick + 1));
										} else if (i < pick) {
											setPick(i);
										} else {
											setDrop(i);
										}
									}}
									className="rounded-full px-3 py-1.5 border mr-2 mb-2"
									style={{
										borderColor:
											done === 'between'
												? themeColors.primary
												: active
													? themeColors.text
													: themeColors.border,
										backgroundColor: active
											? themeColors.text
											: themeColors.card,
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
										{i === pick
											? '↑ '
											: i === drop
												? '↓ '
												: ''}
										{s.name}
									</Text>
								</Pressable>
							);
						})}
					</View>

					<Text
						className="font-sansMedium text-[12px] uppercase tracking-wider mb-1.5 mt-3"
						style={{ color: themeColors.laterite }}
					>
						Lugares ({available} livre{available === 1 ? '' : 's'})
					</Text>
					<View className="flex-row items-center">
						{seats > 1 && (
							<Stepper
								label="−"
								onPress={() =>
									setSeats((v) => Math.max(1, v - 1))
								}
							/>
						)}
						<Text
							className="font-mono text-[26px] mx-6"
							style={{ color: themeColors.text }}
						>
							{seats}
						</Text>
						<Stepper
							label="+"
							onPress={() =>
								setSeats((v) => Math.min(available, v + 1))
							}
						/>
						<View className="flex-1 items-end">
							<Text
								className="font-mono text-[18px]"
								style={{ color: themeColors.text }}
							>
								{fmtKz(total)}
							</Text>
						</View>
					</View>

					<Text
						className="font-sansMedium text-[12px] uppercase tracking-wider mb-1.5 mt-3"
						style={{ color: themeColors.laterite }}
					>
						Como pagas
					</Text>
					<View>
						{METHODS.map((m) => {
							const isCarteira = m.kind === 'carteira';
							const low = isCarteira && !walletOk;
							const active = method === m.kind;
							return (
								<Pressable
									key={m.kind}
									disabled={low}
									onPress={() => setMethod(m.kind)}
									className="flex-row items-center justify-between py-3 px-3.5 rounded-xl border mb-2"
									style={{
										borderColor: active
											? themeColors.text
											: themeColors.border,
										backgroundColor: themeColors.card,
										opacity: low ? 0.45 : 1,
									}}
								>
									<Text
										className="font-sansMedium text-[14px]"
										style={{ color: themeColors.text }}
									>
										{m.label}
										{isCarteira && (
											<Text className="font-mono text-[12px]">
												{'  '}
												{me ? fmtKz(me.wallet) : ''}
											</Text>
										)}
									</Text>
									<Ionicons
										name={
											active
												? 'radio-button-on'
												: 'radio-button-off'
										}
										size={20}
										color={
											active
												? themeColors.text
												: themeColors.border
										}
									/>
								</Pressable>
							);
						})}
					</View>

					{result ? (
						result.ok ? (
							<View
								className="mt-4 p-4 rounded-2xl border"
								style={{
									borderColor: themeColors.mato,
									backgroundColor: themeColors.card,
								}}
							>
								<Text
									className="font-sansBold text-[15px]"
									style={{ color: themeColors.mato }}
								>
									Pedido enviado ✓
								</Text>
								<Text
									className="font-sans text-[13px] mt-1"
									style={{ color: themeColors.secondary }}
								>
									O motorista confirma em ~6s (demo). Segue o
									estado em Reservas.
								</Text>
							</View>
						) : (
							<Text
								className="font-sans text-[13px] mt-4"
								style={{ color: themeColors.error }}
							>
								{result.error}
							</Text>
						)
					) : null}

					{!result && (
						<View className="mt-5">
							<BoleiaButton
								title="Pedir boleia"
								onPress={() => {
									if (pick === drop) return;
									setPending(true);
									setTimeout(() => {
										const res = requestBooking({
											rideId: ride.id,
											passengerId: 'u_me_001',
											seats,
											paymentMethod: method,
											pickStopIndex: pick,
											dropStopIndex: drop,
										});
										setPending(false);
										setResult(
											res.ok
												? res
												: {
														ok: false,
														error:
															res.error ===
															'cheia'
																? 'Já não há lugares suficientes nesta viagem.'
																: res.error ===
																	  'sem_fundos'
																	? 'Carteira sem saldo. Escolhe outro método de pagamento.'
																	: 'Pedido inválido.',
													},
										);
									}, 400);
								}}
								loading={pending}
							/>
						</View>
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
	const { themeColors } = useThemeColors();
	return (
		<View className="flex-row items-center pt-2 pb-3">
			<Pressable
				onPress={onBack}
				className="w-9 h-9 rounded-full items-center justify-center border mr-3"
				style={{
					borderColor: themeColors.border,
					backgroundColor: themeColors.card,
				}}
			>
				<Ionicons
					name="chevron-back"
					size={18}
					color={themeColors.text}
				/>
			</Pressable>
			<Text
				className="font-display text-[20px]"
				style={{ color: themeColors.text }}
			>
				{title}
			</Text>
		</View>
	);
}

function Stepper({ label, onPress }: { label: string; onPress: () => void }) {
	const { themeColors } = useThemeColors();
	return (
		<Pressable
			onPress={onPress}
			className="w-10 h-10 rounded-full items-center justify-center border"
			style={{
				borderColor: themeColors.border,
				backgroundColor: themeColors.card,
			}}
		>
			<Text
				className="font-display text-[18px]"
				style={{ color: themeColors.text }}
			>
				{label}
			</Text>
		</Pressable>
	);
}
