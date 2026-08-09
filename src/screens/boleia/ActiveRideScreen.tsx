import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { Share } from 'react-native';
import RouteStrip, { StripStop } from '../../components/RouteStrip';
import SectionTitle from '../../components/SectionTitle';
import { useDbStore } from '../../mock/db';
import { hhmm } from '../../mock/helpers';
import { sendSos } from '../../mock/repos/liveRepo';
import { useAppStore } from '../../store/appStore';

export default function ActiveRideScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'ActiveRide'>
		>();
	const route = useRoute<RouteProp<BoleiaMainStackParamList, 'ActiveRide'>>();
	const { themeColors } = useThemeColors();
	const currentRole = useAppStore((s) => s.currentRole);
	const [sosSent, setSosSent] = useState(false);

	const ride = useDbStore((s) =>
		s.db.rides.find((r) => r.id === route.params.rideId),
	);
	const passengers = useDbStore((s) => {
		if (!ride) return [];
		return s.db.bookings
			.filter(
				(b) =>
					b.rideId === route.params.rideId &&
					(b.status === 'em_viagem' || b.status === 'confirmada'),
			)
			.map((b) => s.db.users.find((u) => u.id === b.passengerId))
			.filter((u): u is NonNullable<typeof u> => !!u);
	});

	if (!ride || ride.status === 'cancelada') {
		return (
			<SafeAreaView
				className="flex-1 items-center justify-center px-5"
				style={{ backgroundColor: themeColors.background }}
			>
				<Text style={{ color: themeColors.secondary }}>
					Viagem não está em curso.
				</Text>
			</SafeAreaView>
		);
	}

	const progress =
		ride.status === 'em_curso'
			? Math.min(1, ride.vinculos.length / (1 + ride.stops.length + 1))
			: 1;

	const stops: StripStop[] = [
		{
			...ride.origin,
			kind: 'origin',
			place: ride.origin.name,
			time: ride.origin.time,
			km: `${ride.origin.km} km`,
		},
		...ride.stops.map((s, i) => ({
			place: s.name,
			time: s.time,
			km: `${s.km} km`,
			kind: 'stop' as const,
			key: i,
		})),
		{
			...ride.destination,
			kind: 'destination',
			place: ride.destination.name,
			time: ride.destination.time,
			km: `${ride.destination.km} km`,
		},
	];

	return (
		<SafeAreaView
			className="flex-1 px-5"
			style={{ backgroundColor: themeColors.background }}
		>
			<View className="flex-row items-center pt-2 pb-3">
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
					<Text
						className="font-sansMedium text-[11px] uppercase tracking-widest"
						style={{ color: themeColors.laterite }}
					>
						Viagem ao vivo
					</Text>
					<Text
						className="font-display text-[18px] -mt-0.5"
						style={{ color: themeColors.text }}
					>
						{ride.routeName}
					</Text>
				</View>
				<View className="flex-row items-center">
					<View
						className="w-2.5 h-2.5 rounded-full mr-2"
						style={{
							backgroundColor: themeColors.mato,
							opacity: ride.status === 'em_curso' ? 0.35 : 1,
						}}
					/>
					<Text
						className="font-mono text-[12px]"
						style={{ color: themeColors.text }}
					>
						{hhmm(new Date().toISOString())}
					</Text>
				</View>
			</View>

			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingBottom: 48 }}
			>
				{ride.status === 'em_curso' && (
					<Text
						className="font-sans text-[13px] mb-3"
						style={{ color: themeColors.mato }}
					>
						Em movimento — a pista enche à medida que avanças.
					</Text>
				)}
				<View
					className="p-4 rounded-2xl border"
					style={{
						borderColor: themeColors.border,
						backgroundColor: themeColors.card,
					}}
				>
					<RouteStrip
						origin={stops[0]}
						stops={stops.slice(1, -1)}
						destination={stops[stops.length - 1]}
						progress={progress}
					/>
				</View>

				{currentRole === 'driver' && passengers.length > 0 && (
					<View className="mt-5">
						<SectionTitle>Bordo</SectionTitle>
						{passengers.map((p) => (
							<View
								key={p.id}
								className="p-3 rounded-2xl border mb-2 flex-row items-center"
								style={{
									borderColor: themeColors.border,
									backgroundColor: themeColors.card,
								}}
							>
								<View
									className="w-8 h-8 rounded-full items-center justify-center"
									style={{
										backgroundColor: themeColors.primary,
									}}
								>
									<Text
										className="font-display text-[12px]"
										style={{ color: themeColors.text }}
									>
										{p.firstName.charAt(0)}
										{p.lastName.charAt(0)}
									</Text>
								</View>
								<Text
									className="font-sansBold text-[14px] ml-3"
									style={{ color: themeColors.text }}
								>
									{p.firstName} {p.lastName}
								</Text>
								<Text
									className="font-mono text-[11px] ml-auto"
									style={{ color: themeColors.secondary }}
								>
									{p.phone}
								</Text>
							</View>
						))}
					</View>
				)}

				{/* Segurança */}
				<View className="mt-6">
					<SectionTitle tone="laterite">Segurança</SectionTitle>
					<View className="flex-row">
						<Pressable
							onPress={async () => {
								try {
									await Share.share({
										message: `Estou a viajar na Boleia: ${ride.routeName}.`,
									});
								} catch {}
							}}
							className="flex-1 mr-2 items-center py-3.5 rounded-xl border"
							style={{
								borderColor: themeColors.border,
								backgroundColor: themeColors.card,
							}}
						>
							<Ionicons
								name="share-outline"
								size={22}
								color={themeColors.text}
							/>
							<Text
								className="font-sansMedium text-[12px] mt-1"
								style={{ color: themeColors.text }}
							>
								Partilhar viagem
							</Text>
						</Pressable>
						<Pressable
							onPress={() => {
								sendSos(
									ride.id,
									'u_me_001',
									'Atenção — pedido de ajuda nesta viagem.',
								);
								setSosSent(true);
							}}
							className="flex-1 items-center py-3.5 rounded-xl"
							style={{
								backgroundColor: sosSent
									? themeColors.mato
									: themeColors.error,
							}}
						>
							<Ionicons
								name="alert-circle-outline"
								size={22}
								color={themeColors.card}
							/>
							<Text
								className="font-sansMedium text-[12px] mt-1"
								style={{ color: themeColors.card }}
							>
								{sosSent ? 'SOS enviado ✓' : 'Ligar SOS'}
							</Text>
						</Pressable>
					</View>
					{sosSent && (
						<Text
							className="font-sans text-[12px] mt-2"
							style={{ color: themeColors.mato }}
						>
							Notificação enviada à central Boleia. Fica perto de
							ti uma pessoa de confiança.
						</Text>
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
