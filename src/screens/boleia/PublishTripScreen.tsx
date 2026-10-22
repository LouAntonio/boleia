import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	View,
	Text,
	ScrollView,
	TextInput,
	Pressable,
	Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import BackButton from '../../components/BackButton';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import BoleiaButton from '../../components/BoleiaButton';
import GroupLabel from '../../components/GroupLabel';

import Card from '../../components/Card';
import StickyCta from '../../components/StickyCta';
import LocalityPicker from '../../components/LocalityPicker';
import DatePicker from '../../components/DatePicker';
import TimePicker from '../../components/TimePicker';
import { useSessionUser } from '../../hooks/useSessionUser';
import { useFocusEffect } from '@react-navigation/native';
import {
	ApiVehicle,
	apiErrorMessage,
	createRide as createRideApi,
	listMyVehicles,
	type CreateRideStopInput,
} from '../../lib/api';
import { MUNICIPALITY_BY_CODE } from '../../lib/locations';
import type { SearchMode } from '../../lib/recentSearches';
import {
	fmtDuration,
	fmtKz,
	formatKzInput,
	parseKzInput,
} from '../../lib/format';
import { useQueryClient } from '@tanstack/react-query';
import { qk } from '../../lib/queryKeys';
import { toDateKey } from '../../utils/date';

const PRICE_SUGGEST = [12000, 15000, 18000, 22000];
/**
 * Tecto técnico de paragens intermédias — igual ao do backend (50).
 *
 * **Não é um limite de produto, e não aparece na UI.** Não há contador
 * "restam X paragens" nem um número para o motorista escolher: quem publica
 * adiciona paragens até ao percurso que quer fazer. O tecto existe para que
 * um motorista distraído não consiga submeter 200 paragens por acidente —
 * nem nenhum, nem mil. Se um dia a rota precisar de mais que 50, o backend
 * muda primeiro e este número acompanha.
 */
const MAX_STOPS = 50;

type StopDraft = {
	kind: 'locality' | 'free';
	localityId: string;
	name: string;
	/** Hora local `HH:MM`; vazia deixa o backend estimar. */
	time: string;
};

function ReviewRow({ label, value }: { label: string; value: string }) {
	const { themeColors } = useThemeColors();
	return (
		<View className="flex-row items-center justify-between py-1.5">
			<Text
				className="font-sans text-body-small"
				style={{ color: themeColors.secondary }}
			>
				{label}
			</Text>
			<Text
				className="font-sansBold text-body-small text-right ml-3"
				style={{ color: themeColors.text }}
			>
				{value}
			</Text>
		</View>
	);
}

export default function PublishTripScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'PublishTrip'>
		>();
	const { themeColors } = useThemeColors();
	const queryClient = useQueryClient();
	// Timer da navegação de sucesso, limpo no unmount.
	const navigateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	useEffect(
		() => () => {
			if (navigateTimer.current) clearTimeout(navigateTimer.current);
		},
		[],
	);
	// O nome vem da sessão real, que o backend devolveu no login.
	const sessionUser = useSessionUser();
	const driverName =
		[sessionUser?.name, sessionUser?.surname].filter(Boolean).join(' ') ||
		undefined;

	// Viaturas reais verificadas (gate server-side exige >=1).
	const [apiVehicles, setApiVehicles] = useState<ApiVehicle[]>([]);
	const [vehicleId, setVehicleId] = useState<string | null>(null);
	const [publishing, setPublishing] = useState(false);
	const [publishError, setPublishError] = useState<string | null>(null);

	useFocusEffect(
		useCallback(() => {
			let alive = true;
			listMyVehicles()
				.then((list) => {
					if (!alive) return;
					const verified = list.filter(
						(v) => v.status === 'VERIFIED',
					);
					setApiVehicles(verified);
					setVehicleId((prev) => prev ?? verified[0]?.id ?? null);
				})
				.catch(() => undefined);
			return () => {
				alive = false;
			};
		}, []),
	);

	const selectedVehicle = apiVehicles.find((v) => v.id === vehicleId);
	// O teto de lugares vem da lotação real da viatura. O valor de recurso só
	// entra se a lista ainda não carregou, para o formulário não ficar sem
	// limite antes de a resposta chegar.
	const maxSeats = selectedVehicle?.seats ?? 4;

	const [mode, setMode] = useState<SearchMode>('interprovincial');
	const [province, setProvince] = useState('');
	const [from, setFrom] = useState('');
	const [to, setTo] = useState('');
	const [date, setDate] = useState('');
	const [hour, setHour] = useState('06:00');
	/**
	 * Duração estimada, em minutos.
	 *
	 * É a fonte da hora de chegada. Antes, sem um override, o formulário
	 * enviava `partida + 4 minutos` para satisfazer o backend, e todas as
	 * viagens publicadas no telemóvel apareciam com quatro minutos.
	 */
	const [durationMin, setDurationMin] = useState(240);
	const [arrivalOverride, setArrivalOverride] = useState<{
		date: string;
		time: string;
	} | null>(null);
	const [arrivalEditorOpen, setArrivalEditorOpen] = useState(false);
	const [priceStr, setPriceStr] = useState('15 000');
	const [seats, setSeats] = useState(() => maxSeats);
	const [stops, setStops] = useState<StopDraft[]>([]);
	const [published, setPublished] = useState<string | null>(null);

	const changeMode = (m: SearchMode) => {
		if (m === mode) return;
		setMode(m);
		setProvince('');
		setFrom('');
		setTo('');
	};

	const addStop = () =>
		setStops((prev) =>
			prev.length < MAX_STOPS
				? [
						...prev,
						{
							kind: 'locality',
							localityId: '',
							name: '',
							time: '',
						},
					]
				: prev,
		);

	const updateStop = (i: number, s: StopDraft) =>
		setStops((prev) => prev.map((p, j) => (j === i ? s : p)));

	const removeStop = (i: number) =>
		setStops((prev) => prev.filter((_, j) => j !== i));

	/**
	 * Municípios escolhidos, para o resumo e para validar as paragens.
	 *
	 * O `LocalityPicker` devolve o **código** (`huambo.catabola`), e é isso que
	 * vai para o backend em `originLocalityId`/`destinationLocalityId`. A lista
	 * é local: já não há um pedido para traduzir código em nome.
	 */
	const localityByCode = useCallback(
		(code: string) => MUNICIPALITY_BY_CODE.get(code),
		[],
	);

	const stopsInput: CreateRideStopInput[] = stops
		.map((s) => ({
			localityId:
				s.kind === 'locality' && s.localityId
					? s.localityId
					: undefined,
			name: s.kind === 'free' ? s.name.trim() : '',
			// O backend lê a hora como hora local de Angola. Sem hora, estima
			// entre a partida e a chegada.
			time: s.time && date ? `${date}T${s.time}` : undefined,
		}))
		.filter(
			(s) =>
				(s.localityId && localityByCode(s.localityId)) ||
				s.name.length > 0,
		);

	const price = parseKzInput(priceStr);
	// O tipo de viagem é deduzido das províncias reais das localidades escolhidas.
	const fromLoc = from ? localityByCode(from) : null;
	const toLoc = to ? localityByCode(to) : null;
	const derived: SearchMode | null =
		fromLoc && toLoc
			? fromLoc.province.code === toLoc.province.code
				? 'intermunicipal'
				: 'interprovincial'
			: null;

	const departureDate = date && hour ? new Date(`${date}T${hour}:00`) : null;

	/**
	 * Hora de chegada.
	 *
	 * A duração é sempre conhecida, por isso a chegada também é. O motorista
	 * pode ajustá-la no editor, mas o valor por omissão já é uma previsão real
	 * em vez de um `+4 minutos` para o backend aceitar o payload.
	 */
	const computedArrival = departureDate
		? new Date(departureDate.getTime() + durationMin * 60000)
		: null;
	const arrival =
		arrivalOverride && date
			? new Date(`${arrivalOverride.date}T${arrivalOverride.time}:00`)
			: computedArrival;

	const arrivalAfterDeparture =
		!departureDate ||
		!arrival ||
		arrival.getTime() > departureDate.getTime();

	const overrideActive = !!arrivalOverride;

	const changeDuration = (delta: number) =>
		setDurationMin((previous) =>
			Math.min(24 * 60, Math.max(30, previous + delta)),
		);

	const openArrivalEditor = () => {
		if (!arrival) return;
		setArrivalEditorOpen(true);
	};

	const canPublish =
		!!from &&
		!!to &&
		from !== to &&
		!!date &&
		derived === mode &&
		arrivalAfterDeparture &&
		price >= 1000 &&
		seats >= 1 &&
		seats <= maxSeats;

	// Assistente em 3 passos — só UI; publish(), validações e payload iguais.
	const [step, setStep] = useState(0);
	const STEPS = ['Rota e dia', 'Preço e viatura', 'Rever'];
	const stepOk =
		step === 0
			? !!from &&
				!!to &&
				from !== to &&
				derived === mode &&
				!!date &&
				arrivalAfterDeparture
			: step === 1
				? price >= 1000 && seats >= 1 && seats <= maxSeats
				: true;

	const publish = async () => {
		if (!canPublish || !from || !to || !derived || publishing) return;
		if (!vehicleId) {
			setPublishError('Escolhe uma viatura para publicar.');
			return;
		}
		if (!arrival) {
			setPublishError('Define a duração da viagem.');
			return;
		}
		setPublishing(true);
		setPublishError(null);

		const departure = new Date(`${date}T${hour}:00`);

		try {
			const ride = await createRideApi({
				vehicleId,
				originLocalityId: from,
				destinationLocalityId: to,
				scope:
					derived === 'intermunicipal'
						? 'INTERMUNICIPAL'
						: 'INTERPROVINCIAL',
				departureAt: departure.toISOString(),
				arrivalAt: arrival.toISOString(),
				pricePerSeat: price,
				seatsTotal: seats,
				stops: stopsInput,
			});
			setPublished(ride.id);
		} catch (error) {
			setPublishing(false);
			setPublishError(
				apiErrorMessage(error, 'Não foi possível publicar.'),
			);
			return;
		}

		/*
		 * Invalidar a cache não é afinação. Com `staleTime: 5 min` e
		 * `refetchOnMount` por omissão, a query `myRides` do `TripsScreen`
		 * voltava com menos de cinco minutos e **não refazia o pedido**: o
		 * motorista publicava uma boleia, voltava e via "0 viagens". Tinha de
		 * esperar cinco minutos ou matar a app.
		 *
		 * `qk.rides.all` também, porque a corrida é agendada e passa a
		 * aparecer para os passageiros a procurarem.
		 */
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: qk.myRides.all }),
			queryClient.invalidateQueries({ queryKey: qk.rides.all }),
			queryClient.invalidateQueries({ queryKey: qk.eligibility }),
		]);

		setPublishing(false);
		// O timer vive num `ref` e é limpo no unmount: sem isso, quem carrega
		// no botão de voltar da barra durante a animação de sucesso fica com um
		// `goBack()` a disparar sobre um ecrã já desmontado.
		navigateTimer.current = setTimeout(() => {
			navigation.goBack();
		}, 1800);
	};

	const connector = (
		<View
			className="ml-[5px] h-3"
			style={{
				borderLeftWidth: 2,
				borderStyle: 'dashed',
				borderLeftColor: themeColors.border,
			}}
		/>
	);

	const modeOpts: {
		mode: SearchMode;
		label: string;
		icon: 'navigate' | 'map';
	}[] = [
		{ mode: 'intermunicipal', label: 'Intermunicipal', icon: 'navigate' },
		{ mode: 'interprovincial', label: 'Interprovincial', icon: 'map' },
	];

	const chip = (
		label: string,
		active: boolean,
		onPress: () => void,
		key: string,
	) => (
		<Pressable
			key={key}
			onPress={onPress}
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
					color: active ? themeColors.card : themeColors.secondary,
				}}
			>
				{label}
			</Text>
		</Pressable>
	);

	return (
		<SafeAreaView
			className="flex-1"
			style={{ backgroundColor: themeColors.background }}
		>
			<ScrollView
				key={step}
				className="flex-1 px-5"
				contentContainerStyle={{ paddingBottom: 48 }}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				{/* Cabeçalho do assistente */}
				<View className="flex-row items-center pt-1">
					<BackButton onPress={() => navigation.goBack()} />
					<View className="flex-1">
						<GroupLabel>
							Passo {step + 1} de {STEPS.length} · Nova viagem
						</GroupLabel>
						<Text
							className="font-sansExtraBold text-title-secondary leading-6 mt-1"
							style={{ color: themeColors.text }}
						>
							{published ? 'Viagem publicada' : STEPS[step]}
						</Text>
					</View>
				</View>
				{!published ? (
					<View className="flex-row items-center mt-3">
						{STEPS.map((s, i) => (
							<View
								key={s}
								className="h-1.5 rounded-full mr-1.5"
								style={{
									width: i === step ? 22 : 8,
									backgroundColor:
										i < step
											? themeColors.primary
											: i === step
												? themeColors.primary
												: themeColors.border,
								}}
							/>
						))}
					</View>
				) : null}
				<Text
					className="font-sansMedium text-body-xs mt-3"
					style={{ color: themeColors.secondary }}
				>
					{driverName ?? 'Motorista'}
					{selectedVehicle
						? ` · ${selectedVehicle.make} ${selectedVehicle.model} · lotação ${maxSeats}`
						: ''}
				</Text>

				{/* Conte — conteúdo por passo */}
				{!published && step <= 1 ? (
					<View
						className="rounded-xl border overflow-hidden mt-4"
						style={{
							borderColor: themeColors.border,
							backgroundColor: themeColors.card,
						}}
					>
						{step === 0 ? (
							<>
								<View className="px-4 pt-4">
									<View className="flex-row items-center justify-between">
										<Text
											className="font-sansExtraBold text-title-secondary"
											style={{ color: themeColors.text }}
										>
											A tua rota
										</Text>
										<Ionicons
											name="navigate-outline"
											size={20}
											color={themeColors.primary}
										/>
									</View>

									<View
										className="flex-row rounded-full p-1 mt-3"
										style={{
											backgroundColor:
												themeColors.background,
										}}
									>
										{modeOpts.map((opt) => {
											const active = mode === opt.mode;
											return (
												<Pressable
													key={opt.mode}
													onPress={() =>
														changeMode(opt.mode)
													}
													className="flex-1 rounded-full py-2 flex-row items-center justify-center"
													style={{
														backgroundColor: active
															? themeColors.text
															: 'transparent',
													}}
												>
													<Ionicons
														name={opt.icon}
														size={14}
														color={
															active
																? themeColors.card
																: themeColors.secondary
														}
													/>
													<Text
														className="font-sansMedium text-body-xs ml-1.5"
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
								</View>

								<View
									className="px-4 mt-2"
									style={{
										borderTopWidth: 1,
										borderTopColor: themeColors.border,
									}}
								>
									{mode === 'intermunicipal' ? (
										<>
											<LocalityPicker
												variant="row"
												label="Província"
												dotColor={themeColors.primary}
												value={province}
												onChange={(p) => {
													setProvince(p);
													setFrom('');
													setTo('');
												}}
											/>
											{connector}
										</>
									) : null}
									<LocalityPicker
										variant="row"
										label="De onde sais"
										dotColor={themeColors.primary}
										value={from}
										onChange={setFrom}
										exclude={to}
										restrictToProvince={
											mode === 'intermunicipal'
												? province
												: null
										}
									/>
									{connector}
									<LocalityPicker
										variant="row"
										label="Para onde vais"
										dotColor={themeColors.primary}
										value={to}
										onChange={setTo}
										exclude={from}
										restrictToProvince={
											mode === 'intermunicipal'
												? province
												: null
										}
									/>
								</View>

								{derived && derived !== mode ? (
									<View className="px-4 pt-2">
										<Text
											className="font-sans text-body-xs"
											style={{
												color: themeColors.secondary,
											}}
										>
											Rota{' '}
											{derived === 'intermunicipal'
												? 'intermunicipal'
												: 'interprovincial'}{' '}
											— escolhe origem e destino{' '}
											{derived === 'intermunicipal'
												? 'na mesma província'
												: 'em províncias diferentes'}{' '}
											ou muda o modo.
										</Text>
									</View>
								) : null}
							</>
						) : null}
						{step === 0 ? (
							<>
								<View className="px-4 pt-4">
									<Text
										className="font-sansExtraBold text-title-secondary"
										style={{ color: themeColors.text }}
									>
										Dia e hora
									</Text>
									<Text
										className="font-sans text-body-xs mt-0.5 mb-3"
										style={{ color: themeColors.secondary }}
									>
										Escolhe o dia, a hora e a duração. A
										chegada é calculada a partir daí.
									</Text>
								</View>
								<View className="px-4">
									<DatePicker
										value={date}
										onChange={setDate}
									/>
								</View>
								<View className="px-4">
									<TimePicker
										value={hour}
										onChange={setHour}
									/>
								</View>

								<View className="px-4 pt-3">
									<Text
										className="font-sansMedium text-body-xs"
										style={{
											color: themeColors.secondary,
										}}
									>
										Duração estimada
									</Text>
									<View
										className="flex-row items-center justify-between mt-2 rounded-xl border px-2 py-1"
										style={{
											borderColor: themeColors.border,
											backgroundColor:
												themeColors.background,
										}}
									>
										<Pressable
											onPress={() => changeDuration(-30)}
											disabled={durationMin <= 30}
											hitSlop={8}
											className="w-11 h-11 items-center justify-center"
											style={({ pressed }) => ({
												opacity:
													durationMin <= 30
														? 0.35
														: pressed
															? 0.6
															: 1,
											})}
										>
											<Ionicons
												name="remove"
												size={20}
												color={themeColors.text}
											/>
										</Pressable>
										<View className="items-center">
											<Text
												className="font-sansExtraBold text-title-tertiary"
												style={{
													color: themeColors.text,
												}}
											>
												{fmtDuration(durationMin)}
											</Text>
											<Text
												className="font-sans text-body-xs"
												style={{
													color: themeColors.secondary,
												}}
											>
												30 min a 24 h
											</Text>
										</View>
										<Pressable
											onPress={() => changeDuration(30)}
											disabled={durationMin >= 24 * 60}
											hitSlop={8}
											className="w-11 h-11 items-center justify-center"
											style={({ pressed }) => ({
												opacity:
													durationMin >= 24 * 60
														? 0.35
														: pressed
															? 0.6
															: 1,
											})}
										>
											<Ionicons
												name="add"
												size={20}
												color={themeColors.text}
											/>
										</Pressable>
									</View>
								</View>

								{arrival ? (
									<View className="px-4 pb-2">
										<Pressable
											onPress={openArrivalEditor}
											className="flex-row items-center rounded-xl px-3.5 py-2.5"
											style={({ pressed }) => ({
												borderColor: themeColors.border,
												backgroundColor:
													themeColors.background,
												opacity: pressed ? 0.85 : 1,
											})}
										>
											<Ionicons
												name="flag-outline"
												size={15}
												color={themeColors.success}
											/>
											<Text
												className="font-sansMedium text-body-xs ml-2"
												style={{
													color: themeColors.secondary,
												}}
											>
												Chegada prevista
											</Text>
											<Text
												className="flex-1 font-sansBold text-body-small text-right"
												style={{
													color: themeColors.text,
												}}
											>
												{arrival.toLocaleDateString(
													'pt-PT',
													{
														weekday: 'short',
														day: 'numeric',
														month: 'short',
													},
												)}{' '}
												·
												{arrival.toLocaleTimeString(
													'pt-PT',
													{
														hour: '2-digit',
														minute: '2-digit',
													},
												)}
											</Text>
											{overrideActive ? (
												<Pressable
													onPress={() =>
														setArrivalOverride(null)
													}
													hitSlop={8}
													className="w-7 h-7 rounded-full items-center justify-center ml-2"
													style={{
														backgroundColor:
															themeColors.card,
													}}
												>
													<Ionicons
														name="refresh"
														size={14}
														color={
															themeColors.primary
														}
													/>
												</Pressable>
											) : (
												<Ionicons
													name="chevron-forward"
													size={14}
													color={themeColors.border}
													style={{ marginLeft: 6 }}
												/>
											)}
										</Pressable>
										{!arrivalAfterDeparture ? (
											<Text
												className="font-sans text-body-xs mt-1.5"
												style={{
													color: themeColors.error,
												}}
											>
												A chegada não pode ser antes da
												partida.
											</Text>
										) : null}
									</View>
								) : null}
							</>
						) : null}
						{step === 1 ? (
							<>
								<View className="px-4 pt-4">
									<Text
										className="font-sansExtraBold text-title-secondary"
										style={{ color: themeColors.text }}
									>
										Preço e lugares
									</Text>
									<Text
										className="font-sans text-body-xs mt-0.5 mb-3"
										style={{ color: themeColors.secondary }}
									>
										Quanto custa cada lugar e quantos
										lugares levas.
									</Text>
								</View>
								<View className="px-4">
									<Text
										className="font-sansMedium text-body-xs mb-1.5"
										style={{ color: themeColors.secondary }}
									>
										Preço por lugar
									</Text>
									<View
										className="flex-row items-center rounded-xl px-4 mb-3"
										style={{
											borderColor: themeColors.border,
											backgroundColor:
												themeColors.background,
										}}
									>
										<TextInput
											value={priceStr}
											onChangeText={(t) =>
												setPriceStr(formatKzInput(t))
											}
											keyboardType="number-pad"
											placeholder="0"
											placeholderTextColor={
												themeColors.border
											}
											className="flex-1 py-3.5 font-sansMedium text-title-secondary"
											style={{ color: themeColors.text }}
										/>
										<Text
											className="font-sansMedium text-body-small"
											style={{
												color: themeColors.secondary,
											}}
										>
											Kz
										</Text>
									</View>
									<View className="flex-row flex-wrap">
										{PRICE_SUGGEST.map((p) =>
											chip(
												fmtKz(p),
												price === p,
												() =>
													setPriceStr(
														formatKzInput(
															String(p),
														),
													),
												String(p),
											),
										)}
									</View>
								</View>

								<View className="px-4 pt-1 pb-4">
									<Text
										className="font-sansMedium text-body-xs mb-1.5"
										style={{ color: themeColors.secondary }}
									>
										Lugares livres ({maxSeats} na viatura)
									</Text>
									<View className="flex-row items-center">
										{seats > 1 ? (
											<Pressable
												onPress={() =>
													setSeats((s) => s - 1)
												}
												hitSlop={2}
												className="w-10 h-10 rounded-full items-center justify-center"
												style={{
													backgroundColor:
														themeColors.background,
												}}
											>
												<Text
													className="font-sansExtraBold text-title-tertiary"
													style={{
														color: themeColors.text,
													}}
												>
													−
												</Text>
											</Pressable>
										) : null}
										<Text
											className="font-sansExtraBold text-title-primary mx-6"
											style={{ color: themeColors.text }}
										>
											{seats}
										</Text>
										{seats < maxSeats ? (
											<Pressable
												onPress={() =>
													setSeats((s) =>
														Math.min(
															maxSeats,
															s + 1,
														),
													)
												}
												hitSlop={2}
												className="w-10 h-10 rounded-full items-center justify-center"
												style={{
													backgroundColor:
														themeColors.background,
												}}
											>
												<Text
													className="font-sansExtraBold text-title-tertiary"
													style={{
														color: themeColors.text,
													}}
												>
													+
												</Text>
											</Pressable>
										) : null}
									</View>
								</View>
							</>
						) : null}
					</View>
				) : null}

				{/* Viatura verificada (obrigatória, escolha real) */}
				{!published && step === 1 && apiVehicles.length > 0 ? (
					<View
						className="rounded-xl mt-4 px-4 py-4"
						style={{
							backgroundColor: themeColors.card,
							shadowColor: '#000',
							shadowOpacity: 0.08,
							shadowOffset: { width: 0, height: 4 },
							shadowRadius: 12,
							elevation: 3,
						}}
					>
						<Text
							className="font-sansExtraBold text-label"
							style={{ color: themeColors.text }}
						>
							Viatura da viagem
						</Text>
						<Text
							className="font-sans text-body-xs mt-0.5 mb-3"
							style={{ color: themeColors.secondary }}
						>
							Só viaturas verificadas. Escolhe qual vai à estrada.
						</Text>
						{apiVehicles.map((v) => {
							const active = v.id === vehicleId;
							return (
								<Pressable
									key={v.id}
									onPress={() => setVehicleId(v.id)}
									className="flex-row items-center rounded-xl border px-3.5 py-3 mb-2"
									style={{
										borderColor: active
											? themeColors.success
											: 'transparent',
										borderWidth: active ? 1.5 : 0,
										backgroundColor: themeColors.background,
									}}
								>
									<Ionicons
										name={
											active
												? 'checkmark-circle'
												: 'ellipse-outline'
										}
										size={20}
										color={
											active
												? themeColors.success
												: themeColors.border
										}
									/>
									<View className="flex-1 ml-3">
										<Text
											className="font-sansBold text-body-small"
											style={{
												color: themeColors.text,
											}}
										>
											{v.make} {v.model} · {v.plate}
										</Text>
										<Text
											className="font-sans text-body-xs"
											style={{
												color: themeColors.secondary,
											}}
										>
											{v.color} · {v.seats} lugares
										</Text>
									</View>
								</Pressable>
							);
						})}
					</View>
				) : null}
				{!published && step === 1 && apiVehicles.length === 0 ? (
					<View
						className="rounded-xl mt-4 px-4 py-4"
						style={{
							backgroundColor: themeColors.card,
							shadowColor: '#000',
							shadowOpacity: 0.08,
							shadowOffset: { width: 0, height: 4 },
							shadowRadius: 12,
							elevation: 3,
						}}
					>
						<Text
							className="font-sans text-body-small leading-5"
							style={{ color: themeColors.secondary }}
						>
							A tua viatura verificada será associada à viagem
							automaticamente.
						</Text>
					</View>
				) : null}

				{/* Paragens intermédias */}
				{!published && step === 0 ? (
					<View
						className="rounded-xl mt-4 px-4 py-4"
						style={{
							backgroundColor: themeColors.card,
							shadowColor: '#000',
							shadowOpacity: 0.08,
							shadowOffset: { width: 0, height: 4 },
							shadowRadius: 12,
							elevation: 3,
						}}
					>
						<Text
							className="font-sansExtraBold text-label"
							style={{ color: themeColors.text }}
						>
							Paragens intermédias
						</Text>
						<Text
							className="font-sans text-body-xs mt-0.5 mb-3"
							style={{ color: themeColors.secondary }}
						>
							Municípios ou pontos no caminho — opcional. Podes
							indicar a hora de cada paragem.
						</Text>

						{stops.length === 0 ? (
							<View
								className="rounded-xl border border-dashed p-4 mb-3 items-center"
								style={{ borderColor: themeColors.secondary }}
							>
								<Text
									className="font-sansMedium text-body-xs"
									style={{ color: themeColors.border }}
								>
									Sem paragens
								</Text>
							</View>
						) : (
							stops.map((s, i) => (
								<View
									key={`stop-${i}`}
									className="rounded-xl p-3 mb-3"
									style={{
										borderColor: themeColors.border,
										backgroundColor: themeColors.background,
									}}
								>
									<View className="flex-row items-center justify-between mb-2">
										<View
											className="flex-row rounded-full p-0.5"
											style={{
												backgroundColor:
													themeColors.background,
											}}
										>
											{(
												[
													{
														kind: 'locality',
														label: 'Município',
													},
													{
														kind: 'free',
														label: 'Ponto',
													},
												] as const
											).map((opt) => {
												const active =
													s.kind === opt.kind;
												return (
													<Pressable
														key={opt.kind}
														onPress={() =>
															updateStop(i, {
																...s,
																kind: opt.kind,
																localityId:
																	opt.kind ===
																	'locality'
																		? s.localityId
																		: '',
																name:
																	opt.kind ===
																	'free'
																		? s.name
																		: '',
															})
														}
														className="rounded-full px-3 py-1"
														style={{
															backgroundColor:
																active
																	? themeColors.text
																	: 'transparent',
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
															{opt.label}
														</Text>
													</Pressable>
												);
											})}
										</View>
										<Pressable
											onPress={() => removeStop(i)}
											hitSlop={8}
										>
											<Ionicons
												name="close-circle"
												size={22}
												color={themeColors.border}
											/>
										</Pressable>
									</View>

									{s.kind === 'locality' ? (
										<LocalityPicker
											variant="row"
											label="Paragem"
											dotColor={themeColors.primary}
											value={s.localityId}
											onChange={(id) =>
												updateStop(i, {
													...s,
													kind: 'locality',
													localityId: id,
													name: '',
												})
											}
											exclude={from}
										/>
									) : (
										<View
											className="flex-row items-center rounded-xl px-3.5"
											style={{
												borderColor: themeColors.border,
												backgroundColor:
													themeColors.card,
											}}
										>
											<TextInput
												value={s.name}
												onChangeText={(t) =>
													updateStop(i, {
														...s,
														name: t,
													})
												}
												placeholder="Ex.: Rotunda do Camuxito"
												placeholderTextColor={
													themeColors.border
												}
												className="flex-1 py-3 font-sans text-body-small"
												style={{
													color: themeColors.text,
												}}
											/>
										</View>
									)}

									<View
										className="mt-1 border-t"
										style={{
											borderColor: themeColors.border,
										}}
									>
										<TimePicker
											label="Hora da paragem (opcional)"
											value={s.time}
											onChange={(t) =>
												updateStop(i, {
													...s,
													time: t,
												})
											}
										/>
									</View>
									{s.time ? (
										<Pressable
											onPress={() =>
												updateStop(i, {
													...s,
													time: '',
												})
											}
											hitSlop={8}
											className="self-start py-1"
										>
											<Text
												className="font-sansMedium text-body-xs"
												style={{
													color: themeColors.primary,
												}}
											>
												Limpar hora
											</Text>
										</Pressable>
									) : (
										<Text
											className="font-sans text-body-xs pb-1"
											style={{
												color: themeColors.secondary,
											}}
										>
											Sem hora, calculamos
											automaticamente.
										</Text>
									)}
								</View>
							))
						)}

						{stops.length < MAX_STOPS ? (
							<Pressable
								onPress={addStop}
								className="rounded-xl border border-dashed py-3.5 flex-row items-center justify-center"
								style={({ pressed }) => ({
									borderColor: themeColors.secondary,
									backgroundColor: themeColors.card,
									opacity: pressed ? 0.8 : 1,
								})}
							>
								<Ionicons
									name="add"
									size={17}
									color={themeColors.primary}
								/>
								<Text
									className="font-sansMedium text-body-small ml-1.5"
									style={{ color: themeColors.primary }}
								>
									Adicionar paragem
								</Text>
							</Pressable>
						) : null}
					</View>
				) : null}

				{!published && step === 2 ? (
					<View className="mt-4">
						<Card>
							<Text
								className="font-sansExtraBold text-title-secondary"
								style={{ color: themeColors.text }}
							>
								Rever viagem
							</Text>
							<Text
								className="font-sans text-body-xs mt-0.5 mb-3"
								style={{ color: themeColors.secondary }}
							>
								Confere os detalhes antes de publicar.
							</Text>
							<ReviewRow
								label="Rota"
								value={
									fromLoc && toLoc
										? mode === 'interprovincial'
											? `${fromLoc.province.name} → ${toLoc.province.name}`
											: `${fromLoc.name} → ${toLoc.name}`
										: '—'
								}
							/>
							<ReviewRow
								label="Partida"
								value={
									date
										? `${new Date(
												`${date}T${hour}:00`,
											).toLocaleDateString('pt-PT', {
												weekday: 'short',
												day: 'numeric',
												month: 'short',
											})} · ${hour}`
										: '—'
								}
							/>
							<ReviewRow
								label="Chegada"
								value={
									arrival
										? `${arrival.toLocaleDateString(
												'pt-PT',
												{
													weekday: 'short',
													day: 'numeric',
													month: 'short',
												},
											)} · ${arrival.toLocaleTimeString(
												'pt-PT',
												{
													hour: '2-digit',
													minute: '2-digit',
												},
											)}${overrideActive ? ' · ajustada' : ''}`
										: '—'
								}
							/>
							<ReviewRow
								label="Duração"
								value={fmtDuration(durationMin)}
							/>
							<ReviewRow
								label="Preço"
								value={`${fmtKz(price)} / lugar`}
							/>
							<ReviewRow label="Lugares" value={String(seats)} />
							<ReviewRow
								label="Viatura"
								value={
									selectedVehicle
										? `${selectedVehicle.make} ${selectedVehicle.model} · ${selectedVehicle.plate}`
										: 'A associar'
								}
							/>
							<ReviewRow
								label="Paragens"
								value={
									stopsInput.length === 0
										? 'Direta'
										: String(stopsInput.length)
								}
							/>
							<View
								className="my-3 border-t"
								style={{ borderColor: themeColors.border }}
							/>
							<Text
								className="font-sans text-body-xs leading-5"
								style={{ color: themeColors.secondary }}
							>
								Ao publicar, a viagem aparece na montra Explorar
								para os passageiros.
							</Text>
						</Card>
					</View>
				) : null}

				{published ? (
					<View className="mt-6">
						<Card tone="success">
							<Text
								className="font-sansBold text-label-small"
								style={{ color: themeColors.success }}
							>
								Viagem publicada ✓
							</Text>
							<Text
								className="font-sansMedium text-body-xs mt-1"
								style={{ color: themeColors.secondary }}
							>
								{new Date(
									`${date}T${hour}:00`,
								).toLocaleDateString('pt-PT', {
									weekday: 'long',
									day: 'numeric',
									month: 'long',
								})}{' '}
								às {hour} · {fmtDuration(durationMin)} · {seats}{' '}
								lugares · {fmtKz(price)}
							</Text>
						</Card>
					</View>
				) : null}

				{publishError ? (
					<Text
						className="font-sans text-body-xs mt-3"
						style={{ color: themeColors.error }}
					>
						{publishError}
					</Text>
				) : null}
			</ScrollView>

			{!published ? (
				<StickyCta>
					<View className="flex-row items-center">
						{step > 0 ? (
							<Pressable
								onPress={() => setStep((s) => s - 1)}
								className="py-2.5 pr-2"
							>
								<Text
									className="font-sansBold text-body-small"
									style={{ color: themeColors.card }}
								>
									Voltar
								</Text>
							</Pressable>
						) : (
							<Pressable
								onPress={() => navigation.goBack()}
								className="py-2.5 pr-2"
							>
								<Text
									className="font-sansBold text-body-small"
									style={{ color: themeColors.card }}
								>
									Sair
								</Text>
							</Pressable>
						)}
						<View className="flex-1 ml-2">
							{step < STEPS.length - 1 ? (
								<BoleiaButton
									title="Continuar"
									small
									disabled={!stepOk}
									onPress={() => setStep((s) => s + 1)}
								/>
							) : (
								<BoleiaButton
									title="Publicar viagem"
									small
									loading={publishing}
									disabled={!canPublish}
									onPress={publish}
								/>
							)}
						</View>
					</View>
				</StickyCta>
			) : null}

			{arrival ? (
				<Modal
					visible={arrivalEditorOpen}
					transparent
					animationType="slide"
					onRequestClose={() => setArrivalEditorOpen(false)}
				>
					<Pressable
						className="flex-1 justify-end"
						style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
						onPress={() => setArrivalEditorOpen(false)}
					>
						<Pressable
							className="rounded-t-3xl px-5 pt-3 pb-6"
							style={{
								backgroundColor: themeColors.card,
							}}
							onPress={(e) => e.stopPropagation()}
						>
							<View className="items-center mb-3">
								<View
									className="w-10 h-1 rounded-full"
									style={{
										backgroundColor: themeColors.border,
									}}
								/>
							</View>

							<View className="flex-row items-center justify-between mb-1">
								<Text
									className="font-sansExtraBold text-title-tertiary"
									style={{ color: themeColors.text }}
								>
									Chegada prevista
								</Text>
								<Pressable
									onPress={() => setArrivalEditorOpen(false)}
									hitSlop={6}
									className="w-8 h-8 rounded-full items-center justify-center"
									style={{
										backgroundColor: themeColors.background,
									}}
								>
									<Ionicons
										name="close"
										size={18}
										color={themeColors.secondary}
									/>
								</Pressable>
							</View>
							<Text
								className="font-sans text-body-xs mb-2"
								style={{ color: themeColors.secondary }}
							>
								O cálculo automático fica pré-preenchido —
								altera a data e a hora se quiseres.
							</Text>

							<DatePicker
								label="Dia de chegada"
								value={toDateKey(arrival)}
								onChange={(d) => {
									if (!d) return;
									setArrivalOverride({
										date: d,
										time: `${String(
											arrival.getHours(),
										).padStart(2, '0')}:${String(
											arrival.getMinutes(),
										).padStart(2, '0')}`,
									});
								}}
							/>
							<TimePicker
								label="Hora de chegada"
								value={`${String(arrival.getHours()).padStart(
									2,
									'0',
								)}:${String(arrival.getMinutes()).padStart(2, '0')}`}
								onChange={(t) => {
									setArrivalOverride({
										date: toDateKey(arrival),
										time: t,
									});
								}}
							/>

							{!arrivalAfterDeparture ? (
								<Text
									className="font-sans text-body-xs mt-1"
									style={{ color: themeColors.error }}
								>
									A chegada não pode ser antes da partida.
								</Text>
							) : null}

							<View
								className="flex-row items-center mt-4 pt-4 border-t"
								style={{ borderColor: themeColors.border }}
							>
								<BoleiaButton
									title="Restaurar"
									variant="ghost"
									small
									onPress={() => setArrivalOverride(null)}
								/>
								<View className="flex-1 ml-2">
									<BoleiaButton
										title="Concluído"
										small
										onPress={() =>
											setArrivalEditorOpen(false)
										}
									/>
								</View>
							</View>
						</Pressable>
					</Pressable>
				</Modal>
			) : null}
		</SafeAreaView>
	);
}
