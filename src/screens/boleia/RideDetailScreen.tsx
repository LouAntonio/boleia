import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useSessionUserId } from '../../hooks/useSessionUser';
import { Eligibility, fetchEligibility } from '../../lib/eligibility';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import BoleiaButton from '../../components/BoleiaButton';
import TicketCard from '../../components/TicketCard';
import StickyCta from '../../components/StickyCta';
import SectionTitle from '../../components/SectionTitle';
import RouteStrip, { StripStop } from '../../components/RouteStrip';
import StatusStamp from '../../components/StatusStamp';
import { rideMode, rideProgress } from '../../mock/repos/rideRepo';
import { requestBooking } from '../../mock/repos/bookingRepo';
import BookingStub from '../../components/BookingStub';
import RidePeople from '../../components/RidePeople';
import { useDbStore } from '../../mock/db';
import { fmtKz, hhmm, durationBetween, initials } from '../../mock/helpers';

// Tinta fixa do avatar — igual às bandas dos bilhetes nos dois temas.
const ASFALTO = '#17141B';

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
	const driver = useDbStore((s) =>
		s.db.users.find((u) => u.id === ride?.driverId),
	);
	const bookings = useDbStore((s) => s.db.bookings);
	const users = useDbStore((s) => s.db.users);
	const sessionUserId = useSessionUserId();
	const myBooking = useDbStore((s) =>
		s.db.bookings.find(
			(b) =>
				b.rideId === route.params.rideId &&
				b.passengerId === sessionUserId &&
				b.status !== 'cancelada',
		),
	);

	const pick = 0; // recolha sempre na origem
	const [drop, setDrop] = useState(ride ? ride.stops.length + 1 : 1);
	const [seats, setSeats] = useState(1);
	const [result, setResult] = useState<
		{ ok: true; bookingId: string } | { ok: false; error: string } | null
	>(null);
	const [pending, setPending] = useState(false);
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
	// Gate real: pedir boleia exige KYC de passageiro verificado.
	const passengerBlocked = elig?.loaded === true && !elig.passengerReady;

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
	const onBoard = bookings
		.filter(
			(b) =>
				b.rideId === ride.id &&
				b.passengerId !== sessionUserId &&
				(b.status === 'confirmada' || b.status === 'em_viagem'),
		)
		.map((b) => users.find((u) => u.id === b.passengerId))
		.filter((u): u is NonNullable<typeof u> => !!u);

	const stripOrigin: StripStop = {
		place: ride.origin.name,
		time: hhmm(ride.departure),
		km: `${ride.origin.km} km`,
		kind: 'origin',
	};
	const stripStops: StripStop[] = ride.stops.map((s) => ({
		place: s.name,
		time: s.time,
		km: `${s.km} km`,
		kind: 'stop',
	}));
	const stripDestination: StripStop = {
		place: ride.destination.name,
		time: hhmm(ride.arrival),
		km: `${ride.destination.km} km`,
		kind: 'destination',
	};
	const seatsLeft = available;
	const dateLabel = new Date(ride.departure).toLocaleDateString('pt-PT', {
		day: 'numeric',
		month: 'short',
	});

	// Mesma lógica do botão inline anterior — agora na barra fixa.
	const submitRequest = () => {
		if (drop <= 0) return;
		if (passengerBlocked) {
			navigation.navigate('Kyc');
			return;
		}
		setPending(true);
		setTimeout(() => {
			const res = requestBooking({
				rideId: ride.id,
				passengerId: sessionUserId,
				seats,
				paymentMethod: 'multicaixa',
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
								res.error === 'cheia'
									? 'Já não há lugares suficientes nesta viagem.'
									: 'Pedido inválido.',
						},
			);
		}, 400);
	};

	if (myBooking) {
		return (
			<SafeAreaView
				className="flex-1 px-5"
				style={{ backgroundColor: themeColors.background }}
			>
				<Header
					title={ride.routeName}
					onBack={() => navigation.goBack()}
				/>
				<ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
					<BookingStub
						booking={myBooking}
						ride={ride}
						note={`${stops[myBooking.pickStopIndex].name} → ${stops[myBooking.dropStopIndex].name}`}
						footer={
							myBooking.status === 'pedido' ? (
								<Text
									className="font-sans text-[12px]"
									style={{ color: themeColors.laterite }}
								>
									O motorista confirma em ~6s (demo).
								</Text>
							) : myBooking.status === 'confirmada' ? (
								<Text
									className="font-sans text-[12px]"
									style={{ color: themeColors.secondary }}
								>
									Apresenta o teu número ao embarcar.
								</Text>
							) : myBooking.status === 'em_viagem' ? (
								<BoleiaButton
									title="Acompanhar ao vivo"
									onPress={() =>
										navigation.navigate('ActiveRide', {
											rideId: ride.id,
										})
									}
								/>
							) : myBooking.status === 'concluida' ? (
								<BoleiaButton
									title="Avaliar motorista"
									variant="outline"
									onPress={() =>
										navigation.navigate('Review', {
											rideId: ride.id,
											toUserId: ride.driverId,
											subject: 'driver',
										})
									}
								/>
							) : undefined
						}
					/>
					<RidePeople
						ride={ride}
						driver={driver}
						passengers={onBoard}
						onPressUser={(userId) =>
							navigation.navigate('PublicProfile', { userId })
						}
					/>
				</ScrollView>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView
			className="flex-1"
			style={{ backgroundColor: themeColors.background }}
		>
			<View className="px-5">
				<Header
					title="Detalhe da viagem"
					onBack={() => navigation.goBack()}
				/>
			</View>
			<ScrollView
				className="flex-1 px-5"
				contentContainerStyle={{ paddingBottom: 48 }}
			>
				<TicketCard accent="laterite" padded={false}>
					<View className="p-4">
						<View className="flex-row items-center justify-between mb-1">
							<View
								className="rounded-full px-2 py-0.5 border"
								style={{ borderColor: themeColors.border }}
							>
								<Text
									className="font-mono text-[9px] uppercase tracking-[1px]"
									style={{ color: themeColors.laterite }}
								>
									{rideMode(ride) === 'interprovincial'
										? 'Interprovincial'
										: 'Intermunicipal'}
								</Text>
							</View>
							<View className="flex-row items-center">
								<Text
									className="font-mono text-[10px] uppercase tracking-[1px] mr-2"
									style={{ color: themeColors.secondary }}
								>
									{dateLabel} · {hhmm(ride.departure)}
								</Text>
								<StatusStamp status={ride.status} />
							</View>
						</View>
						<Text
							className="font-display text-[21px] leading-7"
							style={{ color: themeColors.text }}
							numberOfLines={1}
						>
							{ride.origin.name} → {ride.destination.name}
						</Text>
						<View className="mt-3">
							<RouteStrip
								origin={stripOrigin}
								stops={stripStops}
								destination={stripDestination}
								progress={rideProgress(ride)}
							/>
						</View>
						<View
							className="mt-4 pt-3 border-t flex-row items-center justify-between"
							style={{ borderColor: themeColors.border }}
						>
							<Text
								className="font-mono text-[14px]"
								style={{ color: themeColors.text }}
							>
								{fmtKz(ride.pricePerSeat)}
								<Text
									className="font-sans text-[11px]"
									style={{ color: themeColors.secondary }}
								>
									{' '}
									/lugar
								</Text>
							</Text>
							<Text
								className="font-mono text-[12px]"
								style={{ color: themeColors.secondary }}
							>
								{durationBetween(ride.departure, ride.arrival)}{' '}
								·{' '}
								{seatsLeft > 0
									? `${seatsLeft} livre${seatsLeft === 1 ? '' : 's'}`
									: 'Lotada'}
							</Text>
						</View>
					</View>
				</TicketCard>

				{driver ? (
					<View className="mt-4">
						<TicketCard>
							<View className="flex-row items-center">
								<View
									className="w-11 h-11 rounded-full items-center justify-center"
									style={{
										backgroundColor: themeColors.primary,
										borderWidth: 2,
										borderColor: themeColors.laterite,
									}}
								>
									<Text
										className="font-display text-[14px]"
										style={{ color: ASFALTO }}
									>
										{initials(
											driver.firstName,
											driver.lastName,
										)}
									</Text>
								</View>
								<View className="flex-1 ml-3">
									<Text
										className="font-sansBold text-[14px]"
										style={{ color: themeColors.text }}
										numberOfLines={1}
									>
										{driver.firstName} {driver.lastName}
									</Text>
									<Text
										className="font-mono text-[11px] mt-0.5"
										style={{
											color: themeColors.secondary,
										}}
									>
										★{' '}
										{driver.rating
											? driver.rating.toFixed(1)
											: 'novo'}{' '}
										· motorista verificado
									</Text>
								</View>
								<BoleiaButton
									title="Ver perfil"
									variant="ghost"
									small
									onPress={() =>
										navigation.navigate('PublicProfile', {
											userId: driver.id,
										})
									}
								/>
							</View>
						</TicketCard>
					</View>
				) : null}

				<RidePeople
					ride={ride}
					driver={driver}
					passengers={onBoard}
					onPressUser={(userId) =>
						navigation.navigate('PublicProfile', { userId })
					}
				/>

				{/* Reserva */}
				<View className="mt-6">
					<TicketCard accent="laterite">
						<SectionTitle>Pedir boleia</SectionTitle>

						<Text
							className="font-sansMedium text-[12px] uppercase tracking-wider mb-1.5"
							style={{ color: themeColors.laterite }}
						>
							Sobes na origem
						</Text>
						<View
							className="rounded-xl px-3.5 py-3 flex-row items-center"
							style={{ backgroundColor: themeColors.background }}
						>
							<Text
								className="font-sansMedium text-[12px]"
								style={{ color: themeColors.text }}
							>
								↑ {stops[0].name}
							</Text>
						</View>

						<Text
							className="font-sansMedium text-[12px] uppercase tracking-wider mb-1.5 mt-3"
							style={{ color: themeColors.laterite }}
						>
							Onde desces
						</Text>
						<View className="flex-row flex-wrap">
							{stops.slice(1).map((s, i) => {
								const index = i + 1;
								const active = index === drop;
								return (
									<Pressable
										key={index}
										onPress={() => setDrop(index)}
										className="rounded-full px-3 py-1.5 mr-2 mb-2"
										style={{
											backgroundColor: active
												? themeColors.text
												: themeColors.background,
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
							Lugares ({available} livre
							{available === 1 ? '' : 's'})
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
						<View
							className="flex-row items-center justify-between px-3.5 py-3 rounded-xl"
							style={{ backgroundColor: themeColors.background }}
						>
							<View className="flex-row items-center">
								<Ionicons
									name="card"
									size={18}
									color={themeColors.text}
								/>
								<Text
									className="font-sansMedium text-[14px] ml-2"
									style={{ color: themeColors.text }}
								>
									Multicaixa Express
								</Text>
							</View>
							<Ionicons
								name="radio-button-on"
								size={20}
								color={themeColors.text}
							/>
						</View>
						<Text
							className="font-sans text-[12px] mt-1.5"
							style={{ color: themeColors.secondary }}
						>
							Pagas por Multicaixa Express quando confirmares o
							pedido.
						</Text>

						{result ? (
							result.ok ? (
								<View
									className="mt-4 p-4 rounded-2xl border flex-row items-center"
									style={{
										borderColor: themeColors.mato,
										backgroundColor: themeColors.card,
									}}
								>
									<Ionicons
										name="checkmark-circle"
										size={28}
										color={themeColors.mato}
									/>
									<View className="flex-1 ml-3">
										<Text
											className="font-sansBold text-[15px]"
											style={{ color: themeColors.mato }}
										>
											Pedido enviado
										</Text>
										<Text
											className="font-sans text-[13px] mt-0.5"
											style={{
												color: themeColors.secondary,
											}}
										>
											O motorista confirma em ~6s (demo).
											Segue o estado em Reservas.
										</Text>
									</View>
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

						{!result && passengerBlocked ? (
							<View className="mt-5">
								<View
									className="rounded-2xl border p-4"
									style={{
										borderColor: themeColors.laterite,
										backgroundColor: themeColors.card,
									}}
								>
									<Text
										className="font-sansBold text-[14px]"
										style={{ color: themeColors.text }}
									>
										Verifica a tua identidade
									</Text>
									<Text
										className="font-sans text-[12px] mt-1 leading-5"
										style={{
											color: themeColors.secondary,
										}}
									>
										Para pedir boleias precisas do KYC de
										passageiro verificado (BI + selfies).
									</Text>
									<View className="mt-3">
										<BoleiaButton
											title="Verificar identidade"
											onPress={() =>
												navigation.navigate('Kyc')
											}
										/>
									</View>
								</View>
							</View>
						) : null}
					</TicketCard>
				</View>
			</ScrollView>
			{!result ? (
				<StickyCta>
					<View className="flex-row items-center">
						<View className="flex-1 mr-3">
							<Text
								className="font-mono text-[9px] uppercase tracking-[2px]"
								style={{
									color: themeColors.card,
									opacity: 0.7,
								}}
							>
								Total
							</Text>
							<Text
								className="font-mono text-[18px] mt-0.5"
								style={{ color: themeColors.card }}
							>
								{fmtKz(total)}
							</Text>
							<Text
								className="font-mono text-[10px] mt-0.5"
								style={{
									color: themeColors.card,
									opacity: 0.7,
								}}
								numberOfLines={1}
							>
								{seats} lugar{seats === 1 ? '' : 'es'} ·{' '}
								{stops[drop]?.name ?? ''}
							</Text>
						</View>
						<View className="flex-1">
							<BoleiaButton
								title="Pedir boleia"
								small
								loading={pending}
								onPress={submitRequest}
							/>
						</View>
					</View>
				</StickyCta>
			) : null}
		</SafeAreaView>
	);
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
	const { themeColors } = useThemeColors();
	return (
		<View className="flex-row items-center pt-2 pb-3">
			<Pressable
				onPress={onBack}
				className="w-9 h-9 rounded-full items-center justify-center mr-3"
				style={{
					backgroundColor: themeColors.card,
					shadowColor: '#000',
					shadowOpacity: 0.1,
					shadowOffset: { width: 0, height: 2 },
					shadowRadius: 6,
					elevation: 2,
				}}
			>
				<Ionicons
					name="chevron-back"
					size={18}
					color={themeColors.text}
				/>
			</Pressable>
			<View className="flex-1">
				<Text
					className="font-mono text-[10px] uppercase tracking-[3px]"
					style={{ color: themeColors.laterite }}
				>
					Detalhe da viagem
				</Text>
				<Text
					className="font-display text-[20px] -mt-0.5"
					style={{ color: themeColors.text }}
				>
					{title}
				</Text>
			</View>
		</View>
	);
}

function Stepper({ label, onPress }: { label: string; onPress: () => void }) {
	const { themeColors } = useThemeColors();
	return (
		<Pressable
			onPress={onPress}
			className="w-10 h-10 rounded-full items-center justify-center"
			style={{ backgroundColor: themeColors.background }}
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
