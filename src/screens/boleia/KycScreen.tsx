import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	ScrollView,
	Image,
	Pressable,
	ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import BoleiaButton from '../../components/BoleiaButton';
import StatusStamp from '../../components/StatusStamp';
import { useDbStore } from '../../mock/db';
import { submitKyc } from '../../mock/repos/driverRepo';

export default function KycScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'Kyc'>
		>();
	const { themeColors } = useThemeColors();
	const me = useDbStore((s) => s.db.users.find((u) => u.id === 'u_me_001'));

	const [biNumber, setBiNumber] = useState(me?.kyc?.biNumber ?? '');
	const [licenseNumber, setLicenseNumber] = useState(
		me?.kyc?.licenseNumber ?? '',
	);
	const [licenseExpiry, setLicenseExpiry] = useState(
		me?.kyc?.licenseExpiry ?? '',
	);
	const [photoUri, setPhotoUri] = useState<string | null>(
		me?.kyc?.biPhotoUri ?? null,
	);
	const [submitting, setSubmitting] = useState(false);

	const kyc = me?.kyc;
	const status = kyc?.status ?? 'nao_submetido';

	const canSubmit =
		biNumber.trim().length >= 8 &&
		licenseNumber.trim().length >= 4 &&
		licenseExpiry.trim().length === 10;

	const pickPhoto = async () => {
		const res = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ['images'],
			quality: 0.6,
		});
		if (!res.canceled) setPhotoUri(res.assets[0].uri);
	};

	const submit = () => {
		if (!canSubmit) return;
		setSubmitting(true);
		submitKyc('u_me_001', {
			biNumber,
			licenseNumber,
			licenseExpiry: licenseExpiry.trim(),
			biPhotoUri: photoUri,
		});
		setTimeout(() => setSubmitting(false), 300);
	};

	const label = (text: string) => (
		<Text
			className="font-sansMedium text-[12px] uppercase tracking-wider mb-1.5"
			style={{ color: themeColors.laterite }}
		>
			{text}
		</Text>
	);

	const input = (
		value: string,
		setter: (v: string) => void,
		placeholder = '',
		autoCapitalize: 'none' | 'characters' = 'none',
	) => (
		<View
			className="rounded-xl border px-3.5 mb-4"
			style={{
				borderColor: themeColors.border,
				backgroundColor: themeColors.card,
			}}
		>
			<TextInput
				value={value}
				onChangeText={setter}
				placeholder={placeholder}
				placeholderTextColor={themeColors.border}
				autoCapitalize={autoCapitalize}
				className="py-3 font-mono text-[15px]"
				style={{ color: themeColors.text }}
			/>
		</View>
	);

	return (
		<SafeAreaView
			className="flex-1"
			style={{ backgroundColor: themeColors.background }}
		>
			<ScrollView
				className="flex-1 px-5 pt-12"
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				<View className="flex-row items-center justify-between mb-4">
					<Text
						className="font-display text-[22px]"
						style={{ color: themeColors.text }}
					>
						Identidade (KYC)
					</Text>
					{status !== 'nao_submetido' && (
						<StatusStamp status={status} />
					)}
				</View>

				{status === 'verificado' ? (
					<View>
						<Text
							className="font-sans text-[14px] leading-6"
							style={{ color: themeColors.secondary }}
						>
							O teu BI e carta estão verificados. Falta registar a
							viatura para publicar viagens.
						</Text>
						<View className="mt-6">
							<BoleiaButton
								title="Registar viatura"
								onPress={() => navigation.navigate('Vehicle')}
							/>
						</View>
					</View>
				) : status === 'pendente' ? (
					<View className="items-center py-10">
						<ActivityIndicator color={themeColors.laterite} />
						<Text
							className="font-sans mt-4"
							style={{ color: themeColors.secondary }}
						>
							A verificar o teu documento… (demo)
						</Text>
					</View>
				) : (
					<View>
						<Text
							className="font-sans text-[14px] leading-6 mb-6"
							style={{ color: themeColors.secondary }}
						>
							Para publicar viagens tens de comprovar a tua
							identidade. A verificação é automática neste demo.
						</Text>

						{label('Bilhete de Identidade')}
						{input(
							biNumber,
							setBiNumber,
							'ex.: 003456789LA045',
							'characters',
						)}

						{label('Foto do BI (opcional)')}
						<Pressable
							onPress={pickPhoto}
							className="rounded-xl border items-center justify-center mb-4 overflow-hidden"
							style={{
								borderColor: themeColors.border,
								backgroundColor: themeColors.card,
								height: 120,
							}}
						>
							{photoUri ? (
								<Image
									source={{ uri: photoUri }}
									className="w-full h-full"
									resizeMode="cover"
								/>
							) : (
								<Text
									className="font-sans text-[13px]"
									style={{ color: themeColors.secondary }}
								>
									+ Selecionar foto
								</Text>
							)}
						</Pressable>

						{label('Carta de condução (nº)')}
						{input(
							licenseNumber,
							setLicenseNumber,
							'ex.: L-103456',
						)}

						{label('Validade da carta')}
						{input(
							licenseExpiry,
							setLicenseExpiry,
							'ex.: 2028-04-30',
						)}

						<BoleiaButton
							title="Enviar para verificação"
							onPress={submit}
							loading={submitting}
							disabled={!canSubmit}
						/>
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}
