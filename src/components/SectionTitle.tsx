import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

export default function SectionTitle({
	children,
	tone = 'text',
}: {
	children: React.ReactNode;
	tone?: 'text' | 'laterite';
}) {
	const { themeColors } = useThemeColors();
	return (
		<View className="flex-row items-center mb-2.5">
			<View
				className="w-[4px] h-4 rounded-full mr-2"
				style={{
					backgroundColor:
						tone === 'laterite'
							? themeColors.laterite
							: themeColors.primary,
				}}
			/>
			<Text
				className="font-sansBold text-[15px]"
				style={{ color: themeColors.text }}
			>
				{children}
			</Text>
		</View>
	);
}
