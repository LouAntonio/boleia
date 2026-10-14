import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '../../lib/queryKeys';
import BackButton from '../../components/BackButton';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useSessionUserId } from '../../hooks/useSessionUser';
import { Eligibility, fetchEligibility } from '../../lib/eligibility';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import BoleiaButton from '../../components/BoleiaButton';
import Card from '../../components/Card';
import StickyCta from '../../components/StickyCta';
import SectionTitle from '../../components/SectionTitle';
import RouteStrip, { StripStop } from '../../components/RouteStrip';
import StatusStamp from '../../components/StatusStamp';
import BookingStub from '../../components/BookingStub';
import {
	apiErrorMessage,
	bookRide,
	getRide,
	listMyBookings,
} from '../../lib/api';
import {
	toRide,
	toBooking,
	seatsLeft,
	rideProgressFraction,
} from '../../lib/rideMapper';
import {
	hhmm,
	durationBetween,
	fmtKz,
	fmtKm,
	fmtDayMonth,
	initials,
	dateOf,
} from '../../lib/format';

export default function RideDetailScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'RideDetail'>
		>();
	const route = useRoute<RouteProp<BoleiaMainStackParamList, 'RideDetail'>>();
	const { themeColors } = useThemeColors();
	const queryClient = useQueryClient();
	const sessionUserId = useSessionUserId();

	// A corrida vem do backend. Um `useQuery` em vez de estado local para que
	// o detalhe reflecta logo um lugar que o passageiro acabou de perder, sem
	// ter de recarregar o ecrã.
	const { data: apiRide, isLoading } = useQuery({
		queryKey: qk.ride.of(route.params.rideId),
		queryFn: () => getRide(route.params.rideId),
	});

	// Só as reservas do próprio passageiro interessam aqui: o ecrã mostra o
	// estado do pedido dele, não o livro de reservas da corrida (que é do
	// motorista e exige KYC verificado).
	const { data: myBookings } = useQuery({
		queryKey: qk.myBookings.all,
		queryFn: listMyBookings,
		enabled: !!sessionUserId,
	});

	const ride = apiRide ? toRide(apiRide) : undefined;
	// O backend envia o motorista com o nome e o id, que é tudo o que este
	// ecrã precisa. Não há dados inventados.
	const driver = apiRide?.driver;
	/*
	 * Uma reserva só bloqueia o ecrã se ainda estiver viva.
	 *
	 * O filtro anterior só excluía `CANCELLED`, o que deixava `REJECTED` e
	 * `EXPIRED` a satisfazerem a busca: se o motorista recusasse, a pessoa via
	 * o `BookingStub` em vez do formulário, e **não conseguia pedir lugar de
	 * novo** a partir do ecrã da corrida. O servidor aceitaria — `createBooking`
	 * só barra com `REQUESTED`/`CONFIRMED`. Era só a UI a dizer que não.
	 */
	const myBookingApi = myBookings?.find(
		(b) =>
			b.rideId === route.params.rideId &&
			b.passengerId === sessionUserId &&
			(b.status === 'REQUESTED' ||
				b.status === 'CONFIRMED' ||
				b.status === 'IN_PROGRESS'),
	);
	const myBooking = myBookingApi ? toBooking(myBookingApi) : undefined;

	const pick = 0; // recolha sempre na origem
	const [drop, setDrop] = useState(1);
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
				className="flex-1 items-center justify-center px-8"
				style={{ backgroundColor: themeColors.background }}
			>
				<Text
					style={{
						color: themeColors.secondary,
						textAlign: 'center',
					}}
				>
					{isLoading
						? 'A carregar a viagem…'
						: 'Viagem não encontrada.'}
				</Text>
			</SafeAreaView>
		);
	}

	const available = seatsLeft(ride);
	const total = seats * ride.pricePerSeat;
	const stops = [ride.origin, ...ride.stops, ride.destination];
	// Quantas pessoas já reservaram lugar, sem dizer quem. Os dados de outros
	// utilizadores não são públicos: só o próprio passageiro e o motorista
	// devem ver a identidade de quem embarca.
	const onBoardCount = Math.max(0, ride.seatsTaken);

	const stripOrigin: StripStop = {
		place: ride.origin.name,
		time: hhmm(ride.departure),
		km: fmtKm(ride.origin.km),
		kind: 'origin',
	};
	const stripStops: StripStop[] = ride.stops.map((s) => ({
		place: s.name,
		time: s.time,
		km: fmtKm(s.km),
		kind: 'stop',
	}));
	const stripDestination: StripStop = {
		place: ride.destination.name,
		time: hhmm(ride.arrival),
		km: fmtKm(ride.destination.km),
		kind: 'destination',
	};
	const dateLabel = fmtDayMonth(dateOf(ride.departure));

	/**
	 * Pede um lugar à corrida.
	 *
	 * A v1 só aceita pagamento em dinheiro: o backend tem `WALLET` e
	 * `MULTICAIXA`, mas sem carteira nem integração Multicaixa o pagamento não
	 * concluiria, e o passageiro ficaria com uma reserva que nunca é paga.
	 */
	const submitRequest = async () => {
		if (drop <= 0 || pending) return;
		if (passengerBlocked) {
			navigation.navigate('Kyc');
			return;
		}
		setPending(true);
		setResult(null);
		try {
			const booking = await bookRide(ride.id, {
				seats,
				paymentMethod: 'CASH',
				pickStopIndex: pick,
				dropStopIndex: drop,
			});
			setResult({ ok: true, bookingId: booking.id });
			// A lista de reservas do passageiro passou a ter uma entrada nova.
			await queryClient.invalidateQueries({
				queryKey: qk.myBookings.all,
			});
		} catch (error) {
			setResult({
				ok: false,
				error: apiErrorMessage(
					error,
					'Não foi possível pedir o lugar.',
				),
			});
		} finally {
			setPending(false);
		}
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
					{/*
					 * Os índices vêm do servidor. `cleanStopIndexes` valida
					 * contra o número de paragens que o servidor tem, e esse
					 * número pode ser maior do que o que este cliente tem em
					 * `stops` — por exemplo se a corrida foi editada depois
					 * de a reserva ser criada. Sem a guarda, isto rebenta em
					 * `TypeError` a meio do ecrã de reserva, que é o pior
					 * sítio para um crash.
					 */}
					<BookingStub
						booking={myBooking}
						ride={ride}
						note={`${stops[myBooking.pickStopIndex]?.name ?? 'Recolha'} → ${stops[myBooking.dropStopIndex]?.name ?? 'Destino'}`}
						footer={
							myBooking.status === 'pedido' ? (
								<Text
									className="font-sans text-body-xs"
									style={{ color: themeColors.secondary }}
								>
									Fica à espera da resposta do motorista.
									Avisamos-te quando decidir.
								</Text>
							) : myBooking.status === 'confirmada' ? (
								<Text
									className="font-sans text-body-xs"
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
				<Card padded={false}>
					<View className="p-4">
						<View className="flex-row items-center justify-between mb-1">
							<View
								className="rounded-full px-2 py-0.5 border"
								style={{ borderColor: themeColors.border }}
							>
								<Text
									className="font-sansMedium text-body-xs"
									style={{ color: themeColors.secondary }}
								>
									{/*
									 * A interprovincialidade deixou de ser um
									 * rótulo: o número de paragens intermédias é
									 * o que o passageiro reconhece.
									 */}
									{ride.stops.length > 0
										? `${ride.stops.length} paragem${ride.stops.length === 1 ? '' : 'ens'} pelo caminho`
										: 'Direto, sem paragens'}
								</Text>
							</View>
							<View className="flex-row items-center">
								<Text
									className="font-sansMedium text-body-xs mr-2"
									style={{ color: themeColors.secondary }}
								>
									{dateLabel} · {hhmm(ride.departure)}
								</Text>
								<StatusStamp status={ride.status} />
							</View>
						</View>
						<Text
							className="font-sansExtraBold text-title-secondary leading-7"
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
								progress={rideProgressFraction(ride)}
							/>
						</View>
						<View
							className="mt-4 pt-3 border-t flex-row items-center justify-between"
							style={{ borderColor: themeColors.border }}
						>
							<Text
								className="font-sansMedium text-body-small"
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
								{durationBetween(ride.departure, ride.arrival)}{' '}
								·{' '}
								{available > 0
									? `${available} livre${available === 1 ? '' : 's'}`
									: 'Lotada'}
							</Text>
						</View>
					</View>
				</Card>

				{driver ? (
					<View className="mt-4">
						<Card>
							<View className="flex-row items-center">
								<View
									className="w-11 h-11 rounded-full items-center justify-center"
									style={{
										backgroundColor: themeColors.accentWeak,
										borderWidth: 1,
										borderColor: themeColors.border,
									}}
								>
									<Text
										className="font-sansExtraBold text-body-small"
										style={{ color: themeColors.primary }}
									>
										{initials(driver.name, '')}
									</Text>
								</View>
								<View className="flex-1 ml-3">
									<Text
										className="font-sansBold text-body-small"
										style={{ color: themeColors.text }}
										numberOfLines={1}
									>
										{driver.name}
									</Text>
									<Text
										className="font-sansMedium text-body-xs mt-0.5"
										style={{
											color: themeColors.secondary,
										}}
									>
										{/*
										 * Não há backend de avaliações, por isso não
										 * há nota a mostrar. Só se afirma o que o
										 * servidor garante: só quem tem KYC e
										 * viatura verificadas publica corridas.
										 */}
										Motorista verificado
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
						</Card>
					</View>
				) : null}

				{/* Quantas pessoas já reservaram. A identidade de quem vai
				    embarcar não é pública: só o passageiro e o motorista a
				    devem ver. */}
				<View className="mt-4">
					<Card>
						<View className="flex-row items-center">
							<Ionicons
								name="people-outline"
								size={20}
								color={themeColors.secondary}
							/>
							<Text
								className="font-sans text-body-small ml-2 flex-1"
								style={{ color: themeColors.secondary }}
							>
								{onBoardCount === 0
									? 'Ainda ninguém reservou lugar.'
									: `${onBoardCount} pessoa${onBoardCount === 1 ? '' : 's'} já reservou${onBoardCount === 1 ? '' : 'am'}.`}
							</Text>
						</View>
					</Card>
				</View>

				{/* Reserva */}
				<View className="mt-6">
					<Card>
						<SectionTitle>Pedir boleia</SectionTitle>

						<Text
							className="font-sansMedium text-body-xs mb-1.5"
							style={{ color: themeColors.secondary }}
						>
							Sobes na origem
						</Text>
						<View
							className="rounded-xl px-3.5 py-3 flex-row items-center"
							style={{ backgroundColor: themeColors.background }}
						>
							<Text
								className="font-sansMedium text-body-xs"
								style={{ color: themeColors.text }}
							>
								↑ {stops[0].name}
							</Text>
						</View>

						<Text
							className="font-sansMedium text-body-xs mb-1.5 mt-3"
							style={{ color: themeColors.secondary }}
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
											className="font-sansMedium text-body-xs"
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
							className="font-sansMedium text-body-xs mb-1.5 mt-3"
							style={{ color: themeColors.secondary }}
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
								className="font-sansMedium text-title-primary mx-6"
								style={{ color: themeColors.text }}
							>
								{seats}
							</Text>
							<Stepper
								label="+"
								/*
								 * O clamp sozinho não chega. Com `available === 0`,
								 * `Math.min(0, v + 1)` dava 0, e o `−` só aparece
								 * com `seats > 1` — não havia forma de recuperar:
								 * o botão de reservar envava `seats: 0` e o
								 * servidor respondia 400 sem explicar.
								 */
								onPress={() => {
									if (available > 0)
										setSeats((v) =>
											Math.min(available, v + 1),
										);
								}}
							/>
							<View className="flex-1 items-end">
								<Text
									className="font-sansMedium text-title-tertiary"
									style={{ color: themeColors.text }}
								>
									{fmtKz(total)}
								</Text>
							</View>
						</View>

						<Text
							className="font-sansMedium text-body-xs mb-1.5 mt-3"
							style={{ color: themeColors.secondary }}
						>
							Como pagas
						</Text>
						<View
							className="flex-row items-center justify-between px-3.5 py-3 rounded-xl"
							style={{ backgroundColor: themeColors.background }}
						>
							<View className="flex-row items-center">
								<Ionicons
									name="cash-outline"
									size={18}
									color={themeColors.text}
								/>
								<Text
									className="font-sansMedium text-body-small ml-2"
									style={{ color: themeColors.text }}
								>
									Dinheiro
								</Text>
							</View>
							<Ionicons
								name="radio-button-on"
								size={20}
								color={themeColors.text}
							/>
						</View>
						{/*
						 * Este ecrã oferecia "Multicaixa Express" com um
						 * radio marcado, e o pedido era enviado com
						 * `paymentMethod: 'CASH'`. Não há integração Multicaixa:
						 * `WalletTransaction` está no esquema e não tem código,
						 * e `PAYMENT_METHODS` aceita `WALLET` e `MULTICAIXA` sem
						 * que nada os trate. O `AGENTS.md` diz que a v1 é só
						 * dinheiro — a interface é que não reflectia isso.
						 */}
						<Text
							className="font-sans text-body-xs mt-1.5"
							style={{ color: themeColors.secondary }}
						>
							Pagas ao motorista, em dinheiro, na hora do
							embarque.
						</Text>

						{result ? (
							result.ok ? (
								<View
									className="mt-4 p-4 rounded-xl border flex-row items-center"
									style={{
										borderColor: themeColors.success,
										backgroundColor: themeColors.card,
									}}
								>
									<Ionicons
										name="checkmark-circle"
										size={28}
										color={themeColors.success}
									/>
									<View className="flex-1 ml-3">
										<Text
											className="font-sansBold text-label-small"
											style={{
												color: themeColors.success,
											}}
										>
											Pedido enviado
										</Text>
										<Text
											className="font-sans text-body-small mt-0.5"
											style={{
												color: themeColors.secondary,
											}}
										>
											Fica à espera da resposta do
											motorista. Segue o estado em
											Reservas.
										</Text>
									</View>
								</View>
							) : (
								<Text
									className="font-sans text-body-small mt-4"
									style={{ color: themeColors.error }}
								>
									{result.error}
								</Text>
							)
						) : null}

						{!result && passengerBlocked ? (
							<View className="mt-5">
								<View
									className="rounded-xl border p-4"
									style={{
										borderColor: themeColors.border,
										backgroundColor: themeColors.card,
									}}
								>
									<Text
										className="font-sansBold text-body-small"
										style={{ color: themeColors.text }}
									>
										Verifica a tua identidade
									</Text>
									<Text
										className="font-sans text-body-xs mt-1 leading-5"
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
					</Card>
				</View>
			</ScrollView>
			{!result ? (
				<StickyCta>
					<View className="flex-row items-center">
						<View className="flex-1 mr-3">
							<Text
								className="font-sansMedium text-body-xs"
								style={{
									color: themeColors.card,
									opacity: 0.7,
								}}
							>
								Total
							</Text>
							<Text
								className="font-sansMedium text-title-tertiary mt-0.5"
								style={{ color: themeColors.card }}
							>
								{fmtKz(total)}
							</Text>
							<Text
								className="font-sansMedium text-body-xs mt-0.5"
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
			{/*
			 * O `BackButton` partilhado, não um `Pressable` com `chevron-back`
			 * reescrito à mão. A versão local tinha 36×36 com `hitSlop={4}` — o
			 * alvo de toque chegava aos 44 por sorte, mas **sem nome
			 * acessível**: o leitor de ecrã dizia "botão" sem dizer para onde
			 * voltava. O componente partilhado tem o `MIN_TAP` garantido e o
			 * `accessibilityLabel="Voltar"`, e é o que o `AGENTS.md`obriga.
			 */}
			<View className="mr-3">
				<BackButton onPress={onBack} />
			</View>
			<View className="flex-1">
				<Text
					className="font-sansMedium text-body-xs"
					style={{ color: themeColors.secondary }}
				>
					Detalhe da viagem
				</Text>
				<Text
					className="font-sansExtraBold text-title-secondary -mt-0.5"
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
			hitSlop={2}
			className="w-10 h-10 rounded-full items-center justify-center"
			style={{ backgroundColor: themeColors.background }}
		>
			<Text
				className="font-sansExtraBold text-title-tertiary"
				style={{ color: themeColors.text }}
			>
				{label}
			</Text>
		</Pressable>
	);
}
