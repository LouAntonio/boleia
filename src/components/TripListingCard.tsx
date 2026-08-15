import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ride } from '../types/boleia';
import { useThemeColors } from '../hooks/useThemeColors';
import { useDbStore } from '../mock/db';
import { hhmm, fmtKz, durationBetween, initials } from '../mock/helpers';
import { rideMode } from '../mock/repos/rideRepo';

// Cartão de listagem — painel de partidas de uma central: a boleia corta a
// estrada em dois, Partida | Chegada, divididas por uma perfuração vertical.
// Sem paragens: a listagem compara horários, preço e motorista num relance.
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
	const driver = useDbStore((s) =>
		s.db.users.find((u) => u.id === ride.driverId),
	);
	const seatsLeft = ride.seatsTotal - ride.seatsTaken;
	const dateLabel = new Date(ride.departure).toLocaleDateString('pt-PT', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
	});

	return (
		<Pressable
			onPress={onPress}
			className="rounded-2xl border overflow-hidden"
			// eslint-disable-next-line react-native/no-inline-styles
			style={({ pressed }) => ({
				borderColor: themeColors.border,
				backgroundColor: themeColors.card,
				opacity: pressed ? 0.85 : 1,
			})}
		>
			<View className="p-4">
				{/* Linha de cima: modo + data (e selo de reserva) */}
				<View className="flex-row items-center justify-between">
					<View
						className="rounded-full px-2 py-0.5 border"
						// eslint-disable-next-line react-native/no-inline-styles
						style={{ borderColor: themeColors.border }}
					>
						<Text
							className="font-mono text-[9px] uppercase tracking-[1px]"
							// eslint-disable-next-line react-native/no-inline-styles
							style={{ color: themeColors.laterite }}
						>
							{rideMode(ride) === 'interprovincial'
								? 'Interprovincial'
								: 'Intermunicipal'}
						</Text>
					</View>
					<View className="flex-row items-center">
						{reserved ? (
							<View
								className="rounded-full px-2 py-0.5 mr-2"
								// eslint-disable-next-line react-native/no-inline-styles
								style={{ backgroundColor: themeColors.mato }}
							>
								<Text
									className="font-mono text-[9px] uppercase tracking-[1px]"
									// eslint-disable-next-line react-native/no-inline-styles
									style={{ color: themeColors.background }}
								>
									Já tens reserva
								</Text>
							</View>
						) : null}
						<Text
							className="font-mono text-[10px] uppercase tracking-[1px]"
							// eslint-disable-next-line react-native/no-inline-styles
							style={{ color: themeColors.secondary }}
						>
							{dateLabel}
						</Text>
					</View>
				</View>

				{/* Partida | Chegada */}
				<View className="flex-row items-stretch mt-3.5">
					<View className="flex-1 items-start pr-3">
						<Text
							className="font-mono text-[26px] leading-8"
							// eslint-disable-next-line react-native/no-inline-styles
							style={{ color: themeColors.text }}
						>
							{hhmm(ride.departure)}
						</Text>
						<Text
							numberOfLines={1}
							className="font-sansBold text-[14px]"
							// eslint-disable-next-line react-native/no-inline-styles
							style={{ color: themeColors.text }}
						>
							{ride.origin.name}
						</Text>
						<Text
							className="font-mono text-[9px] uppercase tracking-[2px] mt-0.5"
							// eslint-disable-next-line react-native/no-inline-styles
							style={{ color: themeColors.laterite }}
						>
							↑ Partida
						</Text>
					</View>

					<View className="items-center">
						<View
							className="rounded-full border px-2 py-0.5 mb-2"
							// eslint-disable-next-line react-native/no-inline-styles
							style={{ borderColor: themeColors.border }}
						>
							<Text
								className="font-mono text-[10px]"
								// eslint-disable-next-line react-native/no-inline-styles
								style={{ color: themeColors.secondary }}
							>
								≈{' '}
								{durationBetween(ride.departure, ride.arrival)}
							</Text>
						</View>
						<View
							className="flex-1"
							// eslint-disable-next-line react-native/no-inline-styles
							style={{
								borderLeftWidth: 1,
								borderStyle: 'dashed',
								borderLeftColor: themeColors.border,
							}}
						/>
					</View>

					<View className="flex-1 items-end pl-3">
						<Text
							className="font-mono text-[26px] leading-8"
							// eslint-disable-next-line react-native/no-inline-styles
							style={{ color: themeColors.text }}
						>
							{hhmm(ride.arrival)}
						</Text>
						<Text
							numberOfLines={1}
							className="font-sansBold text-[14px]"
							// eslint-disable-next-line react-native/no-inline-styles
							style={{ color: themeColors.text }}
						>
							{ride.destination.name}
						</Text>
						<Text
							className="font-mono text-[9px] uppercase tracking-[2px] mt-0.5"
							// eslint-disable-next-line react-native/no-inline-styles
							style={{ color: themeColors.laterite }}
						>
							↓ Chegada
						</Text>
					</View>
				</View>

				{/* Motorista + preço */}
				<View
					className="mt-4 pt-3 flex-row items-center border-t"
					// eslint-disable-next-line react-native/no-inline-styles
					style={{ borderColor: themeColors.border }}
				>
					<View
						className="w-9 h-9 rounded-full items-center justify-center"
						// eslint-disable-next-line react-native/no-inline-styles
						style={{
							backgroundColor: themeColors.primary,
							borderWidth: 2,
							borderColor: themeColors.laterite,
						}}
					>
						<Text
							className="font-display text-[12px]"
							// eslint-disable-next-line react-native/no-inline-styles
							style={{ color: themeColors.text }}
						>
							{driver
								? initials(driver.firstName, driver.lastName)
								: '?'}
						</Text>
					</View>
					<View className="flex-1 ml-2.5">
						<Text
							numberOfLines={1}
							className="font-sansBold text-[13px]"
							// eslint-disable-next-line react-native/no-inline-styles
							style={{ color: themeColors.text }}
						>
							{driver ? driver.firstName : 'Motorista'}
						</Text>
						{driver?.rating ? (
							<View className="flex-row items-center mt-0.5">
								<Text
									className="font-mono text-[11px]"
									// eslint-disable-next-line react-native/no-inline-styles
									style={{ color: themeColors.laterite }}
								>
									★ {driver.rating.toFixed(1)}
								</Text>
								<Text
									className="font-mono text-[11px] ml-1"
									// eslint-disable-next-line react-native/no-inline-styles
									style={{ color: themeColors.secondary }}
								>
									· {driver.ratingsCount} avaliações
								</Text>
							</View>
						) : (
							<Text
								className="font-mono text-[11px] mt-0.5"
								// eslint-disable-next-line react-native/no-inline-styles
								style={{ color: themeColors.secondary }}
							>
								novo motorista
							</Text>
						)}
					</View>
					<View className="items-end ml-3">
						<Text
							className="font-display text-[17px] leading-6"
							// eslint-disable-next-line react-native/no-inline-styles
							style={{ color: themeColors.text }}
						>
							{fmtKz(ride.pricePerSeat)}
							<Text
								className="font-sans text-[10px]"
								// eslint-disable-next-line react-native/no-inline-styles
								style={{ color: themeColors.secondary }}
							>
								{' '}
								/lugar
							</Text>
						</Text>
						<Text
							className="font-mono text-[10px] uppercase tracking-[1px] mt-0.5"
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
