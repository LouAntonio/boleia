import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../types/navigation';
import { useAppStore } from '../store/appStore';
import PassengerTabs from './PassengerTabs';
import DriverTabs from './DriverTabs';
import KycScreen from '../screens/boleia/KycScreen';
import VehicleScreen from '../screens/boleia/VehicleScreen';
import PublishTripScreen from '../screens/boleia/PublishTripScreen';
import RideDetailScreen from '../screens/boleia/RideDetailScreen';
import PublicProfileScreen from '../screens/boleia/PublicProfileScreen';
import ActiveRideScreen from '../screens/boleia/ActiveRideScreen';
import ReviewScreen from '../screens/boleia/ReviewScreen';
import NotificationsScreen from '../screens/boleia/NotificationsScreen';
import { advanceLive } from '../mock/repos/liveRepo';

const Stack = createNativeStackNavigator<BoleiaMainStackParamList>();

// "Main" troca de tabs conforme o papel; ecrãs de detalhe ficam no mesmo stack.
export default function BoleiaMainNavigator() {
	const currentRole = useAppStore((s) => s.currentRole);

	// Simulação "ao vivo": avança as viagens em curso enquanto a app está aberta.
	useEffect(() => {
		const timer = setInterval(advanceLive, 7000);
		return () => clearInterval(timer);
	}, []);

	return (
		<Stack.Navigator
			screenOptions={{
				headerShown: false,
				animation: 'slide_from_right',
			}}
		>
			<Stack.Screen name="Main" options={{ headerShown: false }}>
				{() =>
					currentRole === 'driver' ? (
						<DriverTabs />
					) : (
						<PassengerTabs />
					)
				}
			</Stack.Screen>
			<Stack.Screen name="Kyc" component={KycScreen} />
			<Stack.Screen name="Vehicle" component={VehicleScreen} />
			<Stack.Screen name="PublishTrip" component={PublishTripScreen} />
			<Stack.Screen name="RideDetail" component={RideDetailScreen} />
			<Stack.Screen
				name="PublicProfile"
				component={PublicProfileScreen}
			/>
			<Stack.Screen name="ActiveRide" component={ActiveRideScreen} />
			<Stack.Screen name="Review" component={ReviewScreen} />
			<Stack.Screen
				name="Notifications"
				component={NotificationsScreen}
			/>
		</Stack.Navigator>
	);
}
