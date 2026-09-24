import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useSessionUser } from '../../hooks/useSessionUser';
import { Eligibility, fetchEligibility } from '../../lib/eligibility';
import { useAppStore } from '../../store/appStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import AdCarousel from '../../components/AdCarousel';
import TripSearch from '../../components/TripSearch';
import SectionTitle from '../../components/SectionTitle';

function BrandHeader({
	role,
	name,
}: {
	role: 'passenger' | 'driver';
	name?: string;
}) {
	const { themeColors } = useThemeColors();
	const hour = new Date().getHours();
	const greeting =
		hour < 12 ? 'Bom dia' : hour < 19 ? 'Boa tarde' : 'Boa noite';
	const dateLabel = new Date()
		.toLocaleDateString('pt-PT', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
		})
		.toUpperCase();
	return (
		<View className="mb-5">
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
				className="font-sansBold text-[16px]"
				style={{ color: themeColors.text }}
			>
				{greeting}, {name ?? 'viajante'}.
			</Text>
			<Text
				className="font-sans text-[13px] -mt-0.5"
				style={{ color: themeColors.secondary }}
			>
				Viagens partilhadas entre províncias, a preço de boleia.
			</Text>
			<Text
				className="font-mono text-[10px] uppercase tracking-[2px] mt-1"
				style={{ color: themeColors.border }}
			>
				{dateLabel}
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
	const me = useSessionUser();
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
	const kycOk = elig?.loaded
		? elig.kycDriver?.status === 'VERIFIED'
		: me?.kyc?.status === 'verificado';
	const vehicleOk = elig?.loaded
		? elig.verifiedVehicles.length > 0
		: me?.vehicle?.status === 'verificado';

	return (
		<SafeAreaView
			className="flex-1"
			style={{ backgroundColor: themeColors.background }}
		>
			<ScrollView
				className="flex-1 px-5"
				contentContainerStyle={{ paddingBottom: 40 }}
				keyboardShouldPersistTaps="handled"
			>
				<BrandHeader
					role={currentRole}
					name={
						me
							? `${me.firstName}${me.lastName ? ` ${me.lastName}` : ''}`
							: undefined
					}
				/>

				<AdCarousel />

				{currentRole === 'passenger' ? (
					<TripSearch />
				) : (
					<View>
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
