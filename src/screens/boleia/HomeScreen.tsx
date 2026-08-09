import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAppStore } from '../../store/appStore';
import { useDbStore } from '../../mock/db';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import RoleSwitch from '../../components/RoleSwitch';
import TripStripCard from '../../components/TripStripCard';
import SectionTitle from '../../components/SectionTitle';

function BrandHeader({ role }: { role: 'passenger' | 'driver' }) {
	const { themeColors } = useThemeColors();
	return (
		<View className="mb-4">
			<View className="flex-row items-baseline">
				<Text
					className="font-display text-[28px]"
					style={{ color: themeColors.text }}
				>
					Boleia
				</Text>
				<Text
					className="font-mono text-[11px] ml-2"
					style={{ color: themeColors.laterite }}
				>
					{role === 'passenger' ? 'PASSAGEIRO' : 'MOTORISTA'}
				</Text>
			</View>
			<Text
				className="font-sans text-[13px] -mt-0.5"
				style={{ color: themeColors.secondary }}
			>
				Viagens partilhadas entre províncias, a preço de boleia.
			</Text>
		</View>
	);
}

export default function HomeScreen() {
	const { themeColors } = useThemeColors();
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'Main'>
		>();
	const currentRole = useAppStore((s) => s.currentRole);
	const setRole = useAppStore((s) => s.setRole);
	const featured = useDbStore((s) =>
		s.db.rides.find((r) => r.id === 'ride_paulo_amanha'),
	);
	const me = useDbStore((s) => s.db.users.find((u) => u.id === 'u_me_001'));
	const kycOk = me?.kyc?.status === 'verificado';
	const vehicleOk = me?.vehicle?.status === 'verificado';

	return (
		<SafeAreaView
			className="flex-1"
			style={{ backgroundColor: themeColors.background }}
		>
			<ScrollView
				className="flex-1 px-5"
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				<BrandHeader role={currentRole} />

				<RoleSwitch value={currentRole} onChange={setRole} />

				{currentRole === 'passenger' ? (
					<View className="mt-6">
						<SectionTitle tone="laterite">
							Na estrada amanhã
						</SectionTitle>
						{featured ? (
							<TripStripCard ride={featured} />
						) : (
							<Text
								className="font-sans text-[13px]"
								style={{ color: themeColors.secondary }}
							>
								Sem viagens disponíveis agora.
							</Text>
						)}
						<Text
							className="font-sans text-[13px] mt-4 leading-5"
							style={{ color: themeColors.secondary }}
						>
							Usa a aba{' '}
							<Text
								className="font-sansBold"
								style={{ color: themeColors.text }}
							>
								Pesquisar
							</Text>{' '}
							para pedir uma boleia e esperar por um motorista na
							tua rota.
						</Text>
					</View>
				) : (
					<View className="mt-6">
						<SectionTitle tone="laterite">
							Painel de motorista
						</SectionTitle>

						{!kycOk ? (
							<View
								className="p-4 rounded-2xl border"
								style={{
									borderColor: themeColors.laterite,
									backgroundColor: themeColors.card,
								}}
							>
								<Text
									className="font-sansBold text-[15px]"
									style={{ color: themeColors.text }}
								>
									Perfil de motorista incompleto
								</Text>
								<Text
									className="font-sans text-[13px] mt-1 leading-5"
									style={{ color: themeColors.secondary }}
								>
									Para publicar viagens precisas de verificar
									o teu Bilhete de Identidade e registar a tua
									viatura. Demora cerca de 5 minutos.
								</Text>
								<View className="mt-4 flex-row">
									<Pressable
										onPress={() =>
											navigation.navigate('Kyc')
										}
										className="flex-1 items-center py-2.5 rounded-xl border"
										style={{
											borderColor: themeColors.laterite,
										}}
									>
										<Text
											className="font-sansBold text-[13px]"
											style={{
												color: themeColors.laterite,
											}}
										>
											1 · BI e carta
										</Text>
									</Pressable>
									<Pressable
										onPress={() =>
											navigation.navigate('Vehicle')
										}
										className="flex-1 items-center ml-2 py-2.5 rounded-xl border"
										style={{
											borderColor: themeColors.laterite,
										}}
									>
										<Text
											className="font-sansBold text-[13px]"
											style={{
												color: themeColors.laterite,
											}}
										>
											2 · Viatura
										</Text>
									</Pressable>
								</View>
							</View>
						) : (
							<View>
								{!vehicleOk ? (
									<View
										className="p-4 rounded-2xl border"
										style={{
											borderColor: themeColors.laterite,
											backgroundColor: themeColors.card,
										}}
									>
										<Text
											className="font-sansBold text-[15px]"
											style={{ color: themeColors.text }}
										>
											Falta a tua viatura
										</Text>
										<Text
											className="font-sans text-[13px] mt-1 leading-5"
											style={{
												color: themeColors.secondary,
											}}
										>
											Regista a viatura para poderes
											publicar as primeiras viagens.
										</Text>
										<Pressable
											onPress={() =>
												navigation.navigate('Vehicle')
											}
											className="mt-3 items-center py-2.5 rounded-xl border"
											style={{
												borderColor:
													themeColors.laterite,
											}}
										>
											<Text
												className="font-sansBold text-[13px]"
												style={{
													color: themeColors.laterite,
												}}
											>
												Registar viatura
											</Text>
										</Pressable>
									</View>
								) : (
									<Text
										className="font-sans text-[13px]"
										style={{ color: themeColors.secondary }}
									>
										Perfil verificado. Publica a tua próxima
										viagem na aba Publicar.
									</Text>
								)}
							</View>
						)}
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}
