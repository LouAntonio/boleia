import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from '../types/navigation';
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import HistoryScreen from '../screens/main/HistoryScreen';
import AddressesScreen from '../screens/main/AddressesScreen';
import PaymentMethodsScreen from '../screens/main/PaymentMethodsScreen';
import PromotionsScreen from '../screens/main/PromotionsScreen';
import InfoScreen from '../screens/main/InfoScreen';
import ContactScreen from '../screens/main/ContactScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import TripRequestScreen from '../screens/main/TripRequestScreen';
import ActiveTripScreen from '../screens/main/ActiveTripScreen';
import TripDetailScreen from '../screens/main/TripDetailScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainNavigator() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name="Home" component={HomeScreen} />
			<Stack.Screen name="Profile" component={ProfileScreen} />
			<Stack.Screen name="History" component={HistoryScreen} />
			<Stack.Screen name="Addresses" component={AddressesScreen} />
			<Stack.Screen
				name="PaymentMethods"
				component={PaymentMethodsScreen}
			/>
			<Stack.Screen name="Promotions" component={PromotionsScreen} />
			<Stack.Screen name="Info" component={InfoScreen} />
			<Stack.Screen name="Contact" component={ContactScreen} />
			<Stack.Screen name="Settings" component={SettingsScreen} />
			<Stack.Screen name="TripRequest" component={TripRequestScreen} />
			<Stack.Screen name="ActiveTrip" component={ActiveTripScreen} />
			<Stack.Screen name="TripDetail" component={TripDetailScreen} />
		</Stack.Navigator>
	);
}
