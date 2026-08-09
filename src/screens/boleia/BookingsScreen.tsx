import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useDbStore } from '../../mock/db';
import { fmtKz } from '../../mock/helpers';
import TripStripCard from '../../components/TripStripCard';
import StatusStamp from '../../components/StatusStamp';
import BoleiaButton from '../../components/BoleiaButton';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';

export default function BookingsScreen() {
	const { themeColors } = useThemeColors();
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'Main'>
		>();
	const { rides, bookings } = useDbStore((s) => ({
		rides: s.db.rides,
		bookings: s.db.bookings,
	}));
	const mine = bookings.filter((b) => b.passengerId === 'u_me_001');
	const withRide = mine.flatMap((b) => {
		const ride = rides.find((r) => r.id === b.rideId);
		return ride ? [{ booking: b, ride }] : [];
	});

	return (
		<SafeAreaView
			className="flex-1 px-5"
			style={{ backgroundColor: themeColors.background }}
		>
			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				<Text
					className="font-display text-[22px] mb-4 mt-2"
					style={{ color: themeColors.text }}
				>
					As tuas reservas
				</Text>

				{withRide.length === 0 ? (
					<Text
						className="font-sans text-[13px]"
						style={{ color: themeColors.secondary }}
					>
						Ainda não tens reservas. Pesquisa uma viagem e pede uma
						boleia.
					</Text>
				) : (
					withRide.map(({ booking, ride }) => (
						<View key={booking.id} className="mb-4">
							<TripStripCard
								ride={ride}
								onPress={() =>
									navigation.navigate('RideDetail', {
										rideId: ride.id,
									})
								}
							/>
							<View
								className="flex-row items-center justify-between px-4 py-2 border-b border-l border-r rounded-b-2xl"
								style={{
									borderColor: themeColors.border,
									backgroundColor: themeColors.card,
								}}
							>
								<StatusStamp status={booking.status} />
								<Text
									className="font-mono text-[13px]"
									style={{ color: themeColors.secondary }}
								>
									{booking.seats} lugar
									{booking.seats > 1 ? 'es' : ''} ·{' '}
									{fmtKz(booking.amount)}
								</Text>
							</View>
							{booking.status === 'em_viagem' && (
								<View className="mt-2">
									<BoleiaButton
										title="Acompanhar viagem ao vivo"
										onPress={() =>
											navigation.navigate('ActiveRide', {
												rideId: ride.id,
											})
										}
									/>
								</View>
							)}
							{booking.status === 'concluida' && (
								<View className="mt-2">
									<BoleiaButton
										title="Avaliar motorista"
										variant="outline"
										onPress={() =>
											navigation.navigate('Review', {
												rideId: ride.id,
												toUserId: ride.driverId,
												subject: 'driver',
											})
										}
									/>
								</View>
							)}
						</View>
					))
				)}
			</ScrollView>
		</SafeAreaView>
	);
}
