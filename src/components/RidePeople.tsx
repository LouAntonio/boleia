import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import { initials } from '../mock/helpers';
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
				className="font-sansMedium text-[12px] uppercase tracking-wider mb-1.5"
				style={{ color: themeColors.laterite }}
			>
				Quem vai contigo
			</Text>
			<View
				className="rounded-2xl border overflow-hidden"
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
					<View
						className="w-11 h-11 rounded-full items-center justify-center"
						style={{
							backgroundColor: themeColors.primary,
							borderWidth: 2,
							borderColor: themeColors.laterite,
						}}
					>
						<Text
							className="font-display text-[15px]"
							style={{ color: themeColors.text }}
						>
							{driver
								? initials(driver.firstName, driver.lastName)
								: '?'}
						</Text>
					</View>
					<View className="flex-1 ml-3">
						<Text
							className="font-sansBold text-[14px]"
							style={{ color: themeColors.text }}
						>
							{driver
								? `${driver.firstName} ${driver.lastName}`
								: '—'}
						</Text>
						<View className="flex-row items-center mt-0.5">
							<Text
								className="font-mono text-[12px]"
								style={{ color: themeColors.laterite }}
							>
								★ {driver?.rating?.toFixed(1) ?? 'novo'}
							</Text>
							<Text
								className="font-mono text-[12px] ml-1"
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
							className="font-mono text-[9px] uppercase tracking-[1.5px]"
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
						className="font-mono text-[9px] uppercase tracking-[2px]"
						style={{ color: themeColors.secondary }}
					>
						A bordo contigo · {passengers.length}
					</Text>
					{passengers.length === 0 ? (
						<Text
							className="font-sans text-[12px] mt-1"
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
								<View
									className="w-9 h-9 rounded-full items-center justify-center"
									style={{
										backgroundColor: themeColors.border,
									}}
								>
									<Text
										className="font-sansBold text-[11px]"
										style={{ color: themeColors.text }}
									>
										{initials(u.firstName, u.lastName)}
									</Text>
								</View>
								<Text
									className="font-sansMedium text-[13px] flex-1 ml-3"
									style={{ color: themeColors.text }}
								>
									{u.firstName} {u.lastName}
								</Text>
								<Text
									className="font-mono text-[11px]"
									style={{ color: themeColors.laterite }}
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
