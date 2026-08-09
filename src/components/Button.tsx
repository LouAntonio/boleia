import React, { useMemo, useCallback } from 'react';
import { Text, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
import { useThemeColors } from '../hooks/useThemeColors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ButtonProps {
	title: string;
	onPress: () => void;
	variant?: 'primary' | 'secondary' | 'outline';
	loading?: boolean;
	disabled?: boolean;
	className?: string;
}

export default function Button({
	title,
	onPress,
	variant = 'primary',
	loading = false,
	disabled = false,
	className = '',
}: ButtonProps) {
	const { themeColors } = useThemeColors();
	const scale = useSharedValue(1);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const getBackgroundColor = useCallback(() => {
		if (disabled) return themeColors.border;
		if (variant === 'primary') return themeColors.primary;
		if (variant === 'secondary') return themeColors.secondary;
		return 'transparent';
	}, [disabled, variant, themeColors]);

	const getTextColor = useCallback(() => {
		if (disabled) return themeColors.secondary;
		if (variant === 'primary') return '#000000'; // Pure black
		if (variant === 'secondary') return '#FFFFFF';
		return themeColors.primary;
	}, [disabled, variant, themeColors]);

	const containerStyle = useMemo(
		() => ({
			backgroundColor: getBackgroundColor(),
			borderColor:
				variant === 'outline' ? themeColors.primary : 'transparent',
			borderWidth: variant === 'outline' ? 2 : 0,
			shadowColor: variant === 'primary' ? themeColors.primary : '#000',
			shadowOpacity: variant === 'primary' ? 0.3 : 0.1,
		}),
		[variant, themeColors, getBackgroundColor],
	);

	const textStyle = useMemo(
		() => ({ color: getTextColor() }),
		[getTextColor],
	);

	const handlePressIn = () => {
		scale.value = withTiming(0.96, { duration: 100 });
	};

	const handlePressOut = () => {
		scale.value = withSpring(1);
	};

	return (
		<AnimatedPressable
			onPress={onPress}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			disabled={disabled || loading}
			style={[styles.base, containerStyle, animatedStyle]}
			className={`w-full rounded-2xl items-center flex-row justify-center ${className}`}
		>
			{loading ? (
				<ActivityIndicator color={getTextColor()} />
			) : (
				<Text
					className="text-lg font-black tracking-wider"
					style={[styles.text, textStyle]}
				>
					{title}
				</Text>
			)}
		</AnimatedPressable>
	);
}

const styles = StyleSheet.create({
	base: {
		height: 58,
		shadowOffset: { width: 0, height: 4 },
		shadowRadius: 10,
		elevation: 5,
	},
	text: {
		textTransform: 'uppercase',
	},
});
