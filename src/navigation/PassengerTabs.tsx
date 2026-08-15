import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { PassengerTabsParamList } from '../types/navigation';
import HomeScreen from '../screens/boleia/HomeScreen';
import BookingsScreen from '../screens/boleia/BookingsScreen';
import ProfileScreen from '../screens/boleia/ProfileScreen';
import { useThemeColors } from '../hooks/useThemeColors';

const Tab = createBottomTabNavigator<PassengerTabsParamList>();

export default function PassengerTabs() {
	const { themeColors } = useThemeColors();
	return (
		<Tab.Navigator
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: themeColors.text,
				tabBarInactiveTintColor: themeColors.border,
				tabBarStyle: {
					backgroundColor: themeColors.card,
					borderTopColor: themeColors.border,
				},
				tabBarLabelStyle: {
					fontFamily: 'HankenGrotesk_500Medium',
					fontSize: 11,
				},
			}}
		>
			<Tab.Screen
				name="PassengerHome"
				component={HomeScreen}
				options={{
					tabBarLabel: 'Início',
					tabBarIcon: ({ color, size }) => (
						<Ionicons
							name="home-outline"
							size={size}
							color={color}
						/>
					),
				}}
			/>
			<Tab.Screen
				name="PassengerBookings"
				component={BookingsScreen}
				options={{
					tabBarLabel: 'Reservas',
					tabBarIcon: ({ color, size }) => (
						<Ionicons
							name="ticket-outline"
							size={size}
							color={color}
						/>
					),
				}}
			/>
			<Tab.Screen
				name="PassengerProfile"
				component={ProfileScreen}
				options={{
					tabBarLabel: 'Perfil',
					tabBarIcon: ({ color, size }) => (
						<Ionicons
							name="person-circle-outline"
							size={size}
							color={color}
						/>
					),
				}}
			/>
		</Tab.Navigator>
	);
}
