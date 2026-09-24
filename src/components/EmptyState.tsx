import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import TicketCard from './TicketCard';
import BoleiaButton from './BoleiaButton';

// Estado vazio padrão — cartão neutro com selo, título display e CTA ouro.
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
		<TicketCard>
			<View className="items-center py-2">
				<View
					className="w-14 h-14 rounded-full items-center justify-center mb-4"
					style={{ backgroundColor: themeColors.primary }}
				>
					<Ionicons name={icon} size={26} color="#17141B" />
				</View>
				<Text
					className="font-display text-[20px] text-center"
					style={{ color: themeColors.text }}
				>
					{title}
				</Text>
				<Text
					className="font-sans text-[13px] text-center mt-1.5 leading-5"
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
		</TicketCard>
	);
}
