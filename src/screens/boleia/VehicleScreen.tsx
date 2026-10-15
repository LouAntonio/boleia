import React, { useCallback, useState } from 'react';
import {
	View,
	Text,
	TextInput,
	ScrollView,
	Pressable,
	ActivityIndicator,
	Alert,
	KeyboardTypeOptions,
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
import BackButton from '../../components/BackButton';
import BoleiaButton from '../../components/BoleiaButton';
import PhotoSlot, { ProgressRail } from '../../components/PhotoSlot';
import PhotoLightbox from '../../components/PhotoLightbox';
import {
	ApiVehicle,
	apiErrorMessage,
	createVehicle,
	deleteVehicle,
	listMyVehicles,
	uploadPhoto,
} from '../../lib/api';

const MAX_PHOTOS = 6;

// Card com banda tingida (viatura/motorista = success).
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

// Campo de formulário — rótulo em `secondary`, caixa em `background`.
function Field({
	label,
	value,
	setter,
	placeholder,
	autoCapitalize = 'words',
	keyboardType = 'default',
	className = '',
}: {
	label: string;
	value: string;
	setter: (v: string) => void;
	placeholder: string;
	autoCapitalize?: 'none' | 'words' | 'characters';
	keyboardType?: KeyboardTypeOptions;
	className?: string;
}) {
	const { themeColors } = useThemeColors();

	return (
		<View className={`flex-1 ${className}`}>
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
					autoCapitalize={autoCapitalize}
					keyboardType={keyboardType}
					className="py-3 font-sans text-label-small"
					style={{ color: themeColors.text }}
				/>
			</View>
		</View>
	);
}

function statusLabel(status: ApiVehicle['status']): string {
	if (status === 'VERIFIED') return 'Verificada';
	if (status === 'PENDING') return 'Em análise';
	if (status === 'REJECTED') return 'Recusada';
	return 'Por submeter';
}

export default function VehicleScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'Vehicle'>
		>();
	const { themeColors } = useThemeColors();

	const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);
	const [loading, setLoading] = useState(true);
	const [adding, setAdding] = useState(false);

	const [make, setMake] = useState('');
	const [model, setModel] = useState('');
	const [color, setColor] = useState('');
	const [plate, setPlate] = useState('');
	const [seats, setSeats] = useState('4');
	const [photos, setPhotos] = useState<string[]>([]);
	const [submitting, setSubmitting] = useState(false);
	const [progress, setProgress] = useState('');
	const [viewing, setViewing] = useState<{
		uri: string;
		label: string;
	} | null>(null);

	const reload = useCallback(async () => {
		try {
			setVehicles(await listMyVehicles());
		} catch (error) {
			Alert.alert(
				'Viaturas',
				apiErrorMessage(error, 'Não foi possível carregar.'),
			);
		} finally {
			setLoading(false);
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			setLoading(true);
			reload();
		}, [reload]),
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
	const slotsWidth = slot * 3 + 16;

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

	const resetForm = () => {
		setMake('');
		setModel('');
		setColor('');
		setPlate('');
		setSeats('4');
		setPhotos([]);
		setAdding(false);
	};

	const submit = async () => {
		if (!canSubmit || submitting) return;
		setSubmitting(true);
		try {
			const uris = photos.filter(Boolean);
			const photoIds: string[] = [];
			for (const uri of uris) {
				setProgress(
					`A enviar foto ${photoIds.length + 1}/${uris.length}…`,
				);
				photoIds.push(await uploadPhoto(uri, 'VEHICLE'));
			}
			setProgress('A registar…');
			await createVehicle({
				make: make.trim(),
				model: model.trim(),
				color: color.trim(),
				plate: plate.trim().toUpperCase(),
				seats: seatCount,
				photoIds,
			});
			resetForm();
			await reload();
		} catch (error) {
			Alert.alert(
				'Viatura',
				apiErrorMessage(error, 'Não foi possível registar.'),
			);
		} finally {
			setSubmitting(false);
			setProgress('');
		}
	};

	const remove = (id: string, label: string) => {
		Alert.alert(
			'Remover viatura',
			`Remover ${label}? Só é possível se não tiver corridas associadas.`,
			[
				{ text: 'Cancelar', style: 'cancel' },
				{
					text: 'Remover',
					style: 'destructive',
					onPress: async () => {
						try {
							await deleteVehicle(id);
							await reload();
						} catch (error) {
							Alert.alert(
								'Viatura',
								apiErrorMessage(
									error,
									'Não foi possível remover.',
								),
							);
						}
					},
				},
			],
		);
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
				showsVerticalScrollIndicator={false}
			>
				<View className="flex-row items-center pt-1 pb-4">
					<BackButton onPress={() => navigation.goBack()} />
					<View className="flex-1">
						<View className="flex-row items-center mb-1">
							<Ionicons
								name="checkmark-circle"
								size={11}
								color={themeColors.secondary}
							/>
							<Text
								className="font-sansMedium text-body-xs ml-1"
								style={{ color: themeColors.secondary }}
							>
								Viaturas · Registo
							</Text>
						</View>
						<Text
							className="font-sansExtraBold text-title-secondary leading-6"
							style={{ color: themeColors.text }}
						>
							As tuas viaturas
						</Text>
					</View>
				</View>

				{loading ? (
					<View className="items-center py-10">
						<ActivityIndicator color={themeColors.primary} />
					</View>
				) : (
					<View>
						{vehicles.map((v) => {
							const verified = v.status === 'VERIFIED';
							return (
								<View
									key={v.id}
									className="rounded-xl border overflow-hidden mb-4"
									style={{
										borderColor: themeColors.border,
										backgroundColor: themeColors.card,
									}}
								>
									<View
										className="px-4 py-3 flex-row items-center"
										style={{
											backgroundColor: verified
												? themeColors.success
												: themeColors.laterite,
										}}
									>
										<View
											className="w-9 h-9 rounded-full items-center justify-center"
											style={{
												backgroundColor:
													'rgba(255,255,255,0.15)',
											}}
										>
											<Ionicons
												name={
													verified
														? 'checkmark'
														: 'time-outline'
												}
												size={18}
												color={
													verified
														? themeColors.onSuccess
														: themeColors.onWarning
												}
											/>
										</View>
										<View className="flex-1 ml-3">
											<Text
												className="font-sansExtraBold text-label"
												style={{
													color: verified
														? themeColors.onSuccess
														: themeColors.onWarning,
												}}
											>
												{v.make} {v.model} · {v.plate}
											</Text>
											<Text
												className="font-sansMedium text-body-xs mt-0.5"
												style={{
													color: verified
														? themeColors.onSuccess
														: themeColors.onWarning,
													opacity: 0.85,
												}}
											>
												{statusLabel(v.status)} ·{' '}
												{v.seats} lugares
											</Text>
										</View>
										<Pressable
											onPress={() =>
												remove(
													v.id,
													`${v.make} ${v.model}`,
												)
											}
											hitSlop={8}
										>
											<Ionicons
												name="trash-outline"
												size={18}
												color={
													verified
														? themeColors.onSuccess
														: themeColors.onWarning
												}
											/>
										</Pressable>
									</View>
									<View className="px-4 py-3">
										<Text
											className="font-sans text-body-small"
											style={{
												color: themeColors.secondary,
											}}
										>
											{v.color}
											{verified
												? ' — pronta para publicar viagens.'
												: ' — em análise pela equipa Boleia.'}
										</Text>
									</View>
								</View>
							);
						})}

						{adding ? (
							<View>
								<SectionCard
									band={themeColors.success}
									icon="car-sport-outline"
									title="Nova viatura"
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
													t
														.replace(/\D/g, '')
														.slice(0, 2),
												)
											}
											placeholder="ex.: 12"
											keyboardType="numeric"
										/>
									</View>
									<Field
										label="Matrícula"
										value={plate}
										setter={setPlate}
										placeholder="ex.: LD-12-34-AB"
										autoCapitalize="characters"
									/>
								</SectionCard>

								<SectionCard
									band={themeColors.success}
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
																? prev.map(
																		(
																			p,
																			j,
																		) =>
																			j ===
																			i
																				? u
																				: p,
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
														i <
														extraPhotos.length - 1
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
																prev.map(
																	(p, j) =>
																		j ===
																		i + 3
																			? u
																			: p,
																),
															),
														)
													}
													onRemove={() =>
														removeAt(i + 3)
													}
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
											className="rounded-xl border py-3.5 mt-2"
											style={({ pressed }) => ({
												width: slotsWidth,
												alignSelf: 'center',
												flexDirection: 'row',
												alignItems: 'center',
												justifyContent: 'center',
												borderColor: themeColors.border,
												borderStyle: 'dashed',
												backgroundColor:
													themeColors.card,
												opacity: pressed ? 0.8 : 1,
											})}
										>
											<Ionicons
												name="add"
												size={17}
												color={themeColors.primary}
											/>
											<Text
												className="font-sansMedium text-body-xs ml-2"
												style={{
													color: themeColors.primary,
												}}
											>
												Adicionar fotos
											</Text>
										</Pressable>
									) : (
										<Text
											className="font-sans text-body-xs mt-2 text-center self-center"
											style={{
												color: themeColors.secondary,
												width: slotsWidth,
											}}
										>
											Máximo de {MAX_PHOTOS} fotos
											atingido.
										</Text>
									)}
								</SectionCard>

								{submitting && progress ? (
									<Text
										className="font-sans text-body-xs mb-3 text-center"
										style={{
											color: themeColors.secondary,
										}}
									>
										{progress}
									</Text>
								) : null}

								<BoleiaButton
									title="Registar viatura"
									onPress={submit}
									loading={submitting}
									disabled={!canSubmit}
									strong
								/>
								<View className="mt-3">
									<BoleiaButton
										title="Cancelar"
										onPress={resetForm}
										disabled={submitting}
									/>
								</View>
							</View>
						) : (
							<BoleiaButton
								title={
									vehicles.length === 0
										? 'Registar viatura'
										: 'Registar outra viatura'
								}
								onPress={() => setAdding(true)}
								strong={vehicles.length === 0}
							/>
						)}
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
