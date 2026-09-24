import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ride } from '../types/boleia';
import { useThemeColors } from '../hooks/useThemeColors';
import { hhmm, fmtKz, durationBetween } from '../mock/helpers';
import { rideMode } from '../mock/repos/rideRepo';
import RouteStrip, { StripStop } from './RouteStrip';
import StatusStamp from './StatusStamp';

const ASFALTO = '#17141B';

// Cartão de viagem compacto Boleia viva — superfície cheia com sombra,
// selo de modo em pastilha, rail de paragens e linha de preço.
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
			className="rounded-2xl overflow-hidden"
			style={({ pressed }) => ({
				backgroundColor: themeColors.card,
				opacity: pressed ? 0.9 : 1,
				transform: [{ scale: pressed ? 0.99 : 1 }],
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
						className="font-display text-[17px] flex-1 mr-2"
						style={{ color: themeColors.text }}
						numberOfLines={1}
					>
						{ride.routeName}
					</Text>
					<View className="flex-row items-center">
						<View
							className="rounded-full px-2.5 py-1 mr-2"
							style={{
								backgroundColor: themeColors.background,
							}}
						>
							<Text
								className="font-mono text-[9px] uppercase tracking-[1px]"
								style={{ color: themeColors.laterite }}
							>
								{rideMode(ride) === 'interprovincial'
									? 'Interprovincial'
									: 'Intermunicipal'}
							</Text>
						</View>
						<StatusStamp status={ride.status} />
					</View>
				</View>
				<View className="flex-row items-center justify-between mb-3">
					<Text
						className="font-sans text-[12px]"
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
						<View
							className="rounded-full px-2.5 py-1"
							style={{ backgroundColor: themeColors.primary }}
						>
							<Text
								className="font-mono text-[9px] uppercase tracking-[1px]"
								style={{ color: ASFALTO }}
							>
								Já tens reserva
							</Text>
						</View>
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
						className="font-display text-[17px]"
						style={{ color: themeColors.text }}
					>
						{fmtKz(ride.pricePerSeat)}
						<Text
							className="font-sans text-[11px]"
							style={{ color: themeColors.secondary }}
						>
							{' '}
							/lugar
						</Text>
					</Text>
					<View className="flex-row items-center">
						<Text
							className="font-mono text-[12px] mr-3"
							style={{ color: themeColors.secondary }}
						>
							{durationBetween(ride.departure, ride.arrival)}
						</Text>
						<Text
							className="font-sansMedium text-[11px]"
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
