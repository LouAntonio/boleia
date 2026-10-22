import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BoleiaRootStackParamList } from '../types/navigation';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import BoleiaAuthNavigator from './BoleiaAuthNavigator';
import BoleiaMainNavigator from './BoleiaMainNavigator';
import { useMagicLinkResume } from '../hooks/useMagicLinkResume';

const Stack = createNativeStackNavigator<BoleiaRootStackParamList>();

export default function RootNavigator() {
	/*
	 * O deep link do link mágico precisa de uma casa dentro do container de
	 * navegação: o hook escreve o cookie e depois navega de volta para a
	 * app. Montá-lo aqui e não no `App` garante que o `navigationRef` já tem
	 * um `Navigator` montado quando o reset corre.
	 */
	useMagicLinkResume();

	return (
		<Stack.Navigator
			initialRouteName="Splash"
			screenOptions={{ headerShown: false }}
		>
			<Stack.Screen name="Splash" component={SplashScreen} />
			<Stack.Screen name="Onboarding" component={OnboardingScreen} />
			<Stack.Screen name="Auth" component={BoleiaAuthNavigator} />
			<Stack.Screen name="App" component={BoleiaMainNavigator} />
		</Stack.Navigator>
	);
}
