import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

// Cabeçalho padrão de ecrã — `title/primary` (28/110%, ExtraBold) como
// hierarquia principal e a meta em `body/small`. Sem cor de destaque no
// subtítulo: a cor é reservada a estados, não estáveis.
export default function ScreenHeader({
	title,
	meta,
}: {
	title: string;
	meta?: string | null;
}) {
	const { themeColors } = useThemeColors();
	return (
		<View className="mt-2">
			<Text
				className="font-sansExtraBold text-title-primary"
				style={{ color: themeColors.text }}
			>
				{title}
			</Text>
			{meta ? (
				<Text
					className="font-sans text-body-small mt-1"
					style={{ color: themeColors.secondary }}
				>
					{meta}
				</Text>
			) : null}
		</View>
	);
}
