import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BoleiaAuthStackParamList } from '../types/navigation';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import OtpVerifyScreen from '../screens/auth/OtpVerifyScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';

const Stack = createNativeStackNavigator<BoleiaAuthStackParamList>();

export default function BoleiaAuthNavigator() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name="Login" component={LoginScreen} />
			<Stack.Screen name="Register" component={RegisterScreen} />
			<Stack.Screen
				name="ForgotPassword"
				component={ForgotPasswordScreen}
			/>
			<Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
			<Stack.Screen
				name="ResetPassword"
				component={ResetPasswordScreen}
			/>
			<Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
		</Stack.Navigator>
	);
}
