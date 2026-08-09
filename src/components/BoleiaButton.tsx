import React from 'react';
import { Text, Pressable, ActivityIndicator } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

type Variant = 'primary' | 'dark' | 'outline' | 'ghost';

// Botão Boleia — cantos 12, sem uppercase forçado (microcopy PT-AO)
export default function BoleiaButton({
	title,
	onPress,
	variant = 'primary',
	disabled = false,
	loading = false,
	small = false,
}: {
	title: string;
	onPress: () => void;
	variant?: Variant;
	disabled?: boolean;
	loading?: boolean;
	small?: boolean;
}) {
	const { themeColors } = useThemeColors();

	const bg: Record<Variant, string | undefined> = {
		primary: disabled ? themeColors.border : themeColors.primary,
		dark: disabled ? themeColors.border : themeColors.text,
		outline: 'transparent',
		ghost: 'transparent',
	};
	const fg: Record<Variant, string> = {
		primary: disabled ? themeColors.secondary : themeColors.text,
		dark: disabled ? themeColors.secondary : themeColors.card,
		outline: disabled ? themeColors.border : themeColors.text,
		ghost: disabled ? themeColors.border : themeColors.laterite,
	};

	return (
		<Pressable
			onPress={onPress}
			disabled={disabled || loading}
			style={({ pressed }) => ({
				backgroundColor: bg[variant],
				borderColor:
					variant === 'outline' ? themeColors.text : 'transparent',
				borderWidth: variant === 'outline' ? 1.5 : 0,
				opacity: pressed ? 0.85 : 1,
			})}
			className={`rounded-xl items-center justify-center flex-row ${
				small ? 'px-3 py-2' : 'py-3.5'
			}`}
		>
			{loading ? (
				<ActivityIndicator color={fg[variant]} />
			) : (
				<Text
					className={
						small
							? 'font-sansBold text-[13px]'
							: 'font-sansBold text-[15px]'
					}
					style={{ color: fg[variant] }}
				>
					{title}
				</Text>
			)}
		</Pressable>
	);
}
