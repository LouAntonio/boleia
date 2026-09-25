import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import Card from './Card';
import BoleiaButton from './BoleiaButton';

// Estado vazio padrão — cartão neutro, selo em `accentWeak`, título
// `title/secondary` e CTA primário. Nunca cor sozinha: sempre selo + texto.
export default function EmptyState({
	icon,
	title,
	copy,
	actionTitle,
	onAction,
}: {
	icon: keyof typeof Ionicons.glyphMap;
	title: string;
	copy: string;
	actionTitle?: string;
	onAction?: () => void;
}) {
	const { themeColors } = useThemeColors();
	return (
		<Card>
			<View className="items-center py-2">
				<View
					className="w-14 h-14 rounded-full items-center justify-center mb-4"
					style={{ backgroundColor: themeColors.accentWeak }}
				>
					<Ionicons
						name={icon}
						size={26}
						color={themeColors.primary}
					/>
				</View>
				<Text
					className="font-sansMedium text-title-secondary text-center"
					style={{ color: themeColors.text }}
				>
					{title}
				</Text>
				<Text
					className="font-sans text-body-small text-center mt-1.5"
					style={{ color: themeColors.secondary }}
				>
					{copy}
				</Text>
				{actionTitle && onAction ? (
					<View className="w-full mt-5">
						<BoleiaButton title={actionTitle} onPress={onAction} />
					</View>
				) : null}
			</View>
		</Card>
	);
}
