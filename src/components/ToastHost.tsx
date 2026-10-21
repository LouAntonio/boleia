import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../hooks/useThemeColors';
import { useToastStore } from '../store/toastStore';

/**
 * Toast global, montado uma vez em `App`.
 *
 * Fica fora do `NavigationContainer` para sobreviver à navegação que acontece
 * logo depois de um OTP ser pedido. Um toque fecha-o antes do tempo.
 */
export default function ToastHost() {
	const toast = useToastStore((state) => state.toast);
	const hide = useToastStore((state) => state.hide);
	const { themeColors } = useThemeColors();
	const insets = useSafeAreaInsets();

	const [displayed, setDisplayed] = useState<string | null>(null);
	const opacity = useRef(new Animated.Value(0)).current;
	const translateY = useRef(new Animated.Value(-12)).current;

	useEffect(() => {
		opacity.stopAnimation();
		translateY.stopAnimation();

		if (toast) {
			setDisplayed(toast.message);
			Animated.parallel([
				Animated.timing(opacity, {
					toValue: 1,
					duration: 180,
					useNativeDriver: true,
				}),
				Animated.timing(translateY, {
					toValue: 0,
					duration: 180,
					useNativeDriver: true,
				}),
			]).start();
			return;
		}

		Animated.parallel([
			Animated.timing(opacity, {
				toValue: 0,
				duration: 150,
				useNativeDriver: true,
			}),
			Animated.timing(translateY, {
				toValue: -12,
				duration: 150,
				useNativeDriver: true,
			}),
		]).start(({ finished }) => {
			if (finished) setDisplayed(null);
		});
	}, [toast, opacity, translateY]);

	if (!displayed) return null;

	return (
		<View
			pointerEvents="box-none"
			style={[styles.layer, { paddingTop: insets.top + 12 }]}
		>
			<Animated.View style={{ opacity, transform: [{ translateY }] }}>
				<Pressable
					onPress={hide}
					accessibilityRole="button"
					accessibilityLabel="Fechar aviso"
					style={{
						backgroundColor: themeColors.card,
						borderColor: themeColors.border,
						borderWidth: 1,
						borderRadius: 12,
						paddingHorizontal: 16,
						paddingVertical: 12,
						shadowColor: '#000',
						shadowOpacity: 0.14,
						shadowOffset: { width: 0, height: 6 },
						shadowRadius: 14,
						elevation: 8,
					}}
				>
					<Text
						className="font-sansMedium text-body"
						style={{ color: themeColors.text }}
						accessibilityLiveRegion="polite"
					>
						{displayed}
					</Text>
				</Pressable>
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	layer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		zIndex: 1000,
		paddingHorizontal: 20,
	},
});
