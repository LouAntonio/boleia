import React from 'react';
import { View } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

// Cartão neutro do sistema — superfície elevada (branca) sobre a página
// cinza-azulada, raio 12, sombra discreta. `tone` pinta um filete de 1.5
// para assinalar um estado; por omissão não há contorno. A borda é divisória
// interna, não moldura.

export default function Card({
	children,
	tone = 'none',
	padded = true,
	className,
}: {
	children: React.ReactNode;
	tone?: 'warning' | 'success' | 'danger' | 'none';
	padded?: boolean;
	/** Margem ou posição externa. A geometria do cartão não muda por aqui. */
	className?: string;
}) {
	const { themeColors } = useThemeColors();
	const borderColor =
		tone === 'warning'
			? themeColors.laterite
			: tone === 'success'
				? themeColors.success
				: tone === 'danger'
					? themeColors.error
					: 'transparent';
	return (
		<View
			className={`${padded ? 'rounded-xl overflow-hidden p-4' : 'rounded-xl overflow-hidden'} ${className ?? ''}`}
			style={{
				backgroundColor: themeColors.card,
				borderColor,
				borderWidth: tone === 'none' ? 0 : 1.5,
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
