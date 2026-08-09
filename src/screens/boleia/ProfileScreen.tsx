import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAppStore } from '../../store/appStore';
import { useThemeStore, ThemeMode } from '../../store/themeStore';
import { useDbStore } from '../../mock/db';
import { initials, fmtKz } from '../../mock/helpers';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import RoleSwitch from '../../components/RoleSwitch';
import StatusStamp from '../../components/StatusStamp';
import { Ionicons } from '@expo/vector-icons';

const THEMES: { mode: ThemeMode; label: string }[] = [
	{ mode: 'light', label: 'Claro' },
	{ mode: 'dark', label: 'Escuro' },
	{ mode: 'system', label: 'Sistema' },
];

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
	const me = useDbStore((s) => s.db.users.find((u) => u.id === 'u_me_001'));

	return (
		<SafeAreaView
			className="flex-1"
			style={{ backgroundColor: themeColors.background }}
		>
			<ScrollView
				className="flex-1 px-5"
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				<Text
					className="font-display text-[22px] mb-5 mt-2"
					style={{ color: themeColors.text }}
				>
					O teu perfil
				</Text>

				{/* Identidade */}
				<View
					className="flex-row items-center p-4 rounded-2xl border"
					style={{
						backgroundColor: themeColors.card,
						borderColor: themeColors.border,
					}}
				>
					<View
						className="w-14 h-14 rounded-full items-center justify-center"
						style={{ backgroundColor: themeColors.primary }}
					>
						<Text
							className="font-display text-[18px]"
							style={{ color: themeColors.text }}
						>
							{me ? initials(me.firstName, me.lastName) : '?'}
						</Text>
					</View>
					<View className="flex-1 ml-4">
						<Text
							className="font-sansBold text-[16px]"
							style={{ color: themeColors.text }}
						>
							{me ? `${me.firstName} ${me.lastName}` : '—'}
						</Text>
						<Text
							className="font-mono text-[12px] mt-0.5"
							style={{ color: themeColors.secondary }}
						>
							{me?.phone ?? '—'}
						</Text>
						<View className="flex-row items-center mt-1.5">
							<Text
								className="font-mono text-[13px] mr-1"
								style={{ color: themeColors.laterite }}
							>
								★
							</Text>
							<Text
								className="font-sansMedium text-[12px]"
								style={{ color: themeColors.secondary }}
							>
								{me?.rating?.toFixed(1) ?? 'novo'}{' '}
								{me && me.ratingsCount > 0
									? `· ${me.ratingsCount} avaliaçõe${me.ratingsCount > 1 ? 's' : ''}`
									: ''}
							</Text>
						</View>
					</View>
				</View>

				{/* Carteira */}
				<View
					className="mt-4 p-4 rounded-2xl"
					style={{ backgroundColor: themeColors.text }}
				>
					<Text
						className="font-sansMedium text-[11px] uppercase tracking-widest"
						style={{ color: themeColors.primary }}
					>
						Carteira Boleia
					</Text>
					<Text
						className="font-mono text-[24px] mt-1"
						style={{ color: themeColors.card }}
					>
						{me ? fmtKz(me.wallet) : '—'}
					</Text>
				</View>

				{/* Alternância de papel */}
				<View className="mt-6">
					<Text
						className="font-sansBold text-[15px] mb-2"
						style={{ color: themeColors.text }}
					>
						Entrar como
					</Text>
					<RoleSwitch value={currentRole} onChange={setRole} />
					<Text
						className="font-sans text-[12px] mt-2"
						style={{ color: themeColors.secondary }}
					>
						Passageiro procura e reserva viagens; motorista publica
						viagens e gere reservas. O mesmo perfil serve para
						ambos.
					</Text>
				</View>

				{/* Perfil de motorista */}
				<View className="mt-6">
					<Text
						className="font-sansBold text-[15px] mb-2"
						style={{ color: themeColors.text }}
					>
						Motorista
					</Text>
					<View
						className="rounded-2xl border overflow-hidden"
						style={{
							borderColor: themeColors.border,
							backgroundColor: themeColors.card,
						}}
					>
						<Pressable
							onPress={() => navigation.navigate('Kyc')}
							className="flex-row items-center justify-between px-4 py-3.5 border-b"
							style={{ borderColor: themeColors.border }}
						>
							<Text
								className="font-sansMedium text-[14px]"
								style={{ color: themeColors.text }}
							>
								BI e carta de condução
							</Text>
							<StatusStamp
								status={me?.kyc?.status ?? 'nao_submetido'}
							/>
						</Pressable>
						<Pressable
							onPress={() => navigation.navigate('Vehicle')}
							className="flex-row items-center justify-between px-4 py-3.5"
						>
							<Text
								className="font-sansMedium text-[14px]"
								style={{ color: themeColors.text }}
							>
								Viatura
							</Text>
							<StatusStamp
								status={me?.vehicle?.status ?? 'nao_submetido'}
							/>
						</Pressable>
					</View>
				</View>

				{/* Tema */}
				<View className="mt-6">
					<Text
						className="font-sansBold text-[15px] mb-2"
						style={{ color: themeColors.text }}
					>
						Aparência
					</Text>
					<View
						className="flex-row rounded-full p-1 border"
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
				</View>

				{/* Segurança */}
				<View className="mt-6">
					<Text
						className="font-sansBold text-[15px] mb-2"
						style={{ color: themeColors.text }}
					>
						Segurança
					</Text>
					<Pressable
						onPress={() => navigation.navigate('SosCenter')}
						className="flex-row items-center justify-between px-4 py-3.5 rounded-xl border"
						style={{
							borderColor: themeColors.border,
							backgroundColor: themeColors.card,
						}}
					>
						<View className="flex-row items-center">
							<Ionicons
								name="shield-checkmark-outline"
								size={20}
								color={themeColors.laterite}
							/>
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
							color={themeColors.border}
						/>
					</Pressable>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
