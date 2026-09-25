import React from 'react';
import { View } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

// Barra de acção fixa — banda `neutral/bg/strong` (a tinta do produto) com
// separador `border`. O conteúdo compõe-se com texto em `card` e CTA
// primário. Último filho do SafeAreaView, fora do ScrollView.
export default function StickyCta({ children }: { children: React.ReactNode }) {
	const { themeColors } = useThemeColors();
	return (
		<View
			className="px-4 pt-4 pb-6"
			style={{
				backgroundColor: themeColors.text,
				borderTopWidth: 1,
				borderTopColor: themeColors.border,
			}}
		>
			{children}
		</View>
	);
}
