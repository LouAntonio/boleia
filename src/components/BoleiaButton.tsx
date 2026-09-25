import React, { useMemo } from 'react';
import { Text, Pressable, ActivityIndicator } from 'react-native';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
import { useThemeColors } from '../hooks/useThemeColors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Variantes do sistema Pixar: cada fundo tem o seu token `on*` de tinta
// (`primary`→`onPrimary`, `warning`→`onWarning`, `success`→`onSuccess`), de modo
// que a tinta nunca é derivada do fundo nem branco hardcoded. Os nomes
// históricos `dark`, `outline` e `ghost` mantêm-se para não quebrar as
// chamadas existentes.
type Variant =
	| 'primary'
	| 'secondary'
	| 'tertiary'
	| 'warning'
	| 'link'
	| 'dark'
	| 'outline'
	| 'ghost';

// Botão Boleia — accent cheio, sem brilho colorido, cantos 12, alvo de toque
// ≥44px, animação de press por escala. Sem: as labels do sistema
// são `label`/`labelSmall`.
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

	const resolved: Variant =
		variant === 'outline'
			? 'secondary'
			: variant === 'ghost'
				? 'link'
				: variant;

	const { bg, fg, borderColor, borderWidth } = useMemo(() => {
		if (disabled) {
			return {
				bg: themeColors.border,
				fg: themeColors.secondary,
				borderColor: 'transparent',
				borderWidth: 0,
			};
		}
		switch (resolved) {
			case 'primary':
				return {
					bg: themeColors.primary,
					fg: themeColors.onPrimary,
					borderColor: 'transparent',
					borderWidth: 0,
				};
			case 'warning':
				return {
					bg: themeColors.laterite,
					fg: themeColors.onWarning,
					borderColor: 'transparent',
					borderWidth: 0,
				};
			case 'dark':
				return {
					bg: themeColors.text,
					fg: themeColors.card,
					borderColor: 'transparent',
					borderWidth: 0,
				};
			case 'secondary':
				return {
					bg: themeColors.card,
					fg: themeColors.text,
					borderColor: themeColors.border,
					borderWidth: 1,
				};
			case 'tertiary':
				return {
					bg: 'transparent',
					fg: themeColors.text,
					borderColor: 'transparent',
					borderWidth: 0,
				};
			default:
				return {
					bg: 'transparent',
					fg: themeColors.primary,
					borderColor: 'transparent',
					borderWidth: 0,
				};
		}
	}, [resolved, disabled, themeColors]);

	const handlePressIn = () => {
		scale.value = withTiming(0.97, { duration: 100 });
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
			style={[
				{
					backgroundColor: bg,
					borderColor,
					borderWidth,
				},
				animatedStyle,
			]}
			className={`rounded-xl items-center justify-center flex-row ${
				small ? 'px-4 min-h-[44px]' : 'h-[52px] px-5'
			}`}
		>
			{loading ? (
				<ActivityIndicator color={fg} />
			) : (
				<Text
					className={
						strong
							? 'font-sansExtraBold text-label'
							: small
								? 'font-sansBold text-label-small'
								: 'font-sansBold text-label'
					}
					style={{ color: fg }}
				>
					{title}
				</Text>
			)}
		</AnimatedPressable>
	);
}
