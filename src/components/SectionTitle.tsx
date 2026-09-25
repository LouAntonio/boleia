import React from 'react';
import { Text } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

// Título de secção — `title/secondary` (22/110%, Medium), alinhado à
// esquerda, sem filete colorido: no sistema a hierarquia é tipográfica.
export default function SectionTitle({
	children,
}: {
	children: React.ReactNode;
}) {
	const { themeColors } = useThemeColors();
	return (
		<Text
			className="font-sansMedium text-title-secondary mb-2.5"
			style={{ color: themeColors.text }}
		>
			{children}
		</Text>
	);
}
