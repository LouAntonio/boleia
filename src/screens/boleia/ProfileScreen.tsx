import React from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useSessionUser, useSessionUserId } from '../../hooks/useSessionUser';
import { useAppStore } from '../../store/appStore';
import { useThemeStore, ThemeMode } from '../../store/themeStore';
import { useDbStore } from '../../mock/db';
import { initials, fmtKz } from '../../mock/helpers';
import { maskPhone } from '../../utils/phone';
import { statusMeta, StatusTone } from '../../utils/status';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import Perforation from '../../components/Perforation';
import QRStamp from '../../components/QRStamp';
import { Ionicons } from '@expo/vector-icons';
import { navigationRef } from '../../lib/navigationRef';

// Tinta de leitura sobre as bandas tingidas — mesmos fixos do BookingStub.
// As bandas ativas usam os tons claros nos DOIS temas: texto CELU passa AA.
const CELU = '#F7F3E7';
const ASFALTO = '#17141B';
const BAND_LATERITE = '#B4531F';
const BAND_MATO = '#1F7A5B';

const THEMES: { mode: ThemeMode; label: string }[] = [
	{ mode: 'light', label: 'Claro' },
	{ mode: 'dark', label: 'Escuro' },
	{ mode: 'system', label: 'Sistema' },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
	const { themeColors } = useThemeColors();
	return (
		<View className="flex-row items-center">
			<View
				className="w-[14px] h-[2px] mr-2"
				style={{ backgroundColor: themeColors.laterite }}
			/>
			<Text
				className="font-mono text-[10px] uppercase tracking-[3px]"
				style={{ color: themeColors.text }}
			>
				{children}
			</Text>
		</View>
	);
}

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
				className="font-mono text-[14px]"
				style={{ color: themeColors.text }}
			>
				{value}
			</Text>
			<Text
				className="font-mono text-[9px] uppercase tracking-[2px] mt-1"
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
	done: 'mato',
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
				className="font-mono text-[9px] uppercase tracking-[1.5px]"
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
	const bandFg = active ? CELU : themeColors.secondary;

	return (
		<Animated.View
			entering={FadeInDown.delay(delay).duration(260)}
			className="mb-4"
		>
			<View
				className="rounded-3xl border overflow-hidden"
				style={{
					borderColor: active ? band : themeColors.border,
					borderWidth: active ? 2 : 1,
					backgroundColor: themeColors.card,
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
							className="font-display text-[17px]"
							style={{ color: bandFg }}
						>
							{title}
						</Text>
						<Text
							className="font-mono text-[9px] uppercase tracking-[2px] mt-0.5"
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
								className="font-mono text-[10px] uppercase tracking-[2px]"
								style={{ color: bandFg }}
							>
								Ativo
							</Text>
						</View>
					) : (
						<Text
							className="font-mono text-[9px] uppercase tracking-[1.5px]"
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
				className="font-sans text-[13px]"
				style={{
					color: muted ? themeColors.secondary : themeColors.text,
				}}
			>
				{label}
			</Text>
			<Text
				className="font-mono text-[13px]"
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
	const bookings = useDbStore((s) => s.db.bookings);
	const rides = useDbStore((s) => s.db.rides);
	const sessionUserId = useSessionUserId();

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

	const rating = me?.rating ? me.rating.toFixed(1) : 'novo';
	const since = me
		? new Date(me.createdAt)
				.toLocaleDateString('pt-PT', {
					month: 'short',
					year: '2-digit',
				})
				.replace('.', '')
				.toUpperCase()
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
				<View className="mt-2">
					<Eyebrow>Perfil</Eyebrow>
					<Text
						className="font-display text-[22px] -mt-0.5"
						style={{ color: themeColors.text }}
					>
						O teu perfil
					</Text>
				</View>

				{/* Bilhete de sócio */}
				<Animated.View entering={FadeInDown.duration(260)}>
					<View
						className="rounded-3xl border overflow-hidden mt-3"
						style={{
							borderColor: themeColors.border,
							backgroundColor: themeColors.card,
						}}
					>
						<View
							className="px-4 pt-3.5 pb-3 flex-row items-center"
							style={{ backgroundColor: themeColors.text }}
						>
							<View
								className="w-14 h-14 rounded-full items-center justify-center"
								style={{
									backgroundColor: themeColors.primary,
									borderWidth: 2,
									borderColor: themeColors.laterite,
								}}
							>
								<Text
									className="font-display text-[18px]"
									style={{ color: ASFALTO }}
								>
									{me
										? initials(me.firstName, me.lastName)
										: '?'}
								</Text>
							</View>
							<View className="flex-1 ml-3">
								<Text
									className="font-mono text-[10px] uppercase tracking-[3px]"
									style={{ color: themeColors.card }}
								>
									Sócio Boleia
								</Text>
								<Text
									className="font-display text-[22px] -mt-0.5"
									style={{ color: themeColors.card }}
									numberOfLines={1}
								>
									{me
										? `${me.firstName} ${me.lastName}`
										: '—'}
								</Text>
							</View>
						</View>
						<Perforation flush />
						<View className="px-4 pt-3 pb-4">
							<View className="flex-row items-center">
								<Text
									className="font-mono text-[15px] mr-1.5"
									style={{ color: themeColors.laterite }}
								>
									★
								</Text>
								<Text
									className="font-sansMedium text-[13px]"
									style={{ color: themeColors.secondary }}
								>
									{rating}
									{me && me.ratingsCount > 0
										? ` · ${me.ratingsCount} avaliaçõe${me.ratingsCount > 1 ? 's' : ''}`
										: ''}
								</Text>
							</View>
							<View
								className="flex-row items-center mt-3.5 pt-3 border-t"
								style={{ borderColor: themeColors.border }}
							>
								<QRStamp seed={sessionUserId} size={34} />
								<View className="flex-1 ml-3">
									<Text
										className="font-mono text-[9px] uppercase tracking-[2px]"
										style={{ color: themeColors.secondary }}
									>
										Sócio desde
									</Text>
									<Text
										className="font-mono text-[11px] mt-0.5"
										style={{ color: themeColors.text }}
									>
										{since}
									</Text>
								</View>
								<View className="items-end">
									<Text
										className="font-mono text-[9px] uppercase tracking-[2px]"
										style={{ color: themeColors.secondary }}
									>
										Nº
									</Text>
									<Text
										className="font-mono text-[11px] mt-0.5"
										style={{ color: themeColors.text }}
									>
										{me ? maskPhone(me.phone) : '—'}
									</Text>
								</View>
							</View>
						</View>
					</View>
				</Animated.View>

				{/* Papéis */}
				<View className="mt-6 mb-3">
					<Eyebrow>Uma conta · dois papéis</Eyebrow>
				</View>

				{/* Passageiro */}
				<RolePanel
					active={currentRole === 'passenger'}
					band={BAND_LATERITE}
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
							name="ticket-outline"
							size={15}
							color={themeColors.text}
						/>
						<Text
							className="font-sansMedium text-[12px] flex-1 ml-2"
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
					band={BAND_MATO}
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
						className="mt-3 rounded-xl border overflow-hidden"
						style={{
							borderColor: themeColors.border,
							backgroundColor: themeColors.card,
						}}
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
								className="font-sansMedium text-[13px]"
								style={{ color: themeColors.text }}
							>
								BI e carta de condução
							</Text>
							<VerificationStamp
								status={me?.kyc?.status ?? 'nao_submetido'}
							/>
						</Pressable>
						<Pressable
							onPress={() => navigation.navigate('Vehicle')}
							className="flex-row items-center justify-between px-3.5 py-3"
							style={({ pressed }) => ({
								opacity: pressed ? 0.7 : 1,
							})}
						>
							<Text
								className="font-sansMedium text-[13px]"
								style={{ color: themeColors.text }}
							>
								Viatura
							</Text>
							<VerificationStamp
								status={me?.vehicle?.status ?? 'nao_submetido'}
							/>
						</Pressable>
					</View>
					{me?.vehicle?.status !== 'verificado' ? (
						<Text
							className="font-sans text-[12px] mt-2"
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
						className="mt-2"
					>
						<Eyebrow>Recibo de ganhos</Eyebrow>
						<View
							className="rounded-3xl border overflow-hidden mt-3"
							style={{
								borderColor: themeColors.border,
								backgroundColor: themeColors.card,
							}}
						>
							<View
								className="px-4 py-3"
								style={{ backgroundColor: themeColors.primary }}
							>
								<Text
									className="font-mono text-[9px] uppercase tracking-[2px]"
									style={{ color: ASFALTO, opacity: 0.75 }}
								>
									Carteira do motorista
								</Text>
								<Text
									className="font-display text-[26px] mt-1"
									style={{ color: ASFALTO }}
								>
									{fmtKz(aReceber)}
								</Text>
								<Text
									className="font-mono text-[9px] uppercase tracking-[2px] mt-0.5"
									style={{ color: ASFALTO, opacity: 0.75 }}
								>
									Por receber
								</Text>
							</View>
							<Perforation flush />
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
											className="font-sansBold text-[13px]"
											style={{ color: themeColors.text }}
										>
											A receber
										</Text>
										<Text
											className="font-mono text-[14px]"
											style={{ color: themeColors.text }}
										>
											{fmtKz(aReceber)}
										</Text>
									</View>
								</View>
							) : (
								<View className="px-4 pt-3 pb-4">
									<Text
										className="font-sans text-[12px] leading-4"
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

				{/* Definições */}
				<View className="mt-6">
					<Eyebrow>Definições</Eyebrow>
					<View
						className="flex-row rounded-full p-1 border mt-3"
						style={{
							borderColor: themeColors.border,
							backgroundColor: themeColors.card,
						}}
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
										className="font-sansMedium text-[12px]"
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

					<View className="mt-4 rounded-2xl border overflow-hidden">
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
										backgroundColor: `${themeColors.laterite}1A`,
									}}
								>
									<Ionicons
										name="shield-checkmark-outline"
										size={19}
										color={themeColors.laterite}
									/>
								</View>
								<Text
									className="font-sansMedium text-[14px] ml-3"
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
												useAppStore
													.getState()
													.signOut();
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
									className="font-sansBold text-[14px] ml-3"
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
