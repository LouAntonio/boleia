import './global.css';
import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/lib/queryClient';
import { StatusBar } from 'expo-status-bar';
import { Appearance, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './src/lib/navigationRef';
import * as Notifications from 'expo-notifications';
import { useThemeStore } from './src/store/themeStore';
import { useThemeColors } from './src/hooks/useThemeColors';
import { registerPushTokenOnServer } from './src/services/notifications';
import RootNavigator from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';

type NotificationData = {
	type?: string;
	tripId?: string;
};

export default function App() {
	const { theme } = useThemeStore();
	const { isDark } = useThemeColors();

	// Registar push token no arranque
	useEffect(() => {
		registerPushTokenOnServer();
	}, []);

	// Deep linking de notificações push
	useEffect(() => {
		const sub = Notifications.addNotificationResponseReceivedListener(
			(response) => {
				const data = response.notification.request.content
					.data as NotificationData;

				if (!data.type || !navigationRef.isReady()) return;

				switch (data.type) {
					case 'trip_status':
					case 'trip_offer':
						if (data.tripId) {
							navigationRef.navigate('Main', {
								screen: 'ActiveTrip',
								params: { tripId: data.tripId },
							});
						}
						break;
					default:
						break;
				}
			},
		);

		return () => sub.remove();
	}, []);

	// Sincronizar a preferência do utilizador com a Appearance API
	useEffect(() => {
		if (theme === 'system') {
			Appearance.setColorScheme(null); // seguir o sistema
		} else {
			Appearance.setColorScheme(theme); // forçar light/dark
		}
	}, [theme]);

	return (
		<QueryClientProvider client={queryClient}>
			<SafeAreaProvider>
				<StatusBar
					style={isDark ? 'light' : 'dark'}
					backgroundColor={
						Platform.OS === 'android' ? 'transparent' : undefined
					}
				/>
				<ErrorBoundary>
					<NavigationContainer ref={navigationRef}>
						<RootNavigator />
					</NavigationContainer>
				</ErrorBoundary>
			</SafeAreaProvider>
		</QueryClientProvider>
	);
}
