import './global.css';
import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/lib/queryClient';
import { StatusBar } from 'expo-status-bar';
import { Appearance } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './src/lib/navigationRef';
import { useFonts as useHanken } from '@expo-google-fonts/hanken-grotesk';
import {
	HankenGrotesk_400Regular,
	HankenGrotesk_500Medium,
	HankenGrotesk_700Bold,
	HankenGrotesk_800ExtraBold,
} from '@expo-google-fonts/hanken-grotesk';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useThemeStore } from './src/store/themeStore';
import { useThemeColors } from './src/hooks/useThemeColors';
import {
	usePushRegistration,
	ensureAndroidChannel,
} from './src/hooks/usePushRegistration';
import RootNavigator from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import ToastHost from './src/components/ToastHost';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Notificação mostrada em primeiro plano: sem isto, o sistema entrega o push
// mas a app aberta não mostra nada, e o utilizador acha que não recebeu.
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowBanner: true,
		shouldShowList: true,
		shouldPlaySound: true,
		shouldSetBadge: true,
	}),
});

void ensureAndroidChannel();

export default function App() {
	const { theme } = useThemeStore();
	const { isDark } = useThemeColors();
	usePushRegistration();

	const [fontsLoaded] = useHanken({
		HankenGrotesk_400Regular,
		HankenGrotesk_500Medium,
		HankenGrotesk_700Bold,
		HankenGrotesk_800ExtraBold,
	});

	useEffect(() => {
		if (fontsLoaded) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded]);

	// Sincronizar a preferência do utilizador com a Appearance API
	useEffect(() => {
		if (theme === 'system') {
			Appearance.setColorScheme('unspecified'); // seguir o sistema
		} else {
			Appearance.setColorScheme(theme); // forçar light/dark
		}
	}, [theme]);

	if (!fontsLoaded) {
		return null;
	}

	return (
		<QueryClientProvider client={queryClient}>
			<SafeAreaProvider>
				<StatusBar style={isDark ? 'light' : 'dark'} />
				<ErrorBoundary>
					<NavigationContainer ref={navigationRef}>
						<RootNavigator />
					</NavigationContainer>
				</ErrorBoundary>
				<ToastHost />
			</SafeAreaProvider>
		</QueryClientProvider>
	);
}
