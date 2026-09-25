import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DriverTabsParamList } from '../types/navigation';
import HomeScreen from '../screens/boleia/HomeScreen';
import PublishScreen from '../screens/boleia/PublishScreen';
import TripsScreen from '../screens/boleia/TripsScreen';
import ProfileScreen from '../screens/boleia/ProfileScreen';
import { useThemeColors } from '../hooks/useThemeColors';
import PillTabBarButton from './PillTabBarButton';

const Tab = createBottomTabNavigator<DriverTabsParamList>();

export default function DriverTabs() {
	const { themeColors } = useThemeColors();
	return (
		<Tab.Navigator
			screenOptions={{
				headerShown: false,
				tabBarButton: PillTabBarButton,
				tabBarActiveTintColor: themeColors.primary,
				tabBarInactiveTintColor: themeColors.secondary,
				tabBarStyle: {
					backgroundColor: themeColors.card,
					borderTopColor: themeColors.border,
				},
				tabBarLabelStyle: {
					fontFamily: 'HankenGrotesk_500Medium',
					fontSize: 12,
				},
			}}
		>
			<Tab.Screen
				name="DriverHome"
				component={HomeScreen}
				options={{
					tabBarLabel: 'Painel',
					tabBarIcon: ({ color, size }) => (
						<Ionicons
							name="speedometer-outline"
							size={size}
							color={color}
						/>
					),
				}}
			/>
			<Tab.Screen
				name="DriverPublish"
				component={PublishScreen}
				options={{
					tabBarLabel: 'Publicar',
					tabBarIcon: ({ color, size }) => (
						<Ionicons
							name="add-circle-outline"
							size={size}
							color={color}
						/>
					),
				}}
			/>
			<Tab.Screen
				name="DriverTrips"
				component={TripsScreen}
				options={{
					tabBarLabel: 'Viagens',
					tabBarIcon: ({ color, size }) => (
						<Ionicons
							name="list-outline"
							size={size}
							color={color}
						/>
					),
				}}
			/>
			<Tab.Screen
				name="DriverProfile"
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
