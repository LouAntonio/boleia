import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
	return (
		<Stack.Navigator
			initialRouteName="Splash"
			screenOptions={{ headerShown: false }}
		>
			<Stack.Screen name="Splash" component={SplashScreen} />
			<Stack.Screen name="Onboarding" component={OnboardingScreen} />
			<Stack.Screen name="Auth" component={AuthNavigator} />
			<Stack.Screen name="Main" component={MainNavigator} />
		</Stack.Navigator>
	);
}
