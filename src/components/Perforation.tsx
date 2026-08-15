import React from 'react';
import { View } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

// Perfuração do bilhete — linha tracejada interrompida por dois pontos
// (linha → laterite), a mesma assinatura do ticket da Home.
export default function Perforation({
	tight = false,
	flush = false,
}: {
	tight?: boolean;
	flush?: boolean;
}) {
	const { themeColors } = useThemeColors();

	return (
		<View
			className={
				flush
					? 'flex-row items-center justify-center my-0'
					: tight
						? 'flex-row items-center justify-center my-3'
						: 'flex-row items-center justify-center my-6'
			}
		>
			<View
				className="flex-1 border-t border-dashed"
				style={{ borderColor: themeColors.border }}
			/>
			<View className="flex-row items-center px-3">
				<View
					className="h-3 w-3 rounded-full mr-2"
					style={{ backgroundColor: themeColors.primary }}
				/>
				<View
					className="h-3 w-3 rounded-full"
					style={{ backgroundColor: themeColors.laterite }}
				/>
			</View>
			<View
				className="flex-1 border-t border-dashed"
				style={{ borderColor: themeColors.border }}
			/>
		</View>
	);
}
