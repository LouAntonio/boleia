import React from 'react';
import { View } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

// Cartão Boleia viva — três tratamentos sem contorno universal:
// neutro = superfície cheia com sombra suave · laterite/mato = filete de
// ênfase de 1.5. A borda passa a divisória interna, não a contorno.
export default function TicketCard({
	children,
	accent = 'none',
	padded = true,
}: {
	children: React.ReactNode;
	accent?: 'laterite' | 'mato' | 'none';
	padded?: boolean;
}) {
	const { themeColors } = useThemeColors();
	const borderColor =
		accent === 'laterite'
			? themeColors.laterite
			: accent === 'mato'
				? themeColors.mato
				: 'transparent';
	return (
		<View
			className={
				padded
					? 'rounded-3xl overflow-hidden p-5'
					: 'rounded-3xl overflow-hidden'
			}
			style={{
				backgroundColor: themeColors.card,
				borderColor,
				borderWidth: accent === 'none' ? 0 : 1.5,
				shadowColor: '#000',
				shadowOpacity: 0.08,
				shadowOffset: { width: 0, height: 4 },
				shadowRadius: 12,
				elevation: 3,
			}}
		>
			{children}
		</View>
	);
}
