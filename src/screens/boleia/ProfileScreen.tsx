import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { qk } from '../../lib/queryKeys';
import { queryClient as appQueryClient } from '../../lib/queryClient';
import { useThemeColors } from '../../hooks/useThemeColors';
import {
	useSessionUser,
	useSessionUserId,
	useSessionInitials,
} from '../../hooks/useSessionUser';
import { useAppStore } from '../../store/appStore';
import { useThemeStore, ThemeMode } from '../../store/themeStore';
import {
	apiErrorMessage,
	getEmergencyContact,
	listMyBookings,
	listMyRides,
	saveEmergencyContact,
} from '../../lib/api';
import { toBooking, toRide } from '../../lib/rideMapper';
import { fmtKz } from '../../lib/format';
import { MONTHS_PT } from '../../utils/date';
import { maskPhone } from '../../utils/phone';
import { navigationRef } from '../../lib/navigationRef';
import { authClient } from '../../lib/auth-client';
import { Eligibility, fetchEligibility } from '../../lib/eligibility';
import { BoleiaMainStackParamList } from '../../types/navigation';

import Avatar from '../../components/Avatar';
import BoleiaButton from '../../components/BoleiaButton';
import Card from '../../components/Card';
import Input from '../../components/Input';
import SectionTitle from '../../components/SectionTitle';
import SegmentedControl from '../../components/SegmentedControl';
import StatusStamp from '../../components/StatusStamp';

const THEMES: readonly { value: ThemeMode; label: string }[] = [
	{ value: 'light', label: 'Claro' },
	{ value: 'dark', label: 'Escuro' },
	{ value: 'system', label: 'Sistema' },
];

const ROLES = [
	{ value: 'passenger' as const, label: 'Passageiro' },
	{ value: 'driver' as const, label: 'Motorista' },
];

/**
 * Um número dentro de um painel.
 *
 * Existia em versão com divisórias laterais à esquerda e era usado duas vezes
 * no ecrã, uma em cada painel de papel. Agora é uma vez: o ecrã mostra só o
 * papel activo, e as réguas entre dois números iguais deixavam de ser
 * informação para passar a ser ruído.
 */
function PanelStat({ value, label }: { value: string; label: string }) {
	const { themeColors } = useThemeColors();
	return (
		<View className="flex-1">
			<Text
				className="font-sansExtraBold text-title-tertiary"
				style={{ color: themeColors.text }}
			>
				{value}
			</Text>
			<Text
				className="font-sans text-body-xs mt-0.5"
				style={{ color: themeColors.secondary }}
			>
				{label}
			</Text>
		</View>
	);
}

/**
 * Linha de navegação: círculo de ícone, rótulo, e o que vier à direita.
 *
 * Substitui quatro versões quase iguais que apareciam no ecrã (reservas, KYC,
 * viatura, central de segurança), com metades ligeiramente diferentes — altura
 * do `py`, tom do ícone, presença de divisória.
 */
function NavRow({
	icon,
	label,
	trailing,
	onPress,
	tone = 'default',
}: {
	icon: keyof typeof Ionicons.glyphMap;
	label: string;
	trailing?: React.ReactNode;
	onPress: () => void;
	tone?: 'default' | 'danger';
}) {
	const { themeColors } = useThemeColors();
	const danger = tone === 'danger';
	const ink = danger ? themeColors.error : themeColors.primary;
	const wash = danger ? themeColors.dangerWeak : themeColors.accentWeak;

	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="button"
			className="flex-row items-center justify-between px-4 py-3"
			style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
		>
			<View className="flex-row items-center flex-1">
				<View
					className="w-9 h-9 rounded-full items-center justify-center"
					style={{ backgroundColor: wash }}
				>
					<Ionicons name={icon} size={18} color={ink} />
				</View>
				<Text
					className="flex-1 ml-3 font-sansMedium text-body-small"
					style={{
						color: danger ? themeColors.error : themeColors.text,
					}}
				>
					{label}
				</Text>
			</View>
			{trailing ?? (
				<Ionicons
					name="chevron-forward"
					size={16}
					color={themeColors.secondary}
				/>
			)}
		</Pressable>
	);
}

/** Divisória dentro de um cartão agrupado. */
function Divider() {
	const { themeColors } = useThemeColors();
	return (
		<View
			style={{ height: 1, backgroundColor: themeColors.border }}
			className="ml-[60px]"
		/>
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
	const ink = muted ? themeColors.secondary : themeColors.text;
	return (
		<View className="flex-row items-center justify-between py-1.5">
			<Text className="font-sans text-body-small" style={{ color: ink }}>
				{label}
			</Text>
			<Text
				className="font-sansMedium text-body-small"
				style={{ color: ink }}
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
	const queryClient = useQueryClient();
	const currentRole = useAppStore((s) => s.currentRole);
	const setRole = useAppStore((s) => s.setRole);
	const theme = useThemeStore((s) => s.theme);
	const setTheme = useThemeStore((s) => s.setTheme);
	const me = useSessionUser();
	const initialsLabel = useSessionInitials();
	const sessionUserId = useSessionUserId();

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

	const totalViagens = bookings
		.filter(
			(b) =>
				myRides.some((r) => r.id === b.rideId) &&
				['confirmada', 'em_viagem', 'concluida'].includes(b.status),
		)
		.reduce((sum, b) => sum + b.amount, 0);
	const comissao = Math.round(totalViagens * 0.1);
	const aReceber = totalViagens - comissao;

	const since = me?.createdAt
		? `${MONTHS_PT[new Date(me.createdAt).getMonth()].slice(0, 3).toUpperCase()}.${String(
				new Date(me.createdAt).getFullYear(),
			).slice(2)}`
		: '—';

	const isDriver = currentRole === 'driver';

	const goToBookings = () => {
		const tab =
			currentRole === 'passenger' ? 'PassengerBookings' : 'DriverTrips';
		(
			navigation as unknown as { navigate: (name: string) => void }
		).navigate(tab);
	};

	const logout = () => {
		Alert.alert(
			'Terminar sessão',
			'Tens a certeza que queres sair? Voltar a entrar é rápido.',
			[
				{ text: 'Cancelar', style: 'cancel' },
				{
					text: 'Terminar sessão',
					style: 'destructive',
					onPress: () => {
						void authClient.signOut().catch(() => {});
						useAppStore.getState().resetAfterLogout();
						// A cache é da conta que está a sair. Sem isto, as
						// reservas e viagens de quem saiu ficam em memória para
						// o próximo que entrar no mesmo aparelho. O `AGENTS.md`
						// descrevia isto no fluxo de 401, mas o logout manual não
						// o fazia.
						queryClient.clear();
						appQueryClient.clear();
						navigationRef.reset({
							index: 0,
							routes: [
								{
									name: 'Auth',
									params: { screen: 'Login' },
								},
							],
						});
					},
				},
			],
		);
	};

	return (
		<SafeAreaView
			className="flex-1 px-5"
			style={{ backgroundColor: themeColors.background }}
		>
			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingBottom: 40 }}
				keyboardShouldPersistTaps="handled"
			>
				{/*
				 * Bloco de identidade — a assinatura do ecrã.
				 *
				 * Substitui a banda escura invertida e o cartão branco sobreposto
				 * com `-mt-7` que ocupavam 120 linhas entre os dois. A banda
				 * invertida violava a regra do próprio sistema (ink só existe
				 * sobre surfaces normais) e o par dark-hero-mais-cartão-sobreposto
				 * é o reflexo automático de qualquer geração de interface.
				 *
				 * Uma superfície, uma ideia: quem é a pessoa, e que uso é que ela
				 * está a dar à Boleia agora. A comutação de papel vive dentro do
				 * bloco porque é a mesma pergunta, não uma secção ao lado.
				 */}
				<Card padded={false}>
					<View className="p-4 flex-row items-center">
						<Avatar
							initials={initialsLabel}
							image={me?.image ?? null}
							size={64}
						/>
						<View className="flex-1 ml-4">
							<Text
								className="font-sans text-body-small"
								style={{ color: themeColors.secondary }}
							>
								{me?.phone
									? maskPhone(me.phone)
									: 'Sem número associado'}
							</Text>
							<Text
								className="font-sansExtraBold text-title-tertiary mt-0.5"
								style={{ color: themeColors.text }}
								numberOfLines={1}
							>
								{me
									? [me.name, me.surname]
											.filter(Boolean)
											.join(' ') || 'Sem nome'
									: '—'}
							</Text>
							<Text
								className="font-sans text-body-xs mt-0.5"
								style={{ color: themeColors.secondary }}
							>
								Sócio desde {since}
							</Text>
						</View>
					</View>
					<Divider />
					<View className="p-3">
						<SegmentedControl
							options={ROLES}
							value={currentRole}
							onChange={setRole}
							accessibilityLabel="Modo de uso"
						/>
					</View>
				</Card>

				{/* Painel do papel activo */}
				<View className="mt-6">
					<SectionTitle>
						{isDriver ? 'As tuas viagens' : 'As tuas reservas'}
					</SectionTitle>
					<Card padded={false} className="mt-1">
						<View className="flex-row p-4">
							{isDriver ? (
								<>
									<PanelStat
										value={String(publicadas)}
										label="Publicadas"
									/>
									<PanelStat
										value={String(concluidas)}
										label="Concluídas"
									/>
								</>
							) : (
								<>
									<PanelStat
										value={String(feitas)}
										label="Feitas"
									/>
									<PanelStat
										value={String(proximas)}
										label="Próximas"
									/>
								</>
							)}
						</View>

						{isDriver ? (
							<>
								<Divider />
								<NavRow
									icon="document-text-outline"
									label="BI e carta de condução"
									trailing={<StatusStamp status={kycStamp} />}
									onPress={() => navigation.navigate('Kyc')}
								/>
								<Divider />
								<NavRow
									icon="car-outline"
									label="Viatura"
									trailing={
										<StatusStamp status={vehicleStamp} />
									}
									onPress={() =>
										navigation.navigate('Vehicle')
									}
								/>
								{vehicleStamp !== 'verificado' ? (
									<View className="px-4 pt-3 pb-4">
										<Text
											className="font-sans text-body-xs"
											style={{
												color: themeColors.secondary,
											}}
										>
											Regista a viatura para publicar
											viagens.
										</Text>
									</View>
								) : null}
							</>
						) : (
							<>
								<Divider />
								<NavRow
									icon="card-outline"
									label="Ver reservas"
									onPress={goToBookings}
								/>
							</>
						)}
					</Card>
				</View>

				{/* Recibo — só no papel de motorista */}
				{isDriver ? (
					<View className="mt-6">
						<SectionTitle>Ganhos</SectionTitle>
						<Card padded={false} className="mt-1">
							{totalViagens > 0 ? (
								<View className="p-4">
									<ReciboRow
										label="Total das viagens"
										value={fmtKz(totalViagens)}
									/>
									<ReciboRow
										label="Comissão Boleia (10%)"
										value={`-${fmtKz(comissao)}`}
										muted
									/>
									<Divider />
									<View className="flex-row items-center justify-between pt-3.5">
										<Text
											className="font-sansExtraBold text-label"
											style={{ color: themeColors.text }}
										>
											A receber
										</Text>
										<Text
											className="font-sansExtraBold text-title-tertiary"
											style={{
												color: themeColors.primary,
											}}
										>
											{fmtKz(aReceber)}
										</Text>
									</View>
								</View>
							) : (
								<View className="p-4">
									<Text
										className="font-sans text-body-small"
										style={{ color: themeColors.secondary }}
									>
										Ainda sem valores por receber. Publica a
										tua primeira viagem e o recibo enche.
									</Text>
								</View>
							)}
						</Card>
					</View>
				) : null}

				{/*
				 * Pessoa de confiança.
				 *
				 * O texto não promete uma central que não existe. Não há
				 * `SosEvent` em lado nenhum — o modelo existe no esquema e não
				 * tem uma linha de código. Dizer isso a alguém que guardou o
				 * número de um familiar numa viagem entre províncias é o pior
				 * sítio para uma promessa falsa. O que a app faz mesmo: guarda
				 * o número, e fica disponível para mostrar a quem estiver com
				 * a pessoa.
				 */}
				<View className="mt-6">
					<SectionTitle>Pessoa de confiança</SectionTitle>
					<Text
						className="font-sans text-body-small mb-4"
						style={{ color: themeColors.secondary }}
					>
						A central Boleia ainda não está activa. O número fica
						guardado para o levares connosco se precisares de ajuda.
					</Text>
					<Input
						label="Nome"
						value={emgName}
						onChangeText={(t) => {
							setEmgName(t);
							setEmgSaved(false);
						}}
						placeholder="Ex.: Marta António"
					/>
					<Input
						label="Telefone"
						value={emgPhone}
						onChangeText={(t) => {
							setEmgPhone(t.replace(/[^\d+\s]/g, ''));
							setEmgSaved(false);
						}}
						placeholder="Ex.: 923000111"
						keyboardType="phone-pad"
						containerStyle={{ marginBottom: 4 }}
					/>
					<BoleiaButton
						title={emgSaved ? 'Guardado' : 'Guardar contacto'}
						onPress={saveEmergency}
						loading={emgSaving}
						disabled={emgName.trim().length < 2}
					/>
				</View>

				{/* Definições */}
				<View className="mt-6">
					<SectionTitle>Aparência</SectionTitle>
					<SegmentedControl
						className="mt-1"
						options={THEMES}
						value={theme}
						onChange={setTheme}
						accessibilityLabel="Tema"
					/>
				</View>

				<View className="mt-6">
					<Card padded={false}>
						<NavRow
							icon="shield-checkmark-outline"
							label="Central de segurança"
							onPress={() => navigation.navigate('SosCenter')}
						/>
						<Divider />
						<NavRow
							icon="log-out-outline"
							label="Terminar sessão"
							tone="danger"
							onPress={logout}
						/>
					</Card>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
