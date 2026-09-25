import React from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import { MIN_TAP } from '../store/type';

// Botão de voltar partilhado. Superfície neutra (`card`) com anel `border`,
// hierarquia por ícone — sem cor de assinatura. O alvo de toque é dimensionado
// por `MIN_TAP` (44px, a mesma constante usada pelas grelhas de calendário),
// com `hitSlop` extra para tornar o toque confortável sem alterar a métrica
// visual do cabeçalho.
export default function BackButton({ onPress }: { onPress: () => void }) {
	const { themeColors } = useThemeColors();
	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel="Voltar"
			hitSlop={8}
			className="rounded-full items-center justify-center border mr-3"
			style={{
				minWidth: MIN_TAP,
				minHeight: MIN_TAP,
				borderColor: themeColors.border,
				backgroundColor: themeColors.card,
			}}
		>
			<Ionicons name="chevron-back" size={18} color={themeColors.text} />
		</Pressable>
	);
}
