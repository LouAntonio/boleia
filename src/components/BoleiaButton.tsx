import React, { useMemo } from 'react';
import { Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
import { useThemeColors } from '../hooks/useThemeColors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Variant = 'primary' | 'dark' | 'outline' | 'ghost';

// Botão Boleia — ouro com texto asfalto, animação de press (escala) e glow.
// `strong` aplica o estilo FDA: uppercase + tracking. Cantos 12, microcopy PT-AO.
export default function BoleiaButton({
	title,
	onPress,
	variant = 'primary',
	disabled = false,
	loading = false,
	small = false,
	strong = false,
}: {
	title: string;
	onPress: () => void;
	variant?: Variant;
	disabled?: boolean;
	loading?: boolean;
	small?: boolean;
	strong?: boolean;
}) {
	const { themeColors } = useThemeColors();
	const scale = useSharedValue(1);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const fg: Record<Variant, string> = {
		primary: disabled ? themeColors.secondary : themeColors.text,
		dark: disabled ? themeColors.secondary : themeColors.card,
		outline: disabled ? themeColors.border : themeColors.text,
		ghost: disabled ? themeColors.border : themeColors.laterite,
	};

	const containerStyle = useMemo(() => {
		const bg: Record<Variant, string | undefined> = {
			primary: disabled ? themeColors.border : themeColors.primary,
			dark: disabled ? themeColors.border : themeColors.text,
			outline: 'transparent',
			ghost: 'transparent',
		};
		return {
			backgroundColor: bg[variant],
			borderColor:
				variant === 'outline' ? themeColors.text : 'transparent',
			borderWidth: variant === 'outline' ? 1.5 : 0,
			shadowColor:
				variant === 'primary' && !disabled
					? themeColors.primary
					: 'transparent',
			shadowOpacity: variant === 'primary' && !disabled ? 0.35 : 0,
			shadowOffset: { width: 0, height: 4 },
			shadowRadius: 10,
			elevation: variant === 'primary' && !disabled ? 5 : 0,
		};
	}, [variant, disabled, themeColors]);

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
			className={`rounded-xl items-center justify-center flex-row ${
				small ? 'px-3 py-2' : 'h-[58px]'
			}`}
		>
			{loading ? (
				<ActivityIndicator color={fg[variant]} />
			) : (
				<Text
					className={
						small
							? 'font-sansBold text-[13px]'
							: strong
								? 'font-sansBold text-[15px] uppercase tracking-wider'
								: 'font-sansBold text-[15px]'
					}
					style={{ color: fg[variant] }}
				>
					{title}
				</Text>
			)}
		</AnimatedPressable>
	);
}

const styles = StyleSheet.create({
	base: {
		shadowRadius: 10,
	},
});
