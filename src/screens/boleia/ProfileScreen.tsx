import React, { useCallback, useMemo, useState } from 'react';
import {
	View,
	Text,
	Pressable,
	ScrollView,
	Alert,
	TextInput,
	ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { qk } from '../../lib/queryKeys';
import { useThemeColors } from '../../hooks/useThemeColors';
import { onBand } from '../../store/colors';
import {
	useSessionUser,
	useSessionUserId,
	useSessionInitials,
} from '../../hooks/useSessionUser';
import { useAppStore } from '../../store/appStore';
import { useThemeStore, ThemeMode } from '../../store/themeStore';
import { useQuery } from '@tanstack/react-query';
import { listMyBookings, listMyRides } from '../../lib/api';
import { toBooking, toRide } from '../../lib/rideMapper';
import { fmtKz } from '../../lib/format';
import { MONTHS_PT } from '../../utils/date';
import { maskPhone } from '../../utils/phone';
import { statusMeta, StatusTone } from '../../utils/status';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import SectionTitle from '../../components/SectionTitle';
import { Ionicons } from '@expo/vector-icons';
import { navigationRef } from '../../lib/navigationRef';
import { authClient } from '../../lib/auth-client';
import {
	apiErrorMessage,
	getEmergencyContact,
	saveEmergencyContact,
} from '../../lib/api';
import { Eligibility, fetchEligibility } from '../../lib/eligibility';
import BoleiaButton from '../../components/BoleiaButton';

const THEMES: { mode: ThemeMode; label: string }[] = [
	{ mode: 'light', label: 'Claro' },
	{ mode: 'dark', label: 'Escuro' },
	{ mode: 'system', label: 'Sistema' },
];

function PanelStat({
	value,
	label,
	first,
}: {
	value: string;
	label: string;
	first?: boolean;
}) {
	const { themeColors } = useThemeColors();
	return (
		<View
			className="flex-1 items-center"
			style={
				first
					? undefined
					: {
							borderLeftWidth: 1,
							borderLeftColor: themeColors.border,
						}
			}
		>
			<Text
				className="font-sansMedium text-body-small"
				style={{ color: themeColors.text }}
			>
				{value}
			</Text>
			<Text
				className="font-sansMedium text-body-xs mt-1"
				style={{ color: themeColors.secondary }}
			>
				{label}
			</Text>
		</View>
	);
}

const STAMP_TONE: Record<StatusTone, string> = {
	pending: 'laterite',
	active: 'primary',
	done: 'success',
	failed: 'error',
	neutral: 'secondary',
};

function VerificationStamp({ status }: { status: string }) {
	const { themeColors } = useThemeColors();
	const meta = statusMeta(status);
	const tint = themeColors[STAMP_TONE[meta.tone] as keyof typeof themeColors];
	return (
		<View
			className="flex-row items-center self-start rounded-full px-2.5 py-1 border"
			style={{ borderColor: `${tint}66` }}
		>
			<View
				className="w-[7px] h-[7px] rounded-full mr-1.5"
				style={{ backgroundColor: tint }}
			/>
			<Text
				className="font-sansMedium text-body-xs"
				style={{ color: themeColors.secondary }}
			>
				{meta.label}
			</Text>
		</View>
	);
}

function RolePanel({
	active,
	band,
	icon,
	title,
	subtitle,
	stats,
	onActivate,
	children,
	delay,
}: {
	active: boolean;
	band: string;
	icon: keyof typeof Ionicons.glyphMap;
	title: string;
	subtitle: string;
	stats: { value: string; label: string }[];
	onActivate: () => void;
	children: React.ReactNode;
	delay: number;
}) {
	const { themeColors } = useThemeColors();
	const bandBg = active ? band : themeColors.border;
	const bandFg = active ? onBand(themeColors, band) : themeColors.secondary;

	return (
		<Animated.View
			entering={FadeInDown.delay(delay).duration(260)}
			className="mb-4"
		>
			<View
				className="rounded-xl overflow-hidden"
				style={{
					backgroundColor: themeColors.card,
					shadowColor: '#000',
					shadowOpacity: 0.08,
					shadowOffset: { width: 0, height: 4 },
					shadowRadius: 12,
					elevation: 3,
				}}
			>
				<Pressable
					onPress={onActivate}
					className="flex-row items-center px-4 py-3"
					style={({ pressed }) => ({
						backgroundColor: bandBg,
						opacity: pressed ? 0.9 : 1,
					})}
				>
					<View
						className="w-10 h-10 rounded-full items-center justify-center"
						style={{ backgroundColor: `${bandFg}26` }}
					>
						<Ionicons name={icon} size={20} color={bandFg} />
					</View>
					<View className="flex-1 ml-3">
						<Text
							className="font-sansExtraBold text-label"
							style={{ color: bandFg }}
						>
							{title}
						</Text>
						<Text
							className="font-sansMedium text-body-xs mt-0.5"
							style={{ color: bandFg, opacity: 0.85 }}
						>
							{subtitle}
						</Text>
					</View>
					{active ? (
						<View
							className="rounded-lg border-2 px-2.5 py-1"
							style={{
								borderColor: bandFg,
								transform: [{ rotate: '-12deg' }],
							}}
						>
							<Text
								className="font-sansMedium text-body-xs"
								style={{ color: bandFg }}
							>
								Ativo
							</Text>
						</View>
					) : (
						<Text
							className="font-sansMedium text-body-xs"
							style={{ color: themeColors.secondary }}
						>
							Toca para ativar
						</Text>
					)}
				</Pressable>
				<View
					className="border-t px-4 py-3.5"
					style={{ borderColor: themeColors.border }}
				>
					<View className="flex-row">
						{stats.map((s, i) => (
							<PanelStat
								key={s.label}
								first={i === 0}
								value={s.value}
								label={s.label}
							/>
						))}
					</View>
					{children}
				</View>
			</View>
		</Animated.View>
	);
}

function ReciboRow({
	label,
	value,
	muted,
}: {
	label: string;
	value: string;
	muted?: boolean;
}) {
	const { themeColors } = useThemeColors();
	return (
		<View className="flex-row items-center justify-between py-1.5">
			<Text
				className="font-sans text-body-small"
				style={{
					color: muted ? themeColors.secondary : themeColors.text,
				}}
			>
				{label}
			</Text>
			<Text
				className="font-sansMedium text-body-small"
				style={{
					color: muted ? themeColors.secondary : themeColors.text,
				}}
			>
				{value}
			</Text>
		</View>
	);
}

export default function ProfileScreen() {
	const { themeColors } = useThemeColors();
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'Main'>
		>();
	const currentRole = useAppStore((s) => s.currentRole);
	const setRole = useAppStore((s) => s.setRole);
	const theme = useThemeStore((s) => s.theme);
	const setTheme = useThemeStore((s) => s.setTheme);
	const me = useSessionUser();
	const initialsLabel = useSessionInitials();
	const sessionUserId = useSessionUserId();

	// Reservas e corridas vêm da API: o perfil conta as viagens reais do
	// utilizador, não as de uma base local.
	const { data: apiBookings } = useQuery({
		queryKey: qk.myBookings.all,
		queryFn: listMyBookings,
		enabled: !!sessionUserId,
	});
	const { data: myRidesPage } = useQuery({
		queryKey: qk.myRides.list({ limit: 100 }),
		queryFn: () => listMyRides({ limit: 100 }),
		enabled: !!sessionUserId,
	});
	const bookings = useMemo(
		() => (apiBookings ?? []).map(toBooking),
		[apiBookings],
	);
	const rides = useMemo(
		() => (myRidesPage?.rows ?? []).map(toRide),
		[myRidesPage],
	);

	// Estado real (API) de KYC/viaturas — os gates de pedir/registar
	// corrida leem daqui, não do mock.
	const [elig, setElig] = useState<Eligibility | null>(null);
	const [emgName, setEmgName] = useState('');
	const [emgPhone, setEmgPhone] = useState('');
	const [emgSaving, setEmgSaving] = useState(false);
	const [emgSaved, setEmgSaved] = useState(false);

	useFocusEffect(
		useCallback(() => {
			let alive = true;
			fetchEligibility().then((e) => {
				if (alive) setElig(e);
			});
			getEmergencyContact()
				.then((c) => {
					if (!alive || !c) return;
					setEmgName(c.name);
					setEmgPhone(c.phone);
				})
				.catch(() => undefined);
			return () => {
				alive = false;
			};
		}, []),
	);

	const saveEmergency = async () => {
		if (emgName.trim().length < 2 || emgSaving) return;
		setEmgSaving(true);
		setEmgSaved(false);
		try {
			const saved = await saveEmergencyContact({
				name: emgName.trim(),
				phone: emgPhone.trim(),
			});
			setEmgName(saved.name);
			setEmgPhone(saved.phone);
			setEmgSaved(true);
		} catch (error) {
			Alert.alert(
				'Contacto de emergência',
				apiErrorMessage(error, 'Não foi possível guardar.'),
			);
		} finally {
			setEmgSaving(false);
		}
	};

	// KYC e viaturas vêm da API. O `me` do mock já não é fonte de verdade: um
	// estado guardado localmente diria "verificado" a quem foi recusado no
	// servidor.
	const kycStamp = !elig?.loaded
		? 'nao_submetido'
		: !elig.kycDriver
			? 'nao_submetido'
			: elig.kycDriver.status === 'VERIFIED'
				? 'verificado'
				: elig.kycDriver.status === 'PENDING'
					? 'pendente'
					: elig.kycDriver.status === 'REJECTED'
						? 'recusado'
						: 'nao_submetido';
	const vehicleStamp = !elig?.loaded
		? 'nao_submetido'
		: elig.verifiedVehicles.length > 0
			? 'verificado'
			: elig.vehicles.length > 0
				? 'pendente'
				: 'nao_submetido';

	const myBookings = bookings.filter((b) => b.passengerId === sessionUserId);
	const feitas = myBookings.filter((b) => b.status === 'concluida').length;
	const proximas = myBookings.filter((b) =>
		['pedido', 'confirmada', 'em_viagem'].includes(b.status),
	).length;
	const myRides = rides.filter((r) => r.driverId === sessionUserId);
	const publicadas = myRides.length;
	const concluidas = myRides.filter((r) => r.status === 'concluida').length;

	// Recibo do motorista: total das viagens − 10% de comissão da plataforma
	const totalViagens = bookings
		.filter(
			(b) =>
				myRides.some((r) => r.id === b.rideId) &&
				['confirmada', 'em_viagem', 'concluida'].includes(b.status),
		)
		.reduce((sum, b) => sum + b.amount, 0);
	const comissao = Math.round(totalViagens * 0.1);
	const aReceber = totalViagens - comissao;

	// Não há backend de reviews, por isso não há classificação a mostrar. Exibir
	// "novo" ou uma nota do mock seria inventar reputação de alguém.
	const rating = '—';
	const since = me?.createdAt
		? `${MONTHS_PT[new Date(me.createdAt).getMonth()].slice(0, 3).toUpperCase()}.${String(
				new Date(me.createdAt).getFullYear(),
			).slice(2)}`
		: '—';

	const goToBookings = () => {
		const tab =
			currentRole === 'passenger' ? 'PassengerBookings' : 'DriverTrips';
		(
			navigation as unknown as { navigate: (name: string) => void }
		).navigate(tab);
	};

	return (
		<SafeAreaView
			className="flex-1 px-5"
			style={{ backgroundColor: themeColors.background }}
		>
			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				<View
					className="-mx-5 px-5 pt-3 pb-12"
					style={{ backgroundColor: themeColors.text }}
				>
					<View className="flex-row items-center">
						<View
							className="w-16 h-16 rounded-full items-center justify-center"
							style={{
								backgroundColor: themeColors.primary,
								borderWidth: 2,
								borderColor: themeColors.border,
							}}
						>
							<Text
								className="font-sansExtraBold text-title-secondary"
								style={{ color: themeColors.onPrimary }}
							>
								{initialsLabel}
							</Text>
						</View>
						<View className="flex-1 ml-3">
							<Text
								className="font-sansMedium text-body-xs"
								style={{ color: themeColors.card }}
							>
								Sócio Boleia
							</Text>
							<Text
								className="font-sansExtraBold text-title-secondary -mt-0.5"
								style={{ color: themeColors.card }}
								numberOfLines={1}
							>
								{me
									? [me.name, me.surname]
											.filter(Boolean)
											.join(' ')
									: '—'}
							</Text>
						</View>
					</View>
					<View className="flex-row items-center mt-3">
						<Text
							className="font-sansMedium text-label-small mr-1.5"
							style={{ color: themeColors.primary }}
						>
							★
						</Text>
						<Text
							className="font-sansMedium text-body-small"
							style={{ color: themeColors.card }}
						>
							{rating}
						</Text>
						<Text
							className="font-sansMedium text-body-xs ml-3"
							style={{ color: themeColors.card, opacity: 0.7 }}
						>
							desde {since}
						</Text>
					</View>
				</View>

				{/* Cartão de sócio */}
				<Animated.View entering={FadeInDown.duration(260)}>
					<View
						className="rounded-xl overflow-hidden -mt-7"
						style={{
							backgroundColor: themeColors.card,
							shadowColor: '#000',
							shadowOpacity: 0.1,
							shadowOffset: { width: 0, height: 6 },
							shadowRadius: 16,
							elevation: 4,
						}}
					>
						<View className="px-4 py-4">
							<View className="flex-row items-center">
								<View
									className="w-9 h-9 rounded-full items-center justify-center"
									style={{
										backgroundColor: themeColors.accentWeak,
									}}
								>
									<Ionicons
										name="shield-checkmark-outline"
										size={18}
										color={themeColors.primary}
									/>
								</View>
								<View className="flex-1 ml-3">
									<Text
										className="font-sansMedium text-body-xs"
										style={{ color: themeColors.secondary }}
									>
										Sócio desde
									</Text>
									<Text
										className="font-sansMedium text-body-xs mt-0.5"
										style={{ color: themeColors.text }}
									>
										{since}
									</Text>
								</View>
								<View className="items-end">
									<Text
										className="font-sansMedium text-body-xs"
										style={{ color: themeColors.secondary }}
									>
										Nº
									</Text>
									<Text
										className="font-sansMedium text-body-xs mt-0.5"
										style={{ color: themeColors.text }}
									>
										{me?.phone ? maskPhone(me.phone) : '—'}
									</Text>
								</View>
							</View>
						</View>
					</View>
				</Animated.View>

				{/* Papéis */}
				<View className="mt-6 mb-4">
					<SectionTitle>Uma conta · dois papéis</SectionTitle>
				</View>

				{/* Passageiro */}
				<RolePanel
					active={currentRole === 'passenger'}
					band={themeColors.laterite}
					icon="person"
					title="Passageiro"
					subtitle="Viagens e reservas"
					delay={80}
					stats={[
						{ value: rating, label: 'Avaliação' },
						{ value: String(feitas), label: 'Feitas' },
						{ value: String(proximas), label: 'Próximas' },
					]}
					onActivate={() => setRole('passenger')}
				>
					<Pressable
						onPress={goToBookings}
						className="flex-row items-center mt-3 pt-3 border-t"
						style={({ pressed }) => ({
							borderColor: themeColors.border,
							opacity: pressed ? 0.7 : 1,
						})}
					>
						<Ionicons
							name="card-outline"
							size={15}
							color={themeColors.text}
						/>
						<Text
							className="font-sansMedium text-body-xs flex-1 ml-2"
							style={{ color: themeColors.text }}
						>
							Ver reservas
						</Text>
						<Ionicons
							name="chevron-forward"
							size={15}
							color={themeColors.secondary}
						/>
					</Pressable>
				</RolePanel>

				{/* Motorista */}
				<RolePanel
					active={currentRole === 'driver'}
					band={themeColors.success}
					icon="car"
					title="Motorista"
					subtitle="Documentos e viatura"
					delay={160}
					stats={[
						{ value: String(publicadas), label: 'Publicadas' },
						{ value: String(concluidas), label: 'Concluídas' },
						{ value: rating, label: 'Avaliação' },
					]}
					onActivate={() => setRole('driver')}
				>
					<View
						className="mt-3 rounded-xl overflow-hidden"
						style={{ backgroundColor: themeColors.background }}
					>
						<Pressable
							onPress={() => navigation.navigate('Kyc')}
							className="flex-row items-center justify-between px-3.5 py-3 border-b"
							style={({ pressed }) => ({
								borderColor: themeColors.border,
								opacity: pressed ? 0.7 : 1,
							})}
						>
							<Text
								className="font-sansMedium text-body-small"
								style={{ color: themeColors.text }}
							>
								BI e carta de condução
							</Text>
							<VerificationStamp status={kycStamp} />
						</Pressable>
						<Pressable
							onPress={() => navigation.navigate('Vehicle')}
							className="flex-row items-center justify-between px-3.5 py-3"
							style={({ pressed }) => ({
								opacity: pressed ? 0.7 : 1,
							})}
						>
							<Text
								className="font-sansMedium text-body-small"
								style={{ color: themeColors.text }}
							>
								Viatura
							</Text>
							<VerificationStamp status={vehicleStamp} />
						</Pressable>
					</View>
					{vehicleStamp !== 'verificado' ? (
						<Text
							className="font-sans text-body-xs mt-2"
							style={{ color: themeColors.secondary }}
						>
							Regista a viatura para publicar viagens.
						</Text>
					) : null}
				</RolePanel>

				{/* Recibo de ganhos — só aparece no papel de motorista */}
				{currentRole === 'driver' ? (
					<Animated.View
						entering={FadeInDown.delay(200).duration(260)}
					>
						<SectionTitle>Recibo de ganhos</SectionTitle>
						<View
							className="rounded-xl overflow-hidden mt-4"
							style={{
								backgroundColor: themeColors.card,
								shadowColor: '#000',
								shadowOpacity: 0.08,
								shadowOffset: { width: 0, height: 4 },
								shadowRadius: 12,
								elevation: 3,
							}}
						>
							<View
								className="px-4 py-3"
								style={{ backgroundColor: themeColors.primary }}
							>
								<Text
									className="font-sansMedium text-body-xs"
									style={{
										color: themeColors.onPrimary,
										opacity: 0.75,
									}}
								>
									Carteira do motorista
								</Text>
								<Text
									className="font-sansExtraBold text-title-primary mt-1"
									style={{ color: themeColors.onPrimary }}
								>
									{fmtKz(aReceber)}
								</Text>
								<Text
									className="font-sansMedium text-body-xs mt-0.5"
									style={{
										color: themeColors.onPrimary,
										opacity: 0.75,
									}}
								>
									Por receber
								</Text>
							</View>
							<View
								className="border-t"
								style={{ borderColor: themeColors.border }}
							/>
							{totalViagens > 0 ? (
								<View className="px-4 pt-3 pb-4">
									<ReciboRow
										label="Total das viagens"
										value={fmtKz(totalViagens)}
									/>
									<ReciboRow
										label="Comissão Boleia · 10%"
										value={`-${fmtKz(comissao)}`}
										muted
									/>
									<View
										className="flex-row items-center justify-between pt-2.5 mt-1.5 border-t"
										style={{
											borderColor: themeColors.border,
										}}
									>
										<Text
											className="font-sansBold text-body-small"
											style={{ color: themeColors.text }}
										>
											A receber
										</Text>
										<Text
											className="font-sansMedium text-body-small"
											style={{ color: themeColors.text }}
										>
											{fmtKz(aReceber)}
										</Text>
									</View>
								</View>
							) : (
								<View className="px-4 pt-3 pb-4">
									<Text
										className="font-sans text-body-xs leading-4"
										style={{ color: themeColors.secondary }}
									>
										Ainda sem valores por receber. Publica a
										tua primeira viagem e o recibo enche.
									</Text>
								</View>
							)}
						</View>
					</Animated.View>
				) : null}

				{/* Pessoa de confiança — usada pelo SOS */}
				<View className="mt-6">
					<SectionTitle>Segurança</SectionTitle>
					<View
						className="rounded-xl overflow-hidden mt-4"
						style={{
							backgroundColor: themeColors.card,
							shadowColor: '#000',
							shadowOpacity: 0.08,
							shadowOffset: { width: 0, height: 4 },
							shadowRadius: 12,
							elevation: 3,
						}}
					>
						<View className="px-4 py-3 flex-row items-center">
							<View
								className="w-9 h-9 rounded-full items-center justify-center"
								style={{
									backgroundColor: themeColors.accentWeak,
								}}
							>
								<Ionicons
									name="shield-checkmark-outline"
									size={19}
									color={themeColors.primary}
								/>
							</View>
							<View className="flex-1 ml-3">
								<Text
									className="font-sansMedium text-body-small"
									style={{ color: themeColors.text }}
								>
									Pessoa de confiança
								</Text>
								<Text
									className="font-sans text-body-xs mt-0.5"
									style={{ color: themeColors.secondary }}
								>
									{/*
									 * Dizia "A central Boleia liga a esta pessoa numa
									 * emergência". Não há central, nem há `SosEvent` em
									 * lado nenhum — o modelo existe no esquema e não tem
									 * uma linha de código. Dizer isto a alguém que guardou
									 * o número de um familiar numa viagem entre províncias
									 * é o pior sítio para uma promessa falsa.
									 *
									 * O que a app faz mesmo: guarda o número, e fica
									 * disponível para a pessoa mostrar a quem estiver com
									 * ela.
									 */}
									A central Boleia ainda não está activa. O
									número fica guardado para o levares connosco
									se precisares de ajuda.
								</Text>
							</View>
						</View>
						<View className="px-4 pb-4">
							<Text
								className="font-sansMedium text-body-xs mb-1.5"
								style={{ color: themeColors.secondary }}
							>
								Nome
							</Text>
							<View
								className="rounded-xl px-3.5 mb-3"
								style={{
									backgroundColor: themeColors.background,
								}}
							>
								<TextInput
									value={emgName}
									onChangeText={(t) => {
										setEmgName(t);
										setEmgSaved(false);
									}}
									placeholder="Ex.: Marta António"
									placeholderTextColor={themeColors.border}
									className="py-3 font-sans text-label-small"
									style={{ color: themeColors.text }}
								/>
							</View>
							<Text
								className="font-sansMedium text-body-xs mb-1.5"
								style={{ color: themeColors.secondary }}
							>
								Telefone
							</Text>
							<View
								className="rounded-xl px-3.5 mb-3"
								style={{
									backgroundColor: themeColors.background,
								}}
							>
								<TextInput
									value={emgPhone}
									onChangeText={(t) => {
										setEmgPhone(t.replace(/[^\d+\s]/g, ''));
										setEmgSaved(false);
									}}
									placeholder="Ex.: 923000111"
									placeholderTextColor={themeColors.border}
									keyboardType="phone-pad"
									className="py-3 font-sansMedium text-label-small"
									style={{ color: themeColors.text }}
								/>
							</View>
							{emgSaving ? (
								<View className="items-center py-2">
									<ActivityIndicator
										color={themeColors.primary}
									/>
								</View>
							) : (
								<BoleiaButton
									title={
										emgSaved
											? 'Guardado ✓'
											: 'Guardar contacto'
									}
									onPress={saveEmergency}
									disabled={emgName.trim().length < 2}
								/>
							)}
						</View>
					</View>
				</View>

				{/* Definições */}
				<View className="mt-6">
					<SectionTitle>Definições</SectionTitle>
					<View
						className="flex-row rounded-full p-1 mt-4"
						style={{ backgroundColor: themeColors.card }}
					>
						{THEMES.map((t) => {
							const active = theme === t.mode;
							return (
								<Pressable
									key={t.mode}
									onPress={() => setTheme(t.mode)}
									className="flex-1 rounded-full py-2 items-center"
									style={{
										backgroundColor: active
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
										{t.label}
									</Text>
								</Pressable>
							);
						})}
					</View>

					<View
						className="mt-4 rounded-xl overflow-hidden"
						style={{
							backgroundColor: themeColors.card,
							shadowColor: '#000',
							shadowOpacity: 0.08,
							shadowOffset: { width: 0, height: 4 },
							shadowRadius: 12,
							elevation: 3,
						}}
					>
						<Pressable
							onPress={() => navigation.navigate('SosCenter')}
							className="flex-row items-center justify-between px-4 py-3.5 border-b"
							style={({ pressed }) => ({
								borderColor: themeColors.border,
								backgroundColor: themeColors.card,
								opacity: pressed ? 0.7 : 1,
							})}
						>
							<View className="flex-row items-center">
								<View
									className="w-9 h-9 rounded-full items-center justify-center"
									style={{
										backgroundColor: themeColors.accentWeak,
									}}
								>
									<Ionicons
										name="shield-checkmark-outline"
										size={19}
										color={themeColors.primary}
									/>
								</View>
								<Text
									className="font-sansMedium text-body-small ml-3"
									style={{ color: themeColors.text }}
								>
									Central de segurança
								</Text>
							</View>
							<Ionicons
								name="chevron-forward"
								size={18}
								color={themeColors.secondary}
							/>
						</Pressable>
						<Pressable
							onPress={() => {
								Alert.alert(
									'Terminar sessão',
									'Tens a certeza que queres sair? Voltar a entrar é rápido.',
									[
										{ text: 'Cancelar', style: 'cancel' },
										{
											text: 'Terminar sessão',
											style: 'destructive',
											onPress: () => {
												/*
												 * O `signOut` é do `authClient` e
												 * **revoga a sessão no servidor**.
												 * Antes isto só apagava o token
												 * local: a sessão continuava viva
												 * no backend, e voltar a abrir a
												 * app num ecrã que não passasse
												 * pela verificação voltava a
												 * autenticar. É também o que
												 * limpa os cookies no SecureStore.
												 */
												void authClient
													.signOut()
													.catch(() => {});
												useAppStore
													.getState()
													.resetAfterLogout();
												navigationRef.reset({
													index: 0,
													routes: [
														{
															name: 'Auth',
															params: {
																screen: 'Login',
															},
														},
													],
												});
											},
										},
									],
								);
							}}
							className="flex-row items-center justify-between px-4 py-3.5"
							style={({ pressed }) => ({
								borderColor: themeColors.border,
								backgroundColor: themeColors.card,
								opacity: pressed ? 0.7 : 1,
							})}
						>
							<View className="flex-row items-center">
								<View
									className="w-9 h-9 rounded-full items-center justify-center"
									style={{
										backgroundColor: `${themeColors.error}1A`,
									}}
								>
									<Ionicons
										name="log-out-outline"
										size={19}
										color={themeColors.error}
									/>
								</View>
								<Text
									className="font-sansBold text-body-small ml-3"
									style={{ color: themeColors.text }}
								>
									Terminar sessão
								</Text>
							</View>
						</Pressable>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
