import React, { useCallback, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import BoleiaButton from '../../components/BoleiaButton';
import Eyebrow from '../../components/Eyebrow';
import TicketCard from '../../components/TicketCard';
import StickyCta from '../../components/StickyCta';
import LocalityPicker from '../../components/LocalityPicker';
import DatePicker from '../../components/DatePicker';
import TimePicker from '../../components/TimePicker';
import Perforation from '../../components/Perforation';
import { useSessionUserId } from '../../hooks/useSessionUser';
import { useDbStore } from '../../mock/db';
import { useFocusEffect } from '@react-navigation/native';
import {
	ApiVehicle,
	apiErrorMessage,
	createRide as createRideApi,
	listLocalities,
	listMyVehicles,
	listProvinces,
} from '../../lib/api';
import {
	createRide,
	estimateRoute,
	RideMode,
	RouteStopInput,
} from '../../mock/repos/rideRepo';
import { localityById } from '../../mock/locale';
import { fmtKz, formatKzInput, parseKzInput } from '../../mock/helpers';
import { toDateKey } from '../../utils/date';

const PRICE_SUGGEST = [12000, 15000, 18000, 22000];
const MAX_STOPS = 4;

// Resolve o id UUID da API a partir de (província, município) do mock —
// os nomes são os mesmos do seed (21 províncias / 306 municípios reais).
let provincesCache: { id: string; name: string }[] | null = null;
const localitiesCache = new Map<string, { id: string; name: string }[]>();

async function resolveApiLocalityId(
	province: string,
	municipality: string,
): Promise<string | null> {
	try {
		if (!provincesCache) {
			provincesCache = await listProvinces();
		}
		const prov = provincesCache.find((p) => p.name === province);
		if (!prov) return null;
		let locals = localitiesCache.get(prov.id);
		if (!locals) {
			locals = await listLocalities(prov.id);
			localitiesCache.set(prov.id, locals);
		}
		return locals.find((l) => l.name === municipality)?.id ?? null;
	} catch {
		return null;
	}
}

type StopDraft = {
	kind: 'locality' | 'free';
	localityId: string;
	name: string;
};

function ReviewRow({ label, value }: { label: string; value: string }) {
	const { themeColors } = useThemeColors();
	return (
		<View className="flex-row items-center justify-between py-1.5">
			<Text
				className="font-sans text-[13px]"
				style={{ color: themeColors.secondary }}
			>
				{label}
			</Text>
			<Text
				className="font-sansBold text-[13px] text-right ml-3"
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
	const driverId = useSessionUserId();
	const me = useDbStore((s) => s.db.users.find((u) => u.id === driverId));
	const mockVehicle = me?.vehicle;

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
	const maxSeats = selectedVehicle?.seats ?? mockVehicle?.seats ?? 4;

	const [mode, setMode] = useState<RideMode>('interprovincial');
	const [province, setProvince] = useState('');
	const [from, setFrom] = useState('');
	const [to, setTo] = useState('');
	const [date, setDate] = useState('');
	const [hour, setHour] = useState('06:00');
	const [arrivalOverride, setArrivalOverride] = useState<{
		date: string;
		time: string;
	} | null>(null);
	const [arrivalEditorOpen, setArrivalEditorOpen] = useState(false);
	const [priceStr, setPriceStr] = useState('15 000');
	const [seats, setSeats] = useState(() => maxSeats);
	const [stops, setStops] = useState<StopDraft[]>([]);
	const [published, setPublished] = useState<string | null>(null);

	const changeMode = (m: RideMode) => {
		if (m === mode) return;
		setMode(m);
		setProvince('');
		setFrom('');
		setTo('');
	};

	const addStop = () =>
		setStops((prev) =>
			prev.length < MAX_STOPS
				? [...prev, { kind: 'locality', localityId: '', name: '' }]
				: prev,
		);

	const updateStop = (i: number, s: StopDraft) =>
		setStops((prev) => prev.map((p, j) => (j === i ? s : p)));

	const removeStop = (i: number) =>
		setStops((prev) => prev.filter((_, j) => j !== i));

	const stopsInput: RouteStopInput[] = stops
		.map((s) => ({
			localityId:
				s.kind === 'locality' && s.localityId
					? s.localityId
					: undefined,
			name: s.kind === 'free' ? s.name.trim() : '',
		}))
		.filter(
			(s) =>
				(s.localityId && localityById(s.localityId).name) ||
				s.name.length > 0,
		);

	const price = parseKzInput(priceStr);
	const fromLoc = from ? localityById(from) : null;
	const toLoc = to ? localityById(to) : null;
	const derived: RideMode | null =
		fromLoc && toLoc
			? fromLoc.province === toLoc.province
				? 'intermunicipal'
				: 'interprovincial'
			: null;

	const previewISO = date
		? `${date}T${hour}:00`
		: `${toDateKey(new Date())}T${hour}:00`;
	const route =
		from && to && derived
			? estimateRoute({
					originLocalityId: from,
					destinationLocalityId: to,
					departureISO: new Date(previewISO).toISOString(),
					stops: stopsInput,
				})
			: null;

	const departureDate = date && hour ? new Date(`${date}T${hour}:00`) : null;

	const autoArrival =
		route && departureDate
			? new Date(
					departureDate.getTime() + route.distanceKm * 1.22 * 60000,
				)
			: null;

	const arrival =
		arrivalOverride && date
			? new Date(`${arrivalOverride.date}T${arrivalOverride.time}:00`)
			: autoArrival;

	const arrivalAfterDeparture =
		!departureDate ||
		!arrival ||
		arrival.getTime() > departureDate.getTime();

	const overrideActive =
		!!arrivalOverride &&
		!!autoArrival &&
		!!arrival &&
		Math.abs(arrival.getTime() - autoArrival.getTime()) >= 60000;

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
		if (!canPublish || !from || !to || publishing) return;
		setPublishing(true);
		setPublishError(null);
		const dep = new Date(`${date}T${hour}:00`);
		const arrivalISO = arrival ? arrival.toISOString() : undefined;
		try {
			// 1) Publicar na API real (gates de KYC/viatura no servidor).
			if (vehicleId && fromLoc && toLoc) {
				const originId = await resolveApiLocalityId(
					fromLoc.province,
					fromLoc.municipality,
				);
				const destId = await resolveApiLocalityId(
					toLoc.province,
					toLoc.municipality,
				);
				if (originId && destId) {
					await createRideApi({
						vehicleId,
						originLocalityId: originId,
						destinationLocalityId: destId,
						departureAt: dep.toISOString(),
						arrivalAt:
							arrivalISO ??
							new Date(
								dep.getTime() + 4 * 60 * 60000,
							).toISOString(),
						pricePerSeat: price,
						seatsTotal: seats,
					});
				}
			}
		} catch (error) {
			setPublishing(false);
			setPublishError(
				apiErrorMessage(error, 'Não foi possível publicar.'),
			);
			return;
		}
		// 2) Espelho no mock para o demo continuar a listar a viagem.
		const ride = createRide({
			driverId,
			originLocalityId: from,
			destinationLocalityId: to,
			departureISO: dep.toISOString(),
			arrivalISO,
			seatsTotal: seats,
			pricePerSeat: price,
			stops: stopsInput,
		});
		setPublishing(false);
		setPublished(ride.id);
		setTimeout(() => {
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
		mode: RideMode;
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
				className="font-sansMedium text-[12px]"
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
			>
				{/* Cabeçalho do assistente */}
				<View className="flex-row items-center pt-1">
					<Pressable
						onPress={() => navigation.goBack()}
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
					<View className="flex-1">
						<Eyebrow>
							Passo {step + 1} de {STEPS.length} · Nova viagem
						</Eyebrow>
						<Text
							className="font-display text-[22px] leading-6 mt-1"
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
												? themeColors.laterite
												: themeColors.border,
								}}
							/>
						))}
					</View>
				) : null}
				<Text
					className="font-mono text-[9px] uppercase tracking-[2px] mt-3"
					style={{ color: themeColors.secondary }}
				>
					{me ? `${me.firstName} ${me.lastName}` : 'Motorista'}
					{selectedVehicle
						? ` · ${selectedVehicle.make} ${selectedVehicle.model} · lotação ${maxSeats}`
						: mockVehicle
							? ` · ${mockVehicle.make} ${mockVehicle.model} · lotação ${maxSeats}`
							: ''}
				</Text>

				{/* Bilhete — conteúdo por passo */}
				{!published && step <= 1 ? (
					<View
						className="rounded-3xl border overflow-hidden mt-4"
						style={{
							borderColor: themeColors.laterite,
							backgroundColor: themeColors.card,
						}}
					>
						{step === 0 ? (
							<>
								<View className="px-4 pt-4">
									<View className="flex-row items-center justify-between">
										<Text
											className="font-display text-[19px]"
											style={{ color: themeColors.text }}
										>
											A tua rota
										</Text>
										<Ionicons
											name="navigate-outline"
											size={20}
											color={themeColors.laterite}
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
														className="font-sansMedium text-[12px] ml-1.5"
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
												scope="province"
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
										scope="municipality"
										label="De onde sais"
										dotColor={themeColors.primary}
										value={from}
										onChange={setFrom}
										exclude={to}
										filter={
											mode === 'intermunicipal'
												? (l) => l.province === province
												: undefined
										}
									/>
									{connector}
									<LocalityPicker
										variant="row"
										scope="municipality"
										label="Para onde vais"
										dotColor={themeColors.laterite}
										value={to}
										onChange={setTo}
										exclude={from}
										filter={
											mode === 'intermunicipal'
												? (l) => l.province === province
												: undefined
										}
									/>
								</View>

								{derived && derived !== mode ? (
									<View className="px-4 pt-2">
										<Text
											className="font-sans text-[12px]"
											style={{
												color: themeColors.laterite,
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
										className="font-display text-[19px]"
										style={{ color: themeColors.text }}
									>
										Dia e hora
									</Text>
									<Text
										className="font-sans text-[12px] mt-0.5 mb-3"
										style={{ color: themeColors.secondary }}
									>
										Escolhe o dia de partida e a hora. A
										chegada é calculada sozinha.
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
								{arrival ? (
									<View className="px-4 pb-2">
										<Pressable
											onPress={openArrivalEditor}
											className="flex-row items-center rounded-2xl px-3.5 py-2.5"
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
												color={themeColors.mato}
											/>
											<Text
												className="font-mono text-[9px] uppercase tracking-[2px] ml-2"
												style={{
													color: themeColors.secondary,
												}}
											>
												Chegada prevista
											</Text>
											<Text
												className="flex-1 font-sansBold text-[13px] text-right"
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
															themeColors.laterite
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
												className="font-sans text-[11px] mt-1.5"
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
										className="font-display text-[19px]"
										style={{ color: themeColors.text }}
									>
										Preço e lugares
									</Text>
									<Text
										className="font-sans text-[12px] mt-0.5 mb-3"
										style={{ color: themeColors.secondary }}
									>
										Quanto custa cada lugar e quantos
										lugares levas.
									</Text>
								</View>
								<View className="px-4">
									<Text
										className="font-mono text-[9px] uppercase tracking-[2px] mb-1.5"
										style={{ color: themeColors.secondary }}
									>
										Preço por lugar
									</Text>
									<View
										className="flex-row items-center rounded-2xl px-4 mb-3"
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
											className="flex-1 py-3.5 font-mono text-[22px]"
											style={{ color: themeColors.text }}
										/>
										<Text
											className="font-mono text-[13px] uppercase tracking-wider"
											style={{
												color: themeColors.laterite,
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
										className="font-mono text-[9px] uppercase tracking-[2px] mb-1.5"
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
												className="w-10 h-10 rounded-full items-center justify-center"
												style={{
													backgroundColor:
														themeColors.background,
												}}
											>
												<Text
													className="font-display text-[18px]"
													style={{
														color: themeColors.text,
													}}
												>
													−
												</Text>
											</Pressable>
										) : null}
										<Text
											className="font-display text-[28px] mx-6"
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
												className="w-10 h-10 rounded-full items-center justify-center"
												style={{
													backgroundColor:
														themeColors.background,
												}}
											>
												<Text
													className="font-display text-[18px]"
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
						className="rounded-3xl mt-4 px-4 py-4"
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
							className="font-display text-[17px]"
							style={{ color: themeColors.text }}
						>
							Viatura da viagem
						</Text>
						<Text
							className="font-sans text-[12px] mt-0.5 mb-3"
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
									className="flex-row items-center rounded-2xl border px-3.5 py-3 mb-2"
									style={{
										borderColor: active
											? themeColors.mato
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
												? themeColors.mato
												: themeColors.border
										}
									/>
									<View className="flex-1 ml-3">
										<Text
											className="font-sansBold text-[14px]"
											style={{
												color: themeColors.text,
											}}
										>
											{v.make} {v.model} · {v.plate}
										</Text>
										<Text
											className="font-sans text-[12px]"
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
						className="rounded-3xl mt-4 px-4 py-4"
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
							className="font-sans text-[13px] leading-5"
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
						className="rounded-3xl mt-4 px-4 py-4"
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
							className="font-display text-[17px]"
							style={{ color: themeColors.text }}
						>
							Paragens intermédias
						</Text>
						<Text
							className="font-sans text-[12px] mt-0.5 mb-3"
							style={{ color: themeColors.secondary }}
						>
							Municípios ou pontos no caminho — opcional.
						</Text>

						{stops.length === 0 ? (
							<View
								className="rounded-2xl border border-dashed p-4 mb-3 items-center"
								style={{ borderColor: themeColors.secondary }}
							>
								<Text
									className="font-mono text-[11px] uppercase tracking-[2px]"
									style={{ color: themeColors.border }}
								>
									Sem paragens
								</Text>
							</View>
						) : (
							stops.map((s, i) => (
								<View
									key={`stop-${i}`}
									className="rounded-2xl p-3 mb-3"
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
															className="font-sansMedium text-[11px]"
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
												className="flex-1 py-3 font-sans text-[14px]"
												style={{
													color: themeColors.text,
												}}
											/>
										</View>
									)}
								</View>
							))
						)}

						{stops.length < MAX_STOPS ? (
							<Pressable
								onPress={addStop}
								className="rounded-2xl border border-dashed py-3.5 flex-row items-center justify-center"
								style={({ pressed }) => ({
									borderColor: themeColors.secondary,
									backgroundColor: themeColors.card,
									opacity: pressed ? 0.8 : 1,
								})}
							>
								<Ionicons
									name="add"
									size={17}
									color={themeColors.laterite}
								/>
								<Text
									className="font-sansMedium text-[13px] ml-1.5"
									style={{ color: themeColors.laterite }}
								>
									Adicionar paragem
								</Text>
							</Pressable>
						) : null}
					</View>
				) : null}

				{!published && step === 2 ? (
					<View className="mt-4">
						<TicketCard accent="laterite">
							<Text
								className="font-display text-[19px]"
								style={{ color: themeColors.text }}
							>
								Rever viagem
							</Text>
							<Text
								className="font-sans text-[12px] mt-0.5 mb-3"
								style={{ color: themeColors.secondary }}
							>
								Confere o bilhete antes de ir à estrada.
							</Text>
							<ReviewRow
								label="Rota"
								value={
									fromLoc && toLoc
										? `${fromLoc.municipality} → ${toLoc.municipality}`
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
							<Perforation tight />
							<Text
								className="font-sans text-[12px] leading-5"
								style={{ color: themeColors.secondary }}
							>
								Ao publicar, a viagem aparece na montra Explorar
								para os passageiros.
							</Text>
						</TicketCard>
					</View>
				) : null}

				{published ? (
					<View className="mt-6">
						<TicketCard accent="mato">
							<Text
								className="font-sansBold text-[15px]"
								style={{ color: themeColors.mato }}
							>
								Viagem publicada ✓
							</Text>
							<Text
								className="font-mono text-[12px] mt-1"
								style={{ color: themeColors.secondary }}
							>
								{new Date(
									`${date}T${hour}:00`,
								).toLocaleDateString('pt-PT', {
									weekday: 'long',
									day: 'numeric',
									month: 'long',
								})}{' '}
								às {hour} · {seats} lugares · {fmtKz(price)}
							</Text>
						</TicketCard>
					</View>
				) : null}

				{publishError ? (
					<Text
						className="font-sans text-[12px] mt-3"
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
									className="font-sansBold text-[13px] uppercase tracking-wider"
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
									className="font-sansBold text-[13px] uppercase tracking-wider"
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
									className="font-display text-[18px]"
									style={{ color: themeColors.text }}
								>
									Chegada prevista
								</Text>
								<Pressable
									onPress={() => setArrivalEditorOpen(false)}
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
								className="font-sans text-[12px] mb-2"
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
									className="font-sans text-[12px] mt-1"
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
