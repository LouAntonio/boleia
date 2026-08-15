import React, { useEffect, useMemo } from 'react';
import { View, Text, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../hooks/useThemeColors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { BoleiaRootStackParamList } from '../types/navigation';
import { useAppStore } from '../store/appStore';
import RouteStrip from '../components/RouteStrip';

export default function SplashScreen({
	duration = 2000,
}: {
	duration?: number;
}) {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaRootStackParamList, 'Splash'>
		>();
	const fadeAnim = useMemo(() => new Animated.Value(0), []);

	const { themeColors } = useThemeColors();

	useEffect(() => {
		Animated.timing(fadeAnim, {
			toValue: 1,
			duration: 700,
			useNativeDriver: true,
		}).start();

		const timer = setTimeout(() => {
			const { authenticated, onboardingSeen } = useAppStore.getState();
			if (authenticated) {
				navigation.replace('App', { screen: 'Main' });
			} else if (onboardingSeen) {
				navigation.replace('Auth', { screen: 'Login' });
			} else {
				navigation.replace('Onboarding');
			}
		}, duration - 300);

		return () => clearTimeout(timer);
	}, [duration, navigation, fadeAnim]);

	return (
		<SafeAreaView
			className="flex-1 justify-center items-center px-8"
			style={{ backgroundColor: themeColors.background }}
		>
			<Animated.View
				className="items-center"
				style={{ opacity: fadeAnim }}
			>
				<View
					className="w-16 h-16 rounded-2xl items-center justify-center mb-6 border"
					style={{
						backgroundColor: themeColors.text,
						borderColor: themeColors.primary,
					}}
				>
					<View
						className="w-3 h-3 rounded-full"
						style={{ backgroundColor: themeColors.primary }}
					/>
				</View>

				<TextBoleia />
			</Animated.View>
		</SafeAreaView>
	);
}

// Nome próprio com geofirma — divisão manual p/ estilo display
function TextBoleia() {
	const { themeColors } = useThemeColors();
	return (
		<View className="items-center">
			<Text
				className="font-display text-[40px] tracking-tight"
				style={{ color: themeColors.text }}
			>
				Boleia
			</Text>
			<Text
				className="font-mono text-[11px] uppercase tracking-[3px] mt-1"
				style={{ color: themeColors.laterite }}
			>
				Mobilidade interprovincial
			</Text>
			<View className="opacity-60 mt-5">
				<RouteStrip
					origin={{
						place: 'Talatona',
						time: '06:00',
						km: '0 km',
						kind: 'origin',
					}}
					destination={{
						place: 'Benguela',
						time: '12:20',
						km: '480 km',
						kind: 'destination',
					}}
					progress={0}
					rowHeight={40}
				/>
			</View>
		</View>
	);
}
