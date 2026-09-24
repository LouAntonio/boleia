import React from 'react';
import { View } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

// Barra de ação fixa — banda sólida escura de fundo cheio. O conteúdo
// compõe-se com tinta clara (`card`) e CTA ouro. Último filho do
// SafeAreaView, fora do ScrollView (Publicar e Detalhe).
export default function StickyCta({ children }: { children: React.ReactNode }) {
	const { themeColors } = useThemeColors();
	return (
		<View
			className="px-5 pt-4 pb-6"
			style={{ backgroundColor: themeColors.text }}
		>
			{children}
		</View>
	);
}
