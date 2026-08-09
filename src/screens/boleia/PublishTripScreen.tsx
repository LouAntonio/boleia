import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import BoleiaButton from '../../components/BoleiaButton';
import LocalityPicker from '../../components/LocalityPicker';
import SectionTitle from '../../components/SectionTitle';
import { useDbStore } from '../../mock/db';
import { createRide, nextDays } from '../../mock/repos/rideRepo';
import { fmtKz } from '../../mock/helpers';

const HOUR_OPTIONS = ['06:00', '08:00', '12:00', '15:00', '18:00'];
const PRICE_SUGGEST = [12000, 15000, 18000, 22000];

function chip(
	label: string,
	active: boolean,
	themeColors: any,
	onPress: () => void,
	key: string,
) {
	return (
		<Pressable
			key={key}
			onPress={onPress}
			className="rounded-full px-3 py-1.5 border mr-2 mb-2"
			style={{
				borderColor: active ? themeColors.text : themeColors.border,
				backgroundColor: active ? themeColors.text : themeColors.card,
			}}
		>
			<Text
				className="font-sansMedium text-[12px]"
				style={{
					color: active ? themeColors.card : themeColors.secondary,
				}}
			>
				{label}
			</Text>
		</Pressable>
	);
}

export default function PublishTripScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'PublishTrip'>
		>();
	const { themeColors } = useThemeColors();

	const [from, setFrom] = useState('');
	const [to, setTo] = useState('');
	const [date, setDate] = useState('');
	const [hour, setHour] = useState('06:00');
	const [priceStr, setPriceStr] = useState('15000');
	const [seats, setSeats] = useState(4);
	const [published, setPublished] = useState<string | null>(null);

	const days = nextDays(4);
	const driverId = 'u_me_001';
	const me = useDbStore((s) => s.db.users.find((u) => u.id === driverId));

	const price = Math.max(0, Number(priceStr) || 0);
	const canPublish = !!from && !!to && from !== to && !!date && price >= 1000;

	const publish = () => {
		if (!canPublish) return;
		const dep = new Date(`${date}T${hour}:00`);
		const ride = createRide({
			driverId,
			originLocalityId: from,
			destinationLocalityId: to,
			departureISO: dep.toISOString(),
			seatsTotal: seats,
			pricePerSeat: price,
		});
		setPublished(ride.id);
		setTimeout(() => {
			navigation.goBack();
		}, 1500);
	};

	return (
		<SafeAreaView
			className="flex-1"
			style={{ backgroundColor: themeColors.background }}
		>
			<ScrollView
				className="flex-1 px-5 pt-12"
				contentContainerStyle={{ paddingBottom: 48 }}
			>
				<Text
					className="font-display text-[22px]"
					style={{ color: themeColors.text }}
				>
					Publicar viagem
				</Text>
				<Text
					className="font-sans text-[13px] mt-1 mb-5"
					style={{ color: themeColors.secondary }}
				>
					Motorista: {me ? `${me.firstName} ${me.lastName}` : ''} ·{' '}
					{me?.vehicle
						? `${me.vehicle.make} ${me.vehicle.model}`
						: ''}
				</Text>

				<SectionTitle>Rota</SectionTitle>
				<Text
					className="font-sansMedium text-[12px] uppercase tracking-wider mb-1.5"
					style={{ color: themeColors.laterite }}
				>
					De onde sais
				</Text>
				<LocalityPicker value={from} onChange={setFrom} exclude={to} />
				<Text
					className="font-sansMedium text-[12px] uppercase tracking-wider mb-1.5 mt-3"
					style={{ color: themeColors.laterite }}
				>
					Para onde vais
				</Text>
				<LocalityPicker value={to} onChange={setTo} exclude={from} />

				<SectionTitle>Dia e hora</SectionTitle>
				<View className="flex-row flex-wrap">
					{days.map((d) =>
						chip(
							new Date(d).toLocaleDateString('pt-PT', {
								weekday: 'short',
								day: 'numeric',
							}),
							d === date,
							themeColors,
							() => setDate(d),
							d,
						),
					)}
				</View>
				<View className="flex-row flex-wrap mt-1">
					{HOUR_OPTIONS.map((h) =>
						chip(h, h === hour, themeColors, () => setHour(h), h),
					)}
				</View>

				<SectionTitle>Preço e lugares</SectionTitle>
				<View
					className="rounded-xl border px-3.5 mb-3"
					style={{
						borderColor: themeColors.border,
						backgroundColor: themeColors.card,
					}}
				>
					<TextInput
						value={priceStr}
						onChangeText={(t) =>
							setPriceStr(t.replace(/\D/g, '').slice(0, 6))
						}
						keyboardType="number-pad"
						className="py-3 font-mono text-[18px]"
						style={{ color: themeColors.text }}
					/>
				</View>
				<View className="flex-row flex-wrap">
					{PRICE_SUGGEST.map((p) =>
						chip(
							fmtKz(p),
							price === p,
							themeColors,
							() => setPriceStr(String(p)),
							String(p),
						),
					)}
				</View>

				<Text
					className="font-sansMedium text-[12px] uppercase tracking-wider mb-1.5 mt-3"
					style={{ color: themeColors.laterite }}
				>
					Lugares livres ({seats})
				</Text>
				<View className="flex-row items-center">
					{seats > 2 && (
						<Pressable
							onPress={() => setSeats((s) => s - 1)}
							className="w-10 h-10 rounded-full items-center justify-center border"
							style={{
								borderColor: themeColors.border,
								backgroundColor: themeColors.card,
							}}
						>
							<Text
								className="font-display text-[18px]"
								style={{ color: themeColors.text }}
							>
								−
							</Text>
						</Pressable>
					)}
					<Text
						className="font-mono text-[26px] mx-6"
						style={{ color: themeColors.text }}
					>
						{seats}
					</Text>
					<Pressable
						onPress={() => setSeats((s) => Math.min(30, s + 1))}
						className="w-10 h-10 rounded-full items-center justify-center border"
						style={{
							borderColor: themeColors.border,
							backgroundColor: themeColors.card,
						}}
					>
						<Text
							className="font-display text-[18px]"
							style={{ color: themeColors.text }}
						>
							+
						</Text>
					</Pressable>
				</View>

				{published ? (
					<View
						className="mt-8 rounded-2xl border p-4"
						style={{
							borderColor: themeColors.mato,
							backgroundColor: themeColors.card,
						}}
					>
						<Text
							className="font-sansBold text-[15px]"
							style={{ color: themeColors.mato }}
						>
							Viagem publicada ✓
						</Text>
						<Text
							className="font-mono text-[12px] mt-1"
							style={{ color: themeColors.secondary }}
						>
							{new Date(`${date}T${hour}:00`).toLocaleDateString(
								'pt-PT',
								{
									weekday: 'long',
									day: 'numeric',
									month: 'long',
								},
							)}{' '}
							às {hour} · {seats} lugares
						</Text>
					</View>
				) : null}

				<View className="mt-8">
					<BoleiaButton
						title="Publicar viagem"
						onPress={publish}
						disabled={!canPublish}
					/>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
