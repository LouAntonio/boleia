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
import { submitVehicle } from '../../mock/repos/driverRepo';

export default function VehicleScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'Vehicle'>
		>();
	const { themeColors } = useThemeColors();
	const me = useDbStore((s) => s.db.users.find((u) => u.id === 'u_me_001'));

	const [make, setMake] = useState(me?.vehicle?.make ?? '');
	const [model, setModel] = useState(me?.vehicle?.model ?? '');
	const [color, setColor] = useState(me?.vehicle?.color ?? '');
	const [plate, setPlate] = useState(me?.vehicle?.plate ?? '');
	const [seats, setSeats] = useState(String(me?.vehicle?.seats ?? 4));
	const [photoUri, setPhotoUri] = useState<string | null>(
		me?.vehicle?.photoUri ?? null,
	);
	const [submitting, setSubmitting] = useState(false);

	const vehicle = me?.vehicle;
	const status = vehicle?.status ?? 'nao_submetido';

	const seatCount = Math.min(30, Math.max(2, Number(seats) || 4));
	const canSubmit =
		make.trim().length > 0 &&
		model.trim().length > 0 &&
		plate.trim().length >= 6;

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
		submitVehicle('u_me_001', {
			make,
			model,
			color,
			plate,
			seats: seatCount,
			photoUri,
		});
		setTimeout(() => setSubmitting(false), 300);
	};

	const field = (
		labelText: string,
		value: string,
		setter: (v: string) => void,
		placeholder: string,
	) => (
		<View className="mb-4">
			<Text
				className="font-sansMedium text-[12px] uppercase tracking-wider mb-1.5"
				style={{ color: themeColors.laterite }}
			>
				{labelText}
			</Text>
			<View
				className="rounded-xl border px-3.5"
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
					autoCapitalize={
						labelText === 'Matrícula' ? 'characters' : 'words'
					}
					className="py-3 font-sans text-[15px]"
					style={{ color: themeColors.text }}
				/>
			</View>
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
						A tua viatura
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
							Viatura verificada. Já podes publicar viagens a
							partir do painel de motorista.
						</Text>
						<View className="mt-6">
							<BoleiaButton
								title="Voltar ao painel"
								onPress={() => navigation.goBack()}
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
							A verificar a viatura… (demo)
						</Text>
					</View>
				) : (
					<View>
						{field('Marca', make, setMake, 'ex.: Toyota')}
						{field('Modelo', model, setModel, 'ex.: Hiace')}
						{field('Cor', color, setColor, 'ex.: Branca')}
						{field(
							'Matrícula',
							plate,
							setPlate,
							'ex.: LG-12-35-BT',
						)}
						{field(
							`Lotação (${seatCount} lugares)`,
							seats,
							(t) => setSeats(t.replace(/\D/g, '').slice(0, 2)),
							'ex.: 12',
						)}

						<Text
							className="font-sansMedium text-[12px] uppercase tracking-wider mb-1.5"
							style={{ color: themeColors.laterite }}
						>
							Foto (opcional)
						</Text>
						<Pressable
							onPress={pickPhoto}
							className="rounded-xl border items-center justify-center mb-4 overflow-hidden"
							style={{
								borderColor: themeColors.border,
								backgroundColor: themeColors.card,
								height: 110,
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

						<BoleiaButton
							title="Registar viatura"
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
