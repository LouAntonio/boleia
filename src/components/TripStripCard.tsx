import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ride } from '../types/boleia';
import { useThemeColors } from '../hooks/useThemeColors';
import { hhmm, fmtKz, durationBetween } from '../mock/helpers';
import RouteStrip, { StripStop } from './RouteStrip';
import StatusStamp from './StatusStamp';

// Cartão de viagem: RouteStrip + meta — usado em listas e detalhe
export default function TripStripCard({
	ride,
	progress,
	onPress,
}: {
	ride: Ride;
	progress?: number;
	onPress?: () => void;
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
			// eslint-disable-next-line react-native/no-inline-styles
			style={({ pressed }) => ({
				backgroundColor: themeColors.card,
				borderRadius: 16,
				borderWidth: 1,
				borderColor: themeColors.border,
				opacity: pressed ? 0.85 : 1,
			})}
		>
			<View className="p-4">
				<View className="flex-row items-center justify-between mb-1">
					<Text
						className="font-display text-[15px]"
						// eslint-disable-next-line react-native/no-inline-styles
						style={{ color: themeColors.text }}
					>
						{ride.routeName}
					</Text>
					<StatusStamp status={ride.status} />
				</View>
				<Text
					className="font-sans text-[12px] mb-3"
					// eslint-disable-next-line react-native/no-inline-styles
					style={{ color: themeColors.secondary }}
				>
					Saída{' '}
					{new Date(ride.departure).toLocaleDateString('pt-PT', {
						weekday: 'short',
						day: 'numeric',
						month: 'short',
					})}
				</Text>

				<RouteStrip
					origin={origin}
					stops={stops}
					destination={destination}
					progress={progress}
				/>

				<View
					className="mt-4 pt-3 flex-row items-center justify-between border-t"
					// eslint-disable-next-line react-native/no-inline-styles
					style={{ borderColor: themeColors.border }}
				>
					<Text
						className="font-mono text-[14px]"
						// eslint-disable-next-line react-native/no-inline-styles
						style={{ color: themeColors.text }}
					>
						{fmtKz(ride.pricePerSeat)}
						<Text
							className="font-sans text-[11px]"
							// eslint-disable-next-line react-native/no-inline-styles
							style={{ color: themeColors.secondary }}
						>
							{' '}
							/lugar
						</Text>
					</Text>
					<View className="flex-row items-center">
						<Text
							className="font-mono text-[12px] mr-3"
							// eslint-disable-next-line react-native/no-inline-styles
							style={{ color: themeColors.secondary }}
						>
							{durationBetween(ride.departure, ride.arrival)}
						</Text>
						<Text
							className="font-sansMedium text-[11px]"
							// eslint-disable-next-line react-native/no-inline-styles
							style={{ color: themeColors.secondary }}
						>
							{seatsLeft > 0
								? `${seatsLeft} lugar${seatsLeft > 1 ? 'es' : ''} livre${seatsLeft > 1 ? 's' : ''}`
								: 'Lotada'}
						</Text>
					</View>
				</View>
			</View>
		</Pressable>
	);
}
