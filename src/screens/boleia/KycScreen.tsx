import React, { useCallback, useState } from 'react';
import {
	View,
	Text,
	ScrollView,
	Pressable,
	ActivityIndicator,
	TextInput,
	Alert,
	useWindowDimensions,
	LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import { onBand } from '../../store/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAppStore } from '../../store/appStore';
import BoleiaButton from '../../components/BoleiaButton';
import PhotoSlot from '../../components/PhotoSlot';
import PhotoLightbox from '../../components/PhotoLightbox';
import {
	ApiKycMe,
	apiErrorMessage,
	getKycMe,
	submitDriverKyc,
	submitPassengerKyc,
	uploadPhoto,
} from '../../lib/api';

type Mode = 'passenger' | 'driver';

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
			className="rounded-xl border overflow-hidden mb-4"
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
					style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
				>
					<Ionicons
						name={icon}
						size={15}
						color={onBand(themeColors, band)}
					/>
				</View>
				<View className="flex-1 ml-2.5">
					<Text
						className="font-sansExtraBold text-label-small"
						style={{ color: onBand(themeColors, band) }}
					>
						{title}
					</Text>
					<Text
						className="font-sansMedium text-body-xs mt-0.5"
						style={{
							color: onBand(themeColors, band),
							opacity: 0.85,
						}}
					>
						{subtitle}
					</Text>
				</View>
			</View>
			<View className="px-4 py-4">{children}</View>
		</View>
	);
}

function Field({
	label,
	value,
	setter,
	placeholder,
}: {
	label: string;
	value: string;
	setter: (v: string) => void;
	placeholder: string;
}) {
	const { themeColors } = useThemeColors();
	return (
		<View className="flex-1 mb-3">
			<Text
				className="font-sansMedium text-body-xs mb-1.5"
				style={{ color: themeColors.secondary }}
			>
				{label}
			</Text>
			<View
				className="rounded-xl border px-3.5"
				style={{
					borderColor: themeColors.border,
					backgroundColor: themeColors.background,
				}}
			>
				<TextInput
					value={value}
					onChangeText={setter}
					placeholder={placeholder}
					placeholderTextColor={themeColors.border}
					autoCapitalize="words"
					className="py-3 font-sans text-label-small"
					style={{ color: themeColors.text }}
				/>
			</View>
		</View>
	);
}

export default function KycScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'Kyc'>
		>();
	const { themeColors } = useThemeColors();
	const currentRole = useAppStore((s) => s.currentRole);

	const [mode, setMode] = useState<Mode>(currentRole);
	const [kyc, setKyc] = useState<ApiKycMe | null>(null);
	const [loading, setLoading] = useState(true);

	const [fullName, setFullName] = useState('');
	const [biNumber, setBiNumber] = useState('');
	const [licenseNumber, setLicenseNumber] = useState('');
	const [selfies, setSelfies] = useState<string[]>(['', '', '']);
	const [biFront, setBiFront] = useState<string | null>(null);
	const [biBack, setBiBack] = useState<string | null>(null);
	const [licensePhoto, setLicensePhoto] = useState<string | null>(null);
	const [bodyPhoto, setBodyPhoto] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [progress, setProgress] = useState('');
	const [viewing, setViewing] = useState<{
		uri: string;
		label: string;
	} | null>(null);

	useFocusEffect(
		useCallback(() => {
			let alive = true;
			setLoading(true);
			getKycMe()
				.then((me) => {
					if (alive) setKyc(me);
				})
				.catch(() => undefined)
				.finally(() => {
					if (alive) setLoading(false);
				});
			return () => {
				alive = false;
			};
		}, []),
	);

	// Largura real do ecrã para dimensionar os slots de foto de forma explícita
	// (sem aspectRatio nem largura percentual em filhos de flex-row).
	const { width: winW } = useWindowDimensions();
	const [viewW, setViewW] = useState<number | null>(null);
	const layoutW = viewW ?? winW;
	const slot = Math.min(
		140,
		Math.max(84, Math.floor((layoutW - 72 - 16) / 3)),
	);

	const state = mode === 'driver' ? kyc?.driver : kyc?.passenger;
	const status = state?.status ?? 'NOT_SUBMITTED';

	const selfieCount = selfies.filter(Boolean).length;
	const canSubmit =
		mode === 'passenger'
			? fullName.trim().length >= 3 &&
				biNumber.trim().length >= 5 &&
				!!biFront &&
				!!biBack &&
				selfieCount >= 2 &&
				!!bodyPhoto
			: fullName.trim().length >= 3 &&
				biNumber.trim().length >= 5 &&
				selfieCount >= 1 &&
				!!biFront &&
				!!biBack;

	const pickOne = async (set: (uri: string) => void) => {
		const res = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ['images'],
			quality: 0.6,
		});
		if (!res.canceled) set(res.assets[0].uri);
	};

	const uploadOne = async (
		uri: string,
		label: string,
		ownerType: 'DRIVER_KYC' | 'PASSENGER_KYC',
		done: number,
		total: number,
	): Promise<string> => {
		setProgress(`A enviar ${label} (${done}/${total})…`);
		return uploadPhoto(uri, ownerType);
	};

	const submit = async () => {
		if (!canSubmit || submitting) return;
		setSubmitting(true);
		try {
			if (mode === 'passenger') {
				const needed = [
					biFront ?? '',
					biBack ?? '',
					...selfies.filter(Boolean),
					bodyPhoto ?? '',
				];
				const total = needed.length;
				let done = 0;
				const biFrontId = await uploadOne(
					biFront ?? '',
					'BI frente',
					'PASSENGER_KYC',
					++done,
					total,
				);
				const biBackId = await uploadOne(
					biBack ?? '',
					'BI verso',
					'PASSENGER_KYC',
					++done,
					total,
				);
				const selfieIds: string[] = [];
				for (const uri of selfies.filter(Boolean)) {
					selfieIds.push(
						await uploadOne(
							uri,
							`selfie ${selfieIds.length + 1}`,
							'PASSENGER_KYC',
							++done,
							total,
						),
					);
				}
				const bodyId = await uploadOne(
					bodyPhoto ?? '',
					'corpo inteiro',
					'PASSENGER_KYC',
					++done,
					total,
				);
				setProgress('A submeter…');
				await submitPassengerKyc({
					fullName: fullName.trim(),
					biNumber: biNumber.trim(),
					mediaIds: {
						biFront: biFrontId,
						biBack: biBackId,
						selfies: selfieIds,
						bodyPhoto: bodyId,
					},
				});
			} else {
				const needed = [
					biFront ?? '',
					biBack ?? '',
					...selfies.filter(Boolean),
					...(licensePhoto ? [licensePhoto] : []),
				];
				const total = needed.length;
				let done = 0;
				const biFrontId = await uploadOne(
					biFront ?? '',
					'BI frente',
					'DRIVER_KYC',
					++done,
					total,
				);
				const biBackId = await uploadOne(
					biBack ?? '',
					'BI verso',
					'DRIVER_KYC',
					++done,
					total,
				);
				const selfieIds: string[] = [];
				for (const uri of selfies.filter(Boolean)) {
					selfieIds.push(
						await uploadOne(
							uri,
							`selfie ${selfieIds.length + 1}`,
							'DRIVER_KYC',
							++done,
							total,
						),
					);
				}
				const licenseId = licensePhoto
					? await uploadOne(
							licensePhoto,
							'carta',
							'DRIVER_KYC',
							++done,
							total,
						)
					: undefined;
				setProgress('A submeter…');
				await submitDriverKyc({
					fullName: fullName.trim(),
					biNumber: biNumber.trim(),
					licenseNumber: licenseNumber.trim() || undefined,
					mediaIds: {
						biFront: biFrontId,
						biBack: biBackId,
						selfies: selfieIds,
						license: licenseId,
					},
				});
			}
			const me = await getKycMe();
			setKyc(me);
		} catch (error) {
			Alert.alert(
				'Verificação',
				apiErrorMessage(error, 'Não foi possível submeter.'),
			);
		} finally {
			setSubmitting(false);
			setProgress('');
		}
	};

	const switchMode = (m: Mode) => {
		if (m === mode || submitting) return;
		setMode(m);
		setFullName('');
		setBiNumber('');
		setLicenseNumber('');
		setSelfies(['', '', '']);
		setBiFront(null);
		setBiBack(null);
		setLicensePhoto(null);
		setBodyPhoto(null);
	};

	return (
		<SafeAreaView
			className="flex-1 px-5"
			style={{ backgroundColor: themeColors.background }}
			onLayout={(e: LayoutChangeEvent) =>
				setViewW(e.nativeEvent.layout.width)
			}
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
								className="font-sansMedium text-body-xs ml-1"
								style={{ color: themeColors.secondary }}
							>
								KYC · Identidade
							</Text>
						</View>
						<Text
							className="font-sansExtraBold text-title-secondary leading-6"
							style={{ color: themeColors.text }}
						>
							Comprova a tua identidade
						</Text>
					</View>
				</View>

				{/* Alternador passageiro / motorista */}
				<View
					className="flex-row rounded-full p-1 border mb-4"
					style={{
						borderColor: themeColors.border,
						backgroundColor: themeColors.card,
					}}
				>
					{(
						[
							{ m: 'passenger', label: 'Passageiro' },
							{ m: 'driver', label: 'Motorista' },
						] as const
					).map((opt) => {
						const active = mode === opt.m;
						return (
							<Pressable
								key={opt.m}
								onPress={() => switchMode(opt.m)}
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
									{opt.label}
								</Text>
							</Pressable>
						);
					})}
				</View>

				{loading ? (
					<View className="items-center py-10">
						<ActivityIndicator color={themeColors.laterite} />
					</View>
				) : status === 'VERIFIED' ? (
					<View
						className="rounded-xl border overflow-hidden"
						style={{
							borderColor: themeColors.border,
							backgroundColor: themeColors.card,
						}}
					>
						<View
							className="px-4 py-3 flex-row items-center"
							style={{ backgroundColor: themeColors.success }}
						>
							<View
								className="w-9 h-9 rounded-full items-center justify-center"
								style={{
									backgroundColor: 'rgba(255,255,255,0.15)',
								}}
							>
								<Ionicons
									name="checkmark"
									size={18}
									color={themeColors.onSuccess}
								/>
							</View>
							<View className="flex-1 ml-3">
								<Text
									className="font-sansExtraBold text-label"
									style={{ color: themeColors.onSuccess }}
								>
									Identidade verificada
								</Text>
								<Text
									className="font-sansMedium text-body-xs mt-0.5"
									style={{
										color: themeColors.onSuccess,
										opacity: 0.85,
									}}
								>
									{mode === 'driver'
										? 'Motorista aprovado'
										: 'Passageiro aprovado'}
								</Text>
							</View>
						</View>
						<View className="px-4 py-4">
							<Text
								className="font-sans text-body-small leading-5"
								style={{ color: themeColors.secondary }}
							>
								{mode === 'driver'
									? 'A tua identidade de motorista está confirmada. Agora regista a viatura para publicar viagens.'
									: 'A tua identidade está confirmada. Já podes pedir boleias.'}
							</Text>
							{mode === 'driver' ? (
								<View className="mt-4">
									<BoleiaButton
										title="Registar viatura"
										onPress={() =>
											navigation.navigate('Vehicle')
										}
										strong
									/>
								</View>
							) : null}
						</View>
					</View>
				) : status === 'PENDING' ? (
					<View
						className="rounded-xl border overflow-hidden"
						style={{
							borderColor: themeColors.border,
							backgroundColor: themeColors.card,
						}}
					>
						<View
							className="px-4 py-3 flex-row items-center"
							style={{ backgroundColor: themeColors.laterite }}
						>
							<View
								className="w-9 h-9 rounded-full items-center justify-center"
								style={{
									backgroundColor: 'rgba(255,255,255,0.15)',
								}}
							>
								<ActivityIndicator
									color={themeColors.onWarning}
									size="small"
								/>
							</View>
							<View className="flex-1 ml-3">
								<Text
									className="font-sansExtraBold text-label"
									style={{ color: themeColors.onWarning }}
								>
									A verificar
								</Text>
								<Text
									className="font-sansMedium text-body-xs mt-0.5"
									style={{
										color: themeColors.onWarning,
										opacity: 0.85,
									}}
								>
									Processo em análise
								</Text>
							</View>
						</View>
						<View className="px-4 py-4">
							<Text
								className="font-sans text-body-small leading-5"
								style={{ color: themeColors.secondary }}
							>
								Estamos a confirmar os teus documentos. Avisamos
								quando estiver pronto.
							</Text>
						</View>
					</View>
				) : (
					<View>
						{status === 'REJECTED' ? (
							<View
								className="rounded-xl border px-4 py-3 mb-4"
								style={{
									borderColor: themeColors.error,
									backgroundColor: themeColors.card,
								}}
							>
								<Text
									className="font-sansBold text-body-small"
									style={{ color: themeColors.error }}
								>
									Submissão recusada
								</Text>
								<Text
									className="font-sans text-body-xs mt-0.5"
									style={{ color: themeColors.secondary }}
								>
									{state?.rejectionReason ??
										'Revê os documentos e volta a submeter.'}
								</Text>
							</View>
						) : null}

						<SectionCard
							band={themeColors.laterite}
							icon="person-outline"
							title="Dados pessoais"
							subtitle={
								mode === 'driver' ? 'Motorista' : 'Passageiro'
							}
						>
							<Field
								label="Nome completo"
								value={fullName}
								setter={setFullName}
								placeholder="Ex.: Lourenço António"
							/>
							<Field
								label="N.º do BI"
								value={biNumber}
								setter={(t) =>
									setBiNumber(
										t
											.toUpperCase()
											.replace(/[^A-Z0-9]/g, ''),
									)
								}
								placeholder="Ex.: 001234567LA040"
							/>
							{mode === 'driver' ? (
								<Field
									label="Carta de condução (opcional)"
									value={licenseNumber}
									setter={setLicenseNumber}
									placeholder="Ex.: AO123456"
								/>
							) : null}
						</SectionCard>

						<SectionCard
							band={themeColors.laterite}
							icon="person-outline"
							title="Rosto"
							subtitle={
								mode === 'passenger' ? '2+ Selfies' : 'Selfies'
							}
						>
							<View
								style={{
									flexDirection: 'row',
									alignSelf: 'center',
									alignItems: 'flex-start',
								}}
							>
								{selfies.map((uri, i) => (
									<PhotoSlot
										key={`selfie-${i}`}
										uri={uri}
										label={`Selfie ${i + 1}`}
										size={slot}
										className={i < 2 ? 'mr-2' : ''}
										onView={() =>
											setViewing({
												uri,
												label: `Selfie ${i + 1}`,
											})
										}
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
							band={themeColors.laterite}
							icon="card-outline"
							title="Bilhete de Identidade"
							subtitle="Frente e Verso"
						>
							<View
								style={{
									flexDirection: 'row',
									alignSelf: 'center',
									alignItems: 'flex-start',
								}}
							>
								<PhotoSlot
									uri={biFront}
									label="Frente"
									size={slot}
									className="mr-2"
									onView={() =>
										setViewing({
											uri: biFront ?? '',
											label: 'BI · Frente',
										})
									}
									onPick={() => pickOne(setBiFront)}
									onRemove={() => setBiFront(null)}
								/>
								<PhotoSlot
									uri={biBack}
									label="Verso"
									size={slot}
									onView={() =>
										setViewing({
											uri: biBack ?? '',
											label: 'BI · Verso',
										})
									}
									onPick={() => pickOne(setBiBack)}
									onRemove={() => setBiBack(null)}
								/>
							</View>
						</SectionCard>

						{mode === 'passenger' ? (
							<SectionCard
								band={themeColors.laterite}
								icon="body-outline"
								title="Corpo inteiro"
								subtitle="1 Foto"
							>
								<View style={{ alignSelf: 'center' }}>
									<PhotoSlot
										uri={bodyPhoto}
										label="Corpo"
										size={slot}
										onView={() =>
											setViewing({
												uri: bodyPhoto ?? '',
												label: 'Corpo inteiro',
											})
										}
										onPick={() => pickOne(setBodyPhoto)}
										onRemove={() => setBodyPhoto(null)}
									/>
								</View>
							</SectionCard>
						) : (
							<SectionCard
								band={themeColors.laterite}
								icon="document-text-outline"
								title="Carta de condução"
								subtitle="Documento"
							>
								<View style={{ alignSelf: 'center' }}>
									<PhotoSlot
										uri={licensePhoto}
										label="Carta"
										size={slot}
										onView={() =>
											setViewing({
												uri: licensePhoto ?? '',
												label: 'Carta de condução',
											})
										}
										onPick={() => pickOne(setLicensePhoto)}
										onRemove={() => setLicensePhoto(null)}
									/>
								</View>
							</SectionCard>
						)}

						{submitting && progress ? (
							<Text
								className="font-sans text-body-xs mb-3 text-center"
								style={{ color: themeColors.secondary }}
							>
								{progress}
							</Text>
						) : (
							<Text
								className="font-sans text-body-xs leading-5 mb-4"
								style={{ color: themeColors.secondary }}
							>
								{mode === 'passenger'
									? 'Passageiro: nome, BI (frente e verso), 2 selfies e 1 foto de corpo inteiro.'
									: 'Motorista: nome, BI, selfie e carta de condução. A viatura regista-se a seguir.'}
							</Text>
						)}

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
			<PhotoLightbox
				uri={viewing?.uri ?? null}
				label={viewing?.label}
				onClose={() => setViewing(null)}
			/>
		</SafeAreaView>
	);
}
