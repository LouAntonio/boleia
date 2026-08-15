import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	ScrollView,
	Pressable,
	ActivityIndicator,
	KeyboardTypeOptions,
	useWindowDimensions,
	LayoutChangeEvent,
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
import PhotoLightbox from '../../components/PhotoLightbox';
import { useSessionUser, useSessionUserId } from '../../hooks/useSessionUser';
import { submitVehicle } from '../../mock/repos/driverRepo';

const CELU = '#F7F3E7';
const BAND_LATERITE = '#B4531F';
const BAND_MATO = '#1F7A5B';
const MAX_PHOTOS = 6;

// Card com banda tingida (viatura/motorista = mato).
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

// Campo de formulário — rótulo mono em `secondary` (a11y), caixa em `background`.
function Field({
	label,
	value,
	setter,
	placeholder,
	autoCapitalize = 'words',
	keyboardType = 'default',
	mono = false,
	className = '',
}: {
	label: string;
	value: string;
	setter: (v: string) => void;
	placeholder: string;
	autoCapitalize?: 'none' | 'words' | 'characters';
	keyboardType?: KeyboardTypeOptions;
	mono?: boolean;
	className?: string;
}) {
	const { themeColors } = useThemeColors();

	return (
		<View className={`flex-1 ${className}`}>
			<Text
				className="font-mono text-[9px] uppercase tracking-[2px] mb-1.5"
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
					autoCapitalize={autoCapitalize}
					keyboardType={keyboardType}
					className={
						mono
							? 'py-3 font-mono text-[15px] uppercase'
							: 'py-3 font-sans text-[15px]'
					}
					style={{ color: themeColors.text }}
				/>
			</View>
		</View>
	);
}

export default function VehicleScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'Vehicle'>
		>();
	const { themeColors } = useThemeColors();
	const me = useSessionUser();
	const sessionUserId = useSessionUserId();

	const [make, setMake] = useState(me?.vehicle?.make ?? '');
	const [model, setModel] = useState(me?.vehicle?.model ?? '');
	const [color, setColor] = useState(me?.vehicle?.color ?? '');
	const [plate, setPlate] = useState(me?.vehicle?.plate ?? '');
	const [seats, setSeats] = useState(String(me?.vehicle?.seats ?? 4));
	const [photos, setPhotos] = useState<string[]>(me?.vehicle?.photos ?? []);
	const [submitting, setSubmitting] = useState(false);
	const [viewing, setViewing] = useState<{
		uri: string;
		label: string;
	} | null>(null);

	// Largura real do ecrã para dimensionar os slots de foto de forma explícita
	// (sem aspectRatio nem largura percentual em filhos de flex-row).
	const { width: winW } = useWindowDimensions();
	const [viewW, setViewW] = useState<number | null>(null);
	const layoutW = viewW ?? winW;
	const slot = Math.min(
		140,
		Math.max(84, Math.floor((layoutW - 72 - 16) / 3)),
	);
	const slotsWidth = slot * 3 + 16;

	const vehicle = me?.vehicle;
	const status = vehicle?.status ?? 'nao_submetido';

	const seatCount = Math.min(30, Math.max(2, Number(seats) || 4));
	const canSubmit =
		make.trim().length > 0 &&
		model.trim().length > 0 &&
		color.trim().length > 0 &&
		plate.trim().length >= 6 &&
		photos.filter(Boolean).length >= 3;

	const pickOne = async (set: (uri: string) => void) => {
		const res = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ['images'],
			quality: 0.6,
		});
		if (!res.canceled) set(res.assets[0].uri);
	};

	const removeAt = (i: number) =>
		setPhotos((prev) => prev.filter((_, j) => j !== i));
	const extraPhotos = photos.slice(3, MAX_PHOTOS);

	const submit = () => {
		if (!canSubmit) return;
		setSubmitting(true);
		submitVehicle(sessionUserId, {
			make,
			model,
			color,
			plate,
			seats: seatCount,
			photos: photos.filter(Boolean),
		});
		setTimeout(() => setSubmitting(false), 300);
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
								className="font-mono text-[9px] uppercase tracking-[3px] ml-1"
								style={{ color: themeColors.secondary }}
							>
								Viatura · Registo
							</Text>
						</View>
						<Text
							className="font-display text-[22px] leading-6"
							style={{ color: themeColors.text }}
						>
							Regista a tua viatura
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
									Viatura verificada
								</Text>
								<Text
									className="font-mono text-[9px] uppercase tracking-[2px] mt-0.5"
									style={{ color: CELU, opacity: 0.85 }}
								>
									Lista para publicar
								</Text>
							</View>
						</View>
						<View className="px-4 py-4">
							<Text
								className="font-sans text-[13px] leading-5"
								style={{ color: themeColors.secondary }}
							>
								Viatura verificada. Já podes publicar viagens a
								partir do painel de motorista.
							</Text>
							<View className="mt-4">
								<BoleiaButton
									title="Voltar ao painel"
									onPress={() => navigation.goBack()}
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
								Estamos a confirmar os dados da viatura. Leva só
								uns segundos neste demo.
							</Text>
						</View>
					</View>
				) : (
					<View>
						<SectionCard
							band={BAND_MATO}
							icon="car-sport-outline"
							title="Dados da viatura"
							subtitle="Características"
						>
							<View className="flex-row mb-3">
								<Field
									label="Marca"
									value={make}
									setter={setMake}
									placeholder="ex.: Toyota"
									className="mr-3"
								/>
								<Field
									label="Modelo"
									value={model}
									setter={setModel}
									placeholder="ex.: Hiace"
								/>
							</View>
							<View className="flex-row mb-3">
								<Field
									label="Cor"
									value={color}
									setter={setColor}
									placeholder="ex.: Branca"
									className="mr-3"
								/>
								<Field
									label={`Lotação (${seatCount})`}
									value={seats}
									setter={(t) =>
										setSeats(
											t.replace(/\D/g, '').slice(0, 2),
										)
									}
									placeholder="ex.: 12"
									keyboardType="numeric"
									mono
								/>
							</View>
							<Field
								label="Matrícula"
								value={plate}
								setter={setPlate}
								placeholder="ex.: LG-12-35-BT"
								autoCapitalize="characters"
								mono
							/>
						</SectionCard>

						<SectionCard
							band={BAND_MATO}
							icon="images-outline"
							title="Fotos da viatura"
							subtitle="Mínimo 3 Fotos"
						>
							<View className="mb-4">
								<ProgressRail
									done={Math.min(
										photos.filter(Boolean).length,
										3,
									)}
									total={3}
								/>
							</View>

							<View
								style={{
									flexDirection: 'row',
									alignSelf: 'center',
									alignItems: 'flex-start',
									marginBottom: 8,
								}}
							>
								{[0, 1, 2].map((i) => (
									<PhotoSlot
										key={i}
										uri={photos[i] ?? null}
										label={`Foto ${i + 1}`}
										size={slot}
										className={i < 2 ? 'mr-2' : ''}
										onView={() =>
											setViewing({
												uri: photos[i] ?? '',
												label: `Foto ${i + 1}`,
											})
										}
										onPick={() =>
											pickOne((u) =>
												setPhotos((prev) =>
													i < prev.length
														? prev.map((p, j) =>
																j === i ? u : p,
															)
														: [...prev, u],
												),
											)
										}
										onRemove={
											photos[i]
												? () => removeAt(i)
												: undefined
										}
									/>
								))}
							</View>

							{extraPhotos.length > 0 ? (
								<View
									style={{
										flexDirection: 'row',
										alignSelf: 'center',
										alignItems: 'flex-start',
										marginBottom: 8,
									}}
								>
									{extraPhotos.map((uri, i) => (
										<PhotoSlot
											key={i + 3}
											uri={uri}
											label={`Foto ${i + 4}`}
											size={slot}
											className={
												i < extraPhotos.length - 1
													? 'mr-2'
													: ''
											}
											onView={() =>
												setViewing({
													uri,
													label: `Foto ${i + 4}`,
												})
											}
											onPick={() =>
												pickOne((u) =>
													setPhotos((prev) =>
														prev.map((p, j) =>
															j === i + 3 ? u : p,
														),
													),
												)
											}
											onRemove={() => removeAt(i + 3)}
										/>
									))}
								</View>
							) : null}

							{photos.length < MAX_PHOTOS ? (
								<Pressable
									onPress={() =>
										pickOne((u) =>
											setPhotos((prev) =>
												prev.length < MAX_PHOTOS
													? [...prev, u]
													: prev,
											),
										)
									}
									className="rounded-2xl border py-3.5 mt-2"
									style={({ pressed }) => ({
										width: slotsWidth,
										alignSelf: 'center',
										flexDirection: 'row',
										alignItems: 'center',
										justifyContent: 'center',
										borderColor: themeColors.border,
										borderStyle: 'dashed',
										backgroundColor: themeColors.card,
										opacity: pressed ? 0.8 : 1,
									})}
								>
									<Ionicons
										name="add"
										size={17}
										color={themeColors.laterite}
									/>
									<Text
										className="font-mono text-[10px] uppercase tracking-[2px] ml-2"
										style={{ color: themeColors.secondary }}
									>
										Adicionar fotos
									</Text>
								</Pressable>
							) : (
								<Text
									className="font-sans text-[11px] mt-2 text-center self-center"
									style={{
										color: themeColors.secondary,
										width: slotsWidth,
									}}
								>
									Máximo de {MAX_PHOTOS} fotos atingido.
								</Text>
							)}
						</SectionCard>

						<BoleiaButton
							title="Registar viatura"
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
