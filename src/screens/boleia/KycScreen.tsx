import React, { useState } from 'react';
import {
	View,
	Text,
	ScrollView,
	Pressable,
	ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import BoleiaButton from '../../components/BoleiaButton';
import PhotoSlot, { ProgressRail } from '../../components/PhotoSlot';
import { useDbStore } from '../../mock/db';
import { submitKyc } from '../../mock/repos/driverRepo';

const CELU = '#F7F3E7';
const BAND_LATERITE = '#B4531F';
const BAND_MATO = '#1F7A5B';

// Card com banda tingida (identidade = laterite; verificado = mato).
function SectionCard({
	band,
	icon,
	title,
	subtitle,
	children,
}: {
	band: string;
	icon: React.ComponentProps<typeof Ionicons>['name'];
	title: string;
	subtitle: string;
	children: React.ReactNode;
}) {
	const { themeColors } = useThemeColors();

	return (
		<View
			className="rounded-3xl border overflow-hidden mb-4"
			style={{
				borderColor: themeColors.border,
				backgroundColor: themeColors.card,
			}}
		>
			<View
				className="flex-row items-center px-4 py-2.5"
				style={{ backgroundColor: band }}
			>
				<View
					className="w-7 h-7 rounded-full items-center justify-center"
					style={{ backgroundColor: `${CELU}26` }}
				>
					<Ionicons name={icon} size={15} color={CELU} />
				</View>
				<View className="flex-1 ml-2.5">
					<Text
						className="font-display text-[15px]"
						style={{ color: CELU }}
					>
						{title}
					</Text>
					<Text
						className="font-mono text-[8px] uppercase tracking-[2px] mt-0.5"
						style={{ color: CELU, opacity: 0.85 }}
					>
						{subtitle}
					</Text>
				</View>
			</View>
			<View className="px-4 py-4">{children}</View>
		</View>
	);
}

export default function KycScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'Kyc'>
		>();
	const { themeColors } = useThemeColors();
	const me = useDbStore((s) => s.db.users.find((u) => u.id === 'u_me_001'));

	const [selfies, setSelfies] = useState<string[]>(() => {
		const s = me?.kyc?.selfies ?? [];
		return [s[0] ?? '', s[1] ?? '', s[2] ?? ''];
	});
	const [biFront, setBiFront] = useState<string | null>(
		me?.kyc?.biFrontUri ?? null,
	);
	const [biBack, setBiBack] = useState<string | null>(
		me?.kyc?.biBackUri ?? null,
	);
	const [licensePhoto, setLicensePhoto] = useState<string | null>(
		me?.kyc?.licensePhotoUri ?? null,
	);
	const [submitting, setSubmitting] = useState(false);

	const kyc = me?.kyc;
	const status = kyc?.status ?? 'nao_submetido';

	const totalFotos =
		selfies.filter(Boolean).length +
		(biFront ? 1 : 0) +
		(biBack ? 1 : 0) +
		(licensePhoto ? 1 : 0);
	const canSubmit = totalFotos === 6;

	const pickOne = async (set: (uri: string) => void) => {
		const res = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ['images'],
			quality: 0.6,
		});
		if (!res.canceled) set(res.assets[0].uri);
	};

	const submit = () => {
		if (!canSubmit) return;
		setSubmitting(true);
		submitKyc('u_me_001', {
			selfies: selfies.filter(Boolean),
			biFrontUri: biFront ?? '',
			biBackUri: biBack ?? '',
			licensePhotoUri: licensePhoto ?? '',
		});
		setTimeout(() => setSubmitting(false), 300);
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
				<View className="flex-row items-center pt-1 pb-4">
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
						<View className="flex-row items-center mb-1">
							<Ionicons
								name="checkmark-circle"
								size={11}
								color={themeColors.laterite}
							/>
							<Text
								className="font-mono text-[9px] uppercase tracking-[3px] ml-1"
								style={{ color: themeColors.secondary }}
							>
								KYC · Identidade
							</Text>
						</View>
						<Text
							className="font-display text-[22px] leading-6"
							style={{ color: themeColors.text }}
						>
							Comprova a tua identidade
						</Text>
					</View>
				</View>

				{status === 'verificado' ? (
					<View
						className="rounded-3xl border overflow-hidden"
						style={{
							borderColor: themeColors.border,
							backgroundColor: themeColors.card,
						}}
					>
						<View
							className="px-4 py-3 flex-row items-center"
							style={{ backgroundColor: BAND_MATO }}
						>
							<View
								className="w-9 h-9 rounded-full items-center justify-center"
								style={{ backgroundColor: `${CELU}26` }}
							>
								<Ionicons
									name="checkmark"
									size={18}
									color={CELU}
								/>
							</View>
							<View className="flex-1 ml-3">
								<Text
									className="font-display text-[16px]"
									style={{ color: CELU }}
								>
									Identidade verificada
								</Text>
								<Text
									className="font-mono text-[9px] uppercase tracking-[2px] mt-0.5"
									style={{ color: CELU, opacity: 0.85 }}
								>
									Documentos aprovados
								</Text>
							</View>
						</View>
						<View className="px-4 py-4">
							<Text
								className="font-sans text-[13px] leading-5"
								style={{ color: themeColors.secondary }}
							>
								A tua identidade está confirmada. Agora registas
								a viatura para publicar viagens.
							</Text>
							<View className="mt-4">
								<BoleiaButton
									title="Registar viatura"
									onPress={() =>
										navigation.navigate('Vehicle')
									}
									strong
								/>
							</View>
						</View>
					</View>
				) : status === 'pendente' ? (
					<View
						className="rounded-3xl border overflow-hidden"
						style={{
							borderColor: themeColors.border,
							backgroundColor: themeColors.card,
						}}
					>
						<View
							className="px-4 py-3 flex-row items-center"
							style={{ backgroundColor: BAND_LATERITE }}
						>
							<View
								className="w-9 h-9 rounded-full items-center justify-center"
								style={{ backgroundColor: `${CELU}26` }}
							>
								<ActivityIndicator color={CELU} size="small" />
							</View>
							<View className="flex-1 ml-3">
								<Text
									className="font-display text-[16px]"
									style={{ color: CELU }}
								>
									A verificar
								</Text>
								<Text
									className="font-mono text-[9px] uppercase tracking-[2px] mt-0.5"
									style={{ color: CELU, opacity: 0.85 }}
								>
									Processo em análise
								</Text>
							</View>
						</View>
						<View className="px-4 py-4">
							<Text
								className="font-sans text-[13px] leading-5"
								style={{ color: themeColors.secondary }}
							>
								Estamos a confirmar os teus documentos. Leva só
								uns segundos neste demo.
							</Text>
						</View>
					</View>
				) : (
					<View>
						<View className="mb-4">
							<ProgressRail done={totalFotos} total={6} />
						</View>

						<SectionCard
							band={BAND_LATERITE}
							icon="person-outline"
							title="Rosto"
							subtitle="3 Selfies"
						>
							<View className="flex-row w-full max-w-[300px] self-center">
								{selfies.map((uri, i) => (
									<PhotoSlot
										key={`selfie-${i}`}
										uri={uri}
										label={`Selfie ${i + 1}`}
										className={`flex-1 ${
											i < 2 ? 'mr-2' : ''
										}`}
										onPick={() =>
											pickOne((u) =>
												setSelfies((prev) =>
													prev.map((p, j) =>
														j === i ? u : p,
													),
												),
											)
										}
										onRemove={() =>
											setSelfies((prev) =>
												prev.map((p, j) =>
													j === i ? '' : p,
												),
											)
										}
									/>
								))}
							</View>
						</SectionCard>

						<SectionCard
							band={BAND_LATERITE}
							icon="card-outline"
							title="Bilhete de Identidade"
							subtitle="Frente e Verso"
						>
							<View className="flex-row w-full max-w-[220px] self-center">
								<PhotoSlot
									uri={biFront}
									label="Frente"
									className="flex-1 mr-2"
									onPick={() => pickOne(setBiFront)}
									onRemove={() => setBiFront(null)}
								/>
								<PhotoSlot
									uri={biBack}
									label="Verso"
									className="flex-1"
									onPick={() => pickOne(setBiBack)}
									onRemove={() => setBiBack(null)}
								/>
							</View>
						</SectionCard>

						<SectionCard
							band={BAND_LATERITE}
							icon="document-text-outline"
							title="Carta de condução"
							subtitle="Documento"
						>
							<PhotoSlot
								uri={licensePhoto}
								label="Carta"
								className="self-center w-full max-w-[320px]"
								onPick={() => pickOne(setLicensePhoto)}
								onRemove={() => setLicensePhoto(null)}
								wide
							/>
						</SectionCard>

						<Text
							className="font-sans text-[12px] leading-5 mb-4"
							style={{ color: themeColors.secondary }}
						>
							Só precisamos destas fotos. Nada mais é pedido.
						</Text>

						<BoleiaButton
							title="Enviar para verificação"
							onPress={submit}
							loading={submitting}
							disabled={!canSubmit}
							strong
						/>
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}
