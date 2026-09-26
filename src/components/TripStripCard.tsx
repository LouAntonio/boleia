import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ride } from '../types/boleia';
import { useThemeColors } from '../hooks/useThemeColors';
import { hhmm, fmtKz, durationBetween } from '../lib/format';
import RouteStrip, { StripStop } from './RouteStrip';
import StatusStamp from './StatusStamp';

// Cartão de viagem com rail de paragens — mesma gramática do ResultCard/Trip,
// com o itinerário detalhado. Estados via `StatusStamp` (sempre com rótulo).
export default function TripStripCard({
	ride,
	progress,
	onPress,
	reserved,
}: {
	ride: Ride;
	progress?: number;
	onPress?: () => void;
	reserved?: boolean;
}) {
	const { themeColors } = useThemeColors();
	const origin: StripStop = {
		place: ride.origin.name,
		time: hhmm(ride.departure),
		km: `${ride.origin.km} km`,
		kind: 'origin',
	};
	const stops: StripStop[] = ride.stops.map((s) => ({
		place: s.name,
		time: s.time,
		km: `${s.km} km`,
		kind: 'stop',
	}));
	const destination: StripStop = {
		place: ride.destination.name,
		time: hhmm(ride.arrival),
		km: `${ride.destination.km} km`,
		kind: 'destination',
	};
	const seatsLeft = ride.seatsTotal - ride.seatsTaken;

	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="button"
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
			<View className="p-4">
				<View className="flex-row items-center justify-between mb-1">
					<Text
						className="font-sansBold text-label flex-1 mr-2"
						style={{ color: themeColors.text }}
						numberOfLines={1}
					>
						{ride.routeName}
					</Text>
					<StatusStamp status={ride.status} />
				</View>
				<View className="flex-row items-center justify-between mb-3">
					<Text
						className="font-sans text-body-small"
						style={{ color: themeColors.secondary }}
					>
						Saída{' '}
						{new Date(ride.departure).toLocaleDateString('pt-PT', {
							weekday: 'short',
							day: 'numeric',
							month: 'short',
						})}
					</Text>
					{reserved ? (
						<StatusStamp status="confirmada" label="Reservado" />
					) : null}
				</View>

				<RouteStrip
					origin={origin}
					stops={stops}
					destination={destination}
					progress={progress}
				/>

				<View
					className="mt-4 pt-3 flex-row items-center justify-between border-t"
					style={{ borderColor: themeColors.border }}
				>
					<Text
						className="font-sansBold text-label"
						style={{ color: themeColors.text }}
					>
						{fmtKz(ride.pricePerSeat)}
						<Text
							className="font-sans text-body-xs"
							style={{ color: themeColors.secondary }}
						>
							{' '}
							/lugar
						</Text>
					</Text>
					<View className="flex-row items-center">
						<Text
							className="font-sans text-body-small mr-3"
							style={{ color: themeColors.secondary }}
						>
							{durationBetween(ride.departure, ride.arrival)}
						</Text>
						<Text
							className="font-sansMedium text-body-small"
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
			</View>
		</Pressable>
	);
}
