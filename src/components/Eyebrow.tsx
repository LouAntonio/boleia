import React from 'react';
import { Text } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

// Cílio de secção Boleia viva — microcopy laterite em maiúsculas, sem
// traços nem pontos. Uma só assinatura para todas as telas.
export default function Eyebrow({ children }: { children: React.ReactNode }) {
	const { themeColors } = useThemeColors();
	return (
		<Text
			className="font-mono text-[10px] uppercase tracking-[2px]"
			style={{ color: themeColors.laterite }}
		>
			{children}
		</Text>
	);
}
