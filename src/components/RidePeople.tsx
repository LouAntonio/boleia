import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import { initials } from '../lib/format';
import Avatar from './Avatar';
import { Ride, BoleiaUser } from '../types/boleia';

export default function RidePeople({
	ride,
	driver,
	passengers,
	onPressUser,
}: {
	ride: Ride;
	driver?: BoleiaUser;
	passengers: BoleiaUser[];
	onPressUser: (userId: string) => void;
}) {
	const { themeColors } = useThemeColors();

	return (
		<View className="mt-6">
			<Text
				className="font-sansMedium text-body-xs mb-1.5"
				style={{ color: themeColors.secondary }}
			>
				Quem vai contigo
			</Text>
			<View
				className="rounded-xl border overflow-hidden"
				style={{
					borderColor: themeColors.border,
					backgroundColor: themeColors.card,
				}}
			>
				<Pressable
					onPress={() => onPressUser(ride.driverId)}
					className="flex-row items-center px-4 py-3.5"
					style={({ pressed }) => ({
						opacity: pressed ? 0.7 : 1,
					})}
				>
					<Avatar
						initials={
							driver
								? initials(driver.firstName, driver.lastName)
								: '?'
						}
						size={44}
					/>
					<View className="flex-1 ml-3">
						<Text
							className="font-sansBold text-body-small"
							style={{ color: themeColors.text }}
						>
							{driver
								? `${driver.firstName} ${driver.lastName}`
								: '—'}
						</Text>
						<View className="flex-row items-center mt-0.5">
							<Text
								className="font-sansMedium text-body-xs"
								style={{ color: themeColors.secondary }}
							>
								★ {driver?.rating?.toFixed(1) ?? 'novo'}
							</Text>
							<Text
								className="font-sansMedium text-body-xs ml-1"
								style={{ color: themeColors.secondary }}
							>
								·{' '}
								{driver?.vehicle
									? `${driver.vehicle.make} ${driver.vehicle.model}`
									: 'viatura'}
							</Text>
						</View>
					</View>
					<View
						className="rounded-full px-2.5 py-1"
						style={{ backgroundColor: themeColors.primary }}
					>
						<Text
							className="font-sansMedium text-body-xs"
							style={{ color: themeColors.text }}
						>
							Motorista
						</Text>
					</View>
					<Ionicons
						name="chevron-forward"
						size={16}
						color={themeColors.border}
						style={{ marginLeft: 8 }}
					/>
				</Pressable>

				<View
					className="border-t"
					style={{ borderColor: themeColors.border }}
				/>

				<View className="px-4 py-3">
					<Text
						className="font-sansMedium text-body-xs"
						style={{ color: themeColors.secondary }}
					>
						A bordo contigo · {passengers.length}
					</Text>
					{passengers.length === 0 ? (
						<Text
							className="font-sans text-body-xs mt-1"
							style={{ color: themeColors.secondary }}
						>
							Só tu a bordo por agora.
						</Text>
					) : (
						passengers.map((u) => (
							<Pressable
								key={u.id}
								onPress={() => onPressUser(u.id)}
								className="flex-row items-center mt-2.5"
								style={({ pressed }) => ({
									opacity: pressed ? 0.7 : 1,
								})}
							>
								<Avatar
									initials={initials(u.firstName, u.lastName)}
									size={36}
								/>
								<Text
									className="font-sansMedium text-body-small flex-1 ml-3"
									style={{ color: themeColors.text }}
								>
									{u.firstName} {u.lastName}
								</Text>
								<Text
									className="font-sansMedium text-body-xs"
									style={{ color: themeColors.secondary }}
								>
									★ {u.rating?.toFixed(1) ?? 'novo'}
								</Text>
								<Ionicons
									name="chevron-forward"
									size={14}
									color={themeColors.border}
									style={{ marginLeft: 6 }}
								/>
							</Pressable>
						))
					)}
				</View>
			</View>
		</View>
	);
}
