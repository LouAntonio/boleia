import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { useDbStore } from '../../mock/db';
import { useAppStore } from '../../store/appStore';
import { fmtDate } from '../../mock/helpers';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
	ride: 'car-outline',
	booking: 'ticket-outline',
	payment: 'wallet-outline',
	system: 'information-circle-outline',
};

export default function NotificationsScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'Notifications'>
		>();
	const { themeColors } = useThemeColors();
	const currentRole = useAppStore((s) => s.currentRole);
	const allNotifications = useDbStore((s) => s.db.notifications);
	const notifications = useMemo(
		() =>
			allNotifications
				.filter((n) => n.userId === 'u_me_001')
				.sort(
					(a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
				),
		[allNotifications],
	);

	const open = (n: (typeof notifications)[number]) => {
		useDbStore.getState().mutate((db) => {
			const found = db.notifications.find((x) => x.id === n.id);
			if (found) found.read = true;
		});
		const rideId = n.data?.rideId;
		if (rideId) {
			const ride = useDbStore
				.getState()
				.db.rides.find((r) => r.id === rideId);
			if (ride) {
				if (currentRole === 'driver' && ride.driverId === 'u_me_001') {
					navigation.navigate('RideDetail', { rideId });
				} else {
					navigation.navigate('RideDetail', { rideId });
				}
			}
		}
	};

	return (
		<SafeAreaView
			className="flex-1 px-5"
			style={{ backgroundColor: themeColors.background }}
		>
			<View className="flex-row items-center pt-2 pb-3">
				<Pressable
					onPress={() => navigation.goBack()}
					className="w-9 h-9 rounded-full items-center justify-center border mr-3"
					style={{
						borderColor: themeColors.border,
						backgroundColor: themeColors.card,
					}}
				>
					<Ionicons
						name="chevron-back"
						size={18}
						color={themeColors.text}
					/>
				</Pressable>
				<Text
					className="font-display text-[20px]"
					style={{ color: themeColors.text }}
				>
					Notificações
				</Text>
			</View>

			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				{notifications.length === 0 ? (
					<Text
						className="font-sans text-[13px]"
						style={{ color: themeColors.secondary }}
					>
						Ainda não há notificações.
					</Text>
				) : (
					notifications.map((n) => (
						<Pressable
							key={n.id}
							onPress={() => open(n)}
							className="p-4 rounded-2xl border mb-2 flex-row"
							style={{
								borderColor: n.read
									? themeColors.border
									: themeColors.laterite,
								backgroundColor: themeColors.card,
								opacity: n.read ? 0.75 : 1,
							}}
						>
							<View
								className="w-10 h-10 rounded-full items-center justify-center mr-3"
								style={{
									backgroundColor: themeColors.background,
								}}
							>
								<Ionicons
									name={
										ICONS[n.kind] ??
										'information-circle-outline'
									}
									size={20}
									color={themeColors.laterite}
								/>
							</View>
							<View className="flex-1">
								<View className="flex-row items-center justify-between">
									<Text
										className="font-sansBold text-[14px]"
										style={{ color: themeColors.text }}
									>
										{n.title}
									</Text>
									<Text
										className="font-mono text-[10px] ml-2"
										style={{ color: themeColors.secondary }}
									>
										{fmtDate(n.createdAt)}
									</Text>
								</View>
								<Text
									className="font-sans text-[13px] mt-0.5 leading-5"
									style={{ color: themeColors.secondary }}
								>
									{n.message}
								</Text>
							</View>
						</Pressable>
					))
				)}
			</ScrollView>
		</SafeAreaView>
	);
}
