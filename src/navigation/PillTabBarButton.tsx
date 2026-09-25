import React from 'react';
import {
	Pressable,
	PressableProps,
	AccessibilityState,
	StyleProp,
	ViewStyle,
	StyleSheet,
} from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

// Botão do tab bar em pílula — o item activo assenta em `accent/bg/weak`
// com o ícone e o rótulo em accent; o inactivo fica neutro. Alvo de toque
// ≥44px. Referência estável para `tabBarButton`, sem recriar a cada render.
export default function PillTabBarButton({
	accessibilityState,
	style,
	children,
	...rest
}: {
	accessibilityState?: AccessibilityState;
	style?: StyleProp<ViewStyle>;
	children?: React.ReactNode;
} & PressableProps) {
	const { themeColors } = useThemeColors();
	const selected = !!accessibilityState?.selected;
	return (
		<Pressable
			{...rest}
			accessibilityState={accessibilityState}
			style={[
				style,
				styles.pill,
				{
					backgroundColor: selected
						? themeColors.accentWeak
						: 'transparent',
				},
			]}
		>
			{children}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	pill: {
		borderRadius: 16,
		marginVertical: 6,
		marginHorizontal: 6,
	},
});
