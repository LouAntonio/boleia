import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import Eyebrow from './Eyebrow';

// Cabeçalho padrão de ecrã — cílio laterite + título display grande +
// linha de contexto em texto corrido.
export default function ScreenHeader({
	eyebrow,
	title,
	meta,
}: {
	eyebrow: string;
	title: string;
	meta?: string | null;
}) {
	const { themeColors } = useThemeColors();
	return (
		<View className="mt-2">
			<Eyebrow>{eyebrow}</Eyebrow>
			<Text
				className="font-display text-[26px] leading-8 mt-1.5"
				style={{ color: themeColors.text }}
			>
				{title}
			</Text>
			{meta ? (
				<Text
					className="font-sans text-[13px] mt-1"
					style={{ color: themeColors.secondary }}
				>
					{meta}
				</Text>
			) : null}
		</View>
	);
}
