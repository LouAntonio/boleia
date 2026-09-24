import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ride } from '../types/boleia';
import { useThemeColors } from '../hooks/useThemeColors';
import { hhmm, fmtKz } from '../mock/helpers';
import { rideMode } from '../mock/repos/rideRepo';

// Cartão de listagem compacto — uma linha de leitura: quando sai, de onde
// para onde, a que preço. O detalhe (motorista, paragens, duração) vive no
// detalhe da viagem, não na lista.
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
	const weekday = new Date(ride.departure).toLocaleDateString('pt-PT', {
		weekday: 'short',
	});
	const dateLabel = new Date(ride.departure).toLocaleDateString('pt-PT', {
		day: 'numeric',
		month: 'short',
	});

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
			<View className="flex-row items-center">
				{reserved ? (
					<View
						className="self-stretch w-1.5"
						style={{ backgroundColor: themeColors.primary }}
					/>
				) : null}
				<View className="w-[54px] items-start pl-4 py-3.5">
					<Text
						className="font-display text-[20px] leading-6"
						style={{ color: themeColors.text }}
					>
						{hhmm(ride.departure)}
					</Text>
					<Text
						className="font-mono text-[9px] uppercase tracking-[1px] mt-0.5"
						style={{ color: themeColors.secondary }}
						numberOfLines={1}
					>
						{weekday} {dateLabel}
					</Text>
				</View>
				<View className="flex-1 mx-3 py-3.5">
					<Text
						numberOfLines={1}
						className="font-sansBold text-[15px]"
						style={{ color: themeColors.text }}
					>
						{ride.origin.name} → {ride.destination.name}
					</Text>
					<Text
						numberOfLines={1}
						className="font-mono text-[10px] mt-1"
						style={{ color: themeColors.secondary }}
					>
						{rideMode(ride) === 'interprovincial'
							? 'Interprovincial'
							: 'Intermunicipal'}{' '}
						·{' '}
						{seatsLeft > 0
							? `${seatsLeft} livre${seatsLeft > 1 ? 's' : ''}`
							: 'Lotada'}
						{reserved ? (
							<Text style={{ color: themeColors.laterite }}>
								{' '}
								· Reservado
							</Text>
						) : null}
					</Text>
				</View>
				<View className="items-end pr-4 py-3.5">
					<Text
						className="font-display text-[18px] leading-6"
						style={{ color: themeColors.text }}
					>
						{fmtKz(ride.pricePerSeat)}
					</Text>
					<Text
						className="font-mono text-[9px] mt-0.5"
						style={{ color: themeColors.secondary }}
					>
						/lugar
					</Text>
				</View>
			</View>
		</Pressable>
	);
}
