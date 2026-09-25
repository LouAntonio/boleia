import React, { useCallback, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useSessionUser } from '../../hooks/useSessionUser';
import { Eligibility, fetchEligibility } from '../../lib/eligibility';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import GroupLabel from '../../components/GroupLabel';

import Card from '../../components/Card';
import StatusStamp from '../../components/StatusStamp';
import BoleiaButton from '../../components/BoleiaButton';

export default function PublishScreen() {
	const { themeColors } = useThemeColors();
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'Main'>
		>();
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
	const ready = !!(kycOk && vehicleOk);
	const kycStamp = !elig?.loaded
		? (me?.kyc?.status ?? 'nao_submetido')
		: !elig.kycDriver
			? 'nao_submetido'
			: elig.kycDriver.status === 'VERIFIED'
				? 'verificado'
				: elig.kycDriver.status === 'PENDING'
					? 'pendente'
					: 'recusado';
	const vehicleStamp = !elig?.loaded
		? (me?.vehicle?.status ?? 'nao_submetido')
		: elig.verifiedVehicles.length > 0
			? 'verificado'
			: elig.vehicles.length > 0
				? 'pendente'
				: 'nao_submetido';

	return (
		<SafeAreaView
			className="flex-1 px-5"
			style={{ backgroundColor: themeColors.background }}
		>
			<View className="mt-2">
				<GroupLabel>Motorista verificado</GroupLabel>
				<Text
					className="font-sansExtraBold text-title-secondary mt-1"
					style={{ color: themeColors.text }}
				>
					Publicar viagem
				</Text>
			</View>

			{kycOk && vehicleOk ? (
				<View className="mt-4">
					<Card tone="success" padded={false}>
						<View className="p-5">
							<View
								className="w-12 h-12 rounded-full items-center justify-center mb-3"
								style={{
									backgroundColor: themeColors.background,
								}}
							>
								<Ionicons
									name="checkmark-circle-outline"
									size={26}
									color={themeColors.mato}
								/>
							</View>
							<Text
								className="font-sansBold text-label"
								style={{ color: themeColors.text }}
							>
								Pronto a publicar
							</Text>
							<Text
								className="font-sans text-body-small mt-1 leading-5"
								style={{ color: themeColors.secondary }}
							>
								Monta a tua viagem: rota, dia, hora, preço e
								lugares.
							</Text>
							<View className="mt-4">
								<BoleiaButton
									title="Publicar viagem agora"
									onPress={() =>
										navigation.navigate('PublishTrip')
									}
								/>
							</View>
						</View>
					</Card>
				</View>
			) : (
				<View className="mt-4">
					<Card tone="warning" padded={false}>
						<View className="p-5">
							<View
								className="w-12 h-12 rounded-full items-center justify-center mb-3"
								style={{
									backgroundColor: themeColors.background,
								}}
							>
								<Ionicons
									name="shield-checkmark-outline"
									size={26}
									color={themeColors.laterite}
								/>
							</View>
							<Text
								className="font-sansBold text-label"
								style={{ color: themeColors.text }}
							>
								Só motoristas verificados publicam
							</Text>
							<Text
								className="font-sans text-body-small mt-1 leading-5"
								style={{ color: themeColors.secondary }}
							>
								Antes de publicar viagens, completa o teu perfil
								de motorista.
							</Text>

							<View className="mt-4">
								<Pressable
									onPress={() => navigation.navigate('Kyc')}
									disabled={ready}
									className="flex-row items-center justify-between py-3 border-b"
									style={{ borderColor: themeColors.border }}
								>
									<Text
										className="font-sansMedium text-body-small"
										style={{ color: themeColors.text }}
									>
										1 · BI e carta de condução
									</Text>
									<StatusStamp status={kycStamp} />
								</Pressable>
								<Pressable
									onPress={() =>
										navigation.navigate('Vehicle')
									}
									disabled={ready}
									className="flex-row items-center justify-between py-3 mt-1"
								>
									<Text
										className="font-sansMedium text-body-small"
										style={{ color: themeColors.text }}
									>
										2 · Viatura
									</Text>
									<StatusStamp status={vehicleStamp} />
								</Pressable>
							</View>
						</View>
					</Card>
				</View>
			)}
		</SafeAreaView>
	);
}
