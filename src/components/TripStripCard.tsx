import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ride } from '../types/boleia';
import { useThemeColors } from '../hooks/useThemeColors';
import {
	hhmm,
	fmtKz,
	fmtKm,
	fmtDayMonth,
	fmtWeekdayShort,
	durationBetween,
	dateOf,
} from '../lib/format';
import { seatsLeft } from '../lib/rideMapper';
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
		km: fmtKm(ride.origin.km),
		kind: 'origin',
	};
	const stops: StripStop[] = ride.stops.map((s) => ({
		place: s.name,
		time: s.time,
		km: fmtKm(s.km),
		kind: 'stop',
	}));
	const destination: StripStop = {
		place: ride.destination.name,
		time: hhmm(ride.arrival),
		km: fmtKm(ride.destination.km),
		kind: 'destination',
	};
	const seatsFree = seatsLeft(ride);
	// "sex, 12 mar" — escrito à mão porque o ICU do Hermes não garante PT.
	const departure = dateOf(ride.departure);
	const departureLabel = `${fmtWeekdayShort(departure)}, ${fmtDayMonth(departure)}`;

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
						Saída {departureLabel}
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
									seatsFree > 0
										? themeColors.secondary
										: themeColors.error,
							}}
						>
							{seatsFree > 0
								? `${seatsFree} livre${seatsFree > 1 ? 's' : ''}`
								: 'Lotada'}
						</Text>
					</View>
				</View>
			</View>
		</Pressable>
	);
}
