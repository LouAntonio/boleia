import React from 'react';
import { Text } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

// Rótulo de grupo — `txt/weak` sobre uma superfície normal. Substitui o antigo
// "cílio" Boleia: a hierarquia passa a ser tipográfica, sem cor de assinatura.
export default function GroupLabel({
	children,
}: {
	children: React.ReactNode;
}) {
	const { themeColors } = useThemeColors();
	return (
		<Text
			className="font-sansBold text-body-small"
			style={{ color: themeColors.secondary }}
		>
			{children}
		</Text>
	);
}
