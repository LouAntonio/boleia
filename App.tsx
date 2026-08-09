import './global.css';
import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/lib/queryClient';
import { StatusBar } from 'expo-status-bar';
import { Appearance, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './src/lib/navigationRef';
import { useFonts as useHanken } from '@expo-google-fonts/hanken-grotesk';
import {
	HankenGrotesk_400Regular,
	HankenGrotesk_500Medium,
	HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';
import {
	BricolageGrotesque_700Bold,
	BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono';
import * as SplashScreen from 'expo-splash-screen';
import { useThemeStore } from './src/store/themeStore';
import { useThemeColors } from './src/hooks/useThemeColors';
import RootNavigator from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
	const { theme } = useThemeStore();
	const { isDark } = useThemeColors();

	const [fontsLoaded] = useHanken({
		HankenGrotesk_400Regular,
		HankenGrotesk_500Medium,
		HankenGrotesk_700Bold,
		BricolageGrotesque_700Bold,
		BricolageGrotesque_800ExtraBold,
		IBMPlexMono_400Regular,
	});

	useEffect(() => {
		if (fontsLoaded) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded]);

	// Sincronizar a preferência do utilizador com a Appearance API
	useEffect(() => {
		if (theme === 'system') {
			Appearance.setColorScheme(null); // seguir o sistema
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
