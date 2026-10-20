import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../types/navigation';
import { useAppStore } from '../store/appStore';
import PassengerTabs from './PassengerTabs';
import DriverTabs from './DriverTabs';
import KycScreen from '../screens/boleia/KycScreen';
import VehicleScreen from '../screens/boleia/VehicleScreen';
import AccountScreen from '../screens/boleia/AccountScreen';
import PublishTripScreen from '../screens/boleia/PublishTripScreen';
import RideDetailScreen from '../screens/boleia/RideDetailScreen';
import DriverTripScreen from '../screens/boleia/DriverTripScreen';
import PublicProfileScreen from '../screens/boleia/PublicProfileScreen';
import ActiveRideScreen from '../screens/boleia/ActiveRideScreen';
import SosCenterScreen from '../screens/boleia/SosCenterScreen';
import ReviewScreen from '../screens/boleia/ReviewScreen';
import NotificationsScreen from '../screens/boleia/NotificationsScreen';

const Stack = createNativeStackNavigator<BoleiaMainStackParamList>();

// "Main" troca de tabs conforme o papel; ecrãs de detalhe ficam no mesmo stack.
export default function BoleiaMainNavigator() {
	const currentRole = useAppStore((s) => s.currentRole);

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
			<Stack.Screen name="Account" component={AccountScreen} />
			<Stack.Screen name="PublishTrip" component={PublishTripScreen} />
			<Stack.Screen name="RideDetail" component={RideDetailScreen} />
			<Stack.Screen name="DriverTrip" component={DriverTripScreen} />
			<Stack.Screen
				name="PublicProfile"
				component={PublicProfileScreen}
			/>
			<Stack.Screen name="ActiveRide" component={ActiveRideScreen} />
			<Stack.Screen name="SosCenter" component={SosCenterScreen} />
			<Stack.Screen name="Review" component={ReviewScreen} />
			<Stack.Screen
				name="Notifications"
				component={NotificationsScreen}
			/>
		</Stack.Navigator>
	);
}
