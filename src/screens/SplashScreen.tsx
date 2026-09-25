import React, { useEffect, useRef, useState } from 'react';
import {
	View,
	Text,
	Animated,
	StyleSheet,
	AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../hooks/useThemeColors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { BoleiaRootStackParamList } from '../types/navigation';
import { useAppStore } from '../store/appStore';
import { fetchSession } from '../lib/api';

const NODE = 14;
const R = NODE / 2;
const RAIL_H = 30;
const TRACK_H = 3;

// Splash — "o primeiro trajeto": o wordmark entra primeiro e a linha
// da estrada (a cor de marca é o traço central) desenha-se de origem a
// destino, com um marcador de estado no final. Wordmark em Hanken 800.
export default function SplashScreen({
	duration = 2000,
}: {
	duration?: number;
}) {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaRootStackParamList, 'Splash'>
		>();
	const { themeColors } = useThemeColors();
	const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
	const [railWidth, setRailWidth] = useState(0);

	const progress = useRef(new Animated.Value(0)).current;
	const wordmarkOpacity = useRef(new Animated.Value(0)).current;
	const wordmarkTranslate = useRef(new Animated.Value(14)).current;
	const captionOpacity = useRef(new Animated.Value(0)).current;
	const stampOpacity = useRef(new Animated.Value(0)).current;
	const stampScale = useRef(new Animated.Value(0.6)).current;

	useEffect(() => {
		let mounted = true;
		AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
			if (mounted) {
				setReduceMotion(enabled);
			}
		});
		return () => {
			mounted = false;
		};
	}, []);

	useEffect(() => {
		if (reduceMotion === true) {
			progress.setValue(1);
			wordmarkOpacity.setValue(1);
			wordmarkTranslate.setValue(0);
			captionOpacity.setValue(1);
			stampOpacity.setValue(1);
			stampScale.setValue(1);
		} else {
			Animated.sequence([
				Animated.parallel([
					Animated.timing(wordmarkOpacity, {
						toValue: 1,
						duration: 450,
						useNativeDriver: true,
					}),
					Animated.timing(wordmarkTranslate, {
						toValue: 0,
						duration: 450,
						useNativeDriver: true,
					}),
				]),
				Animated.parallel([
					Animated.timing(progress, {
						toValue: 1,
						duration: 900,
						useNativeDriver: true,
					}),
					Animated.timing(captionOpacity, {
						toValue: 1,
						duration: 400,
						useNativeDriver: true,
					}),
				]),
				Animated.parallel([
					Animated.timing(stampOpacity, {
						toValue: 1,
						duration: 200,
						useNativeDriver: true,
					}),
					Animated.spring(stampScale, {
						toValue: 1,
						friction: 5,
						tension: 160,
						useNativeDriver: true,
					}),
				]),
			]).start();
		}

		const timer = setTimeout(async () => {
			const { authenticated, onboardingSeen } = useAppStore.getState();
			let authed = authenticated;
			if (authed) {
				// Confirma se o token guardado ainda corresponde a uma sessão
				// válida no servidor (sessões revogadas -> logout).
				const session = await fetchSession();
				authed = Boolean(session);
				if (!authed) {
					useAppStore.getState().signOut();
				}
			}
			if (authed) {
				navigation.replace('App', { screen: 'Main' });
			} else if (onboardingSeen) {
				navigation.replace('Auth', { screen: 'Login' });
			} else {
				navigation.replace('Onboarding');
			}
		}, duration - 300);

		return () => clearTimeout(timer);
	}, [
		reduceMotion,
		duration,
		navigation,
		progress,
		wordmarkOpacity,
		wordmarkTranslate,
		captionOpacity,
		stampOpacity,
		stampScale,
	]);

	const fillTranslateX = progress.interpolate({
		inputRange: [0, 1],
		outputRange: [-railWidth, 0],
	});

	return (
		<SafeAreaView
			className="flex-1 justify-center items-center px-8"
			style={{ backgroundColor: themeColors.background }}
		>
			<Animated.View
				style={{
					opacity: wordmarkOpacity,
					transform: [{ translateY: wordmarkTranslate }],
				}}
			>
				<Text
					className="font-sansExtraBold text-[56px] tracking-tight"
					// eslint-disable-next-line react-native/no-inline-styles
					style={{ color: themeColors.text, lineHeight: 64 }}
				>
					Boleia
				</Text>
			</Animated.View>

			<View
				className="flex-row items-center justify-center w-full mt-10"
				// eslint-disable-next-line react-native/no-inline-styles
				style={{ paddingHorizontal: 8 }}
			>
				<Text
					numberOfLines={1}
					className="font-sansMedium text-body-xs"
					style={{ color: themeColors.text }}
				>
					06:00 · Luanda
				</Text>

				<View
					style={styles.rail}
					onLayout={(e) => setRailWidth(e.nativeEvent.layout.width)}
				>
					<View
						style={[
							styles.track,
							{ borderTopColor: themeColors.border },
						]}
					/>
					<Animated.View
						style={[
							styles.fill,
							{
								width: railWidth,
								backgroundColor: themeColors.primary,
								transform: [{ translateX: fillTranslateX }],
							},
						]}
					/>
					<View
						style={[
							styles.node,
							{
								left: -R,
								backgroundColor: themeColors.text,
							},
						]}
					/>
					<Animated.View
						style={[
							styles.node,
							{
								left: railWidth - R,
								backgroundColor: themeColors.laterite,
								opacity: stampOpacity,
								transform: [{ scale: stampScale }],
							},
						]}
					/>
				</View>

				<Text
					numberOfLines={1}
					className="font-sansMedium text-body-xs"
					style={{ color: themeColors.secondary }}
				>
					Benguela · 12:20
				</Text>
			</View>

			<Animated.View
				style={[styles.caption, { opacity: captionOpacity }]}
			>
				<Text
					className="font-sansMedium text-body-small"
					// eslint-disable-next-line react-native/no-inline-styles
					style={{ color: themeColors.secondary }}
				>
					Mobilidade interprovincial
				</Text>
			</Animated.View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	rail: {
		flex: 1,
		height: RAIL_H,
		marginHorizontal: 14,
		justifyContent: 'center',
		overflow: 'hidden',
	},
	track: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: (RAIL_H - TRACK_H) / 2,
		borderStyle: 'dashed',
		borderTopWidth: TRACK_H,
	},
	fill: {
		position: 'absolute',
		left: 0,
		top: (RAIL_H - TRACK_H) / 2,
		height: TRACK_H,
		borderRadius: TRACK_H / 2,
	},
	node: {
		position: 'absolute',
		top: (RAIL_H - NODE) / 2,
		width: NODE,
		height: NODE,
		borderRadius: R,
	},
	caption: {
		marginTop: 26,
	},
});
