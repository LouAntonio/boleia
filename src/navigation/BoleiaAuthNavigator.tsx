import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BoleiaAuthStackParamList } from '../types/navigation';
import PhoneEntryScreen from '../screens/auth/PhoneEntryScreen';
import OtpVerifyScreen from '../screens/auth/OtpVerifyScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';

const Stack = createNativeStackNavigator<BoleiaAuthStackParamList>();

export default function BoleiaAuthNavigator() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
			<Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
			<Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
		</Stack.Navigator>
	);
}
