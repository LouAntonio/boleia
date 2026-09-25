import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ride } from '../types/boleia';
import { useThemeColors } from '../hooks/useThemeColors';
import { hhmm, fmtKz, durationBetween } from '../mock/helpers';
import { rideMode } from '../mock/repos/rideRepo';
import StatusStamp from './StatusStamp';

// ResultCard/Trip — "os detalhes mais importantes de uma viagem num só
// pacote": itinerário + coluna de preço + resumo da oferta + amenities.
// Enough information to decide without opening the detail.
export default function TripListingCard({
	ride,
	reserved,
	onPress,
}: {
	ride: Ride;
	reserved?: boolean;
	onPress?: () => void;
}) {
	const { themeColors } = useThemeColors();
	const seatsLeft = ride.seatsTotal - ride.seatsTaken;
	const dateLabel = new Date(ride.departure).toLocaleDateString('pt-PT', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
	});

	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={`${hhmm(ride.departure)}, de ${ride.origin.name} para ${ride.destination.name}, ${fmtKz(ride.pricePerSeat)} por lugar`}
			className="rounded-xl overflow-hidden"
			style={({ pressed }) => ({
				backgroundColor: themeColors.card,
				opacity: pressed ? 0.9 : 1,
				shadowColor: '#000',
				shadowOpacity: 0.08,
				shadowOffset: { width: 0, height: 4 },
				shadowRadius: 12,
				elevation: 3,
			})}
		>
			<View className="flex-row items-stretch">
				{/* Itinerário: hora e rota */}
				<View className="w-[62px] py-4 pl-4">
					<Text
						className="font-sansExtraBold text-title-tertiary"
						style={{ color: themeColors.text }}
					>
						{hhmm(ride.departure)}
					</Text>
					<Text
						className="font-sans text-body-xs mt-0.5"
						style={{ color: themeColors.secondary }}
					>
						{dateLabel}
					</Text>
				</View>

				<View className="flex-1 py-4 px-3">
					<Text
						numberOfLines={1}
						className="font-sansBold text-label"
						style={{ color: themeColors.text }}
					>
						{ride.origin.name} → {ride.destination.name}
					</Text>
					<Text
						className="font-sans text-body-xs mt-1"
						style={{ color: themeColors.secondary }}
					>
						{rideMode(ride) === 'interprovincial'
							? 'Interprovincial'
							: 'Intermunicipal'}{' '}
						· {durationBetween(ride.departure, ride.arrival)}
					</Text>
					<View className="flex-row items-center mt-1.5">
						{reserved ? <StatusStamp status="confirmada" /> : null}
						{reserved && ride.status !== 'programada' ? (
							<View className="mr-2">
								<StatusStamp status={ride.status} />
							</View>
						) : null}
					</View>
				</View>

				{/* Coluna de preço + resumo da oferta */}
				<View className="items-end py-4 pr-4 pl-2">
					<Text
						className="font-sansBold text-label"
						style={{ color: themeColors.text }}
					>
						{fmtKz(ride.pricePerSeat)}
					</Text>
					<Text
						className="font-sans text-body-xs"
						style={{ color: themeColors.secondary }}
					>
						/lugar
					</Text>
					<Text
						className="font-sansMedium text-body-xs mt-1"
						style={{
							color:
								seatsLeft > 0
									? themeColors.secondary
									: themeColors.error,
						}}
					>
						{seatsLeft > 0
							? `${seatsLeft} livre${seatsLeft > 1 ? 's' : ''}`
							: 'Lotada'}
					</Text>
				</View>
			</View>
		</Pressable>
	);
}
