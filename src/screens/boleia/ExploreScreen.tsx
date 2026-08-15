import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useDbStore } from '../../mock/db';
import TripListingCard from '../../components/TripListingCard';

// Montra de todas as viagens ativas ainda não iniciadas — sem depender da
// pesquisa. Cada cartão leva ao detalhe onde se pede boleia.
export default function ExploreScreen() {
	const { themeColors } = useThemeColors();
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'Main'>
		>();
	const rides = useDbStore((s) => s.db.rides);
	const bookings = useDbStore((s) => s.db.bookings);

	const reservedIds = new Set(
		bookings
			.filter(
				(b) => b.passengerId === 'u_me_001' && b.status !== 'cancelada',
			)
			.map((b) => b.rideId),
	);
	const upcoming = rides
		.filter(
			(r) =>
				r.status === 'programada' &&
				r.seatsTaken < r.seatsTotal &&
				Date.parse(r.departure) > Date.now(),
		)
		.sort((a, b) => Date.parse(a.departure) - Date.parse(b.departure))
		.map((ride) => ({
			ride,
			reserved: reservedIds.has(ride.id),
		}));

	return (
		<SafeAreaView
			className="flex-1 px-5"
			style={{ backgroundColor: themeColors.background }}
		>
			<View className="mt-2">
				<Text
					className="font-mono text-[10px] uppercase tracking-[3px]"
					style={{ color: themeColors.laterite }}
				>
					Explorar · viagens ativas
				</Text>
				<Text
					className="font-display text-[22px]"
					style={{ color: themeColors.text }}
				>
					Viagens a bater certo
				</Text>
				{upcoming.length > 0 ? (
					<Text
						className="font-mono text-[11px] mt-0.5"
						style={{ color: themeColors.secondary }}
					>
						{upcoming.length} embarque
						{upcoming.length === 1 ? '' : 's'} a seguir
					</Text>
				) : null}
			</View>

			{upcoming.length === 0 ? (
				<View className="flex-1 justify-center pb-10">
					<View
						className="items-center p-5 rounded-2xl border"
						style={{
							borderColor: themeColors.border,
							backgroundColor: themeColors.card,
						}}
					>
						<Text
							className="font-display text-[18px]"
							style={{ color: themeColors.text }}
						>
							Sem viagens ativas por agora
						</Text>
						<Text
							className="font-sans text-[13px] text-center mt-1 leading-5"
							style={{ color: themeColors.secondary }}
						>
							Quando alguém publicar uma viagem, aparece aqui. Usa
							a pesquisa na Home para afinar a tua rota.
						</Text>
					</View>
				</View>
			) : (
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ paddingBottom: 40 }}
				>
					{upcoming.map(({ ride, reserved }) => (
						<View key={ride.id} className="mb-4">
							<TripListingCard
								ride={ride}
								reserved={reserved}
								onPress={() =>
									navigation.navigate('RideDetail', {
										rideId: ride.id,
									})
								}
							/>
						</View>
					))}
				</ScrollView>
			)}
		</SafeAreaView>
	);
}
