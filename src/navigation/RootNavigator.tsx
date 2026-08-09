import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BoleiaRootStackParamList } from '../types/navigation';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import BoleiaAuthNavigator from './BoleiaAuthNavigator';
import BoleiaMainNavigator from './BoleiaMainNavigator';

const Stack = createNativeStackNavigator<BoleiaRootStackParamList>();

export default function RootNavigator() {
	return (
		<Stack.Navigator
			initialRouteName="Splash"
			screenOptions={{ headerShown: false }}
		>
			<Stack.Screen name="Splash" component={SplashScreen} />
			<Stack.Screen name="Onboarding" component={OnboardingScreen} />
			<Stack.Screen name="Auth" component={BoleiaAuthNavigator} />
			<Stack.Screen name="Main" component={BoleiaMainNavigator} />
		</Stack.Navigator>
	);
}
