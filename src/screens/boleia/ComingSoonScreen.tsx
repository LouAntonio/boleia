import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import SectionTitle from '../../components/SectionTitle';

export default function ComingSoonScreen({
	title,
	children,
}: {
	title: string;
	children?: React.ReactNode;
}) {
	const { themeColors } = useThemeColors();
	return (
		<SafeAreaView
			className="flex-1 px-5"
			style={{ backgroundColor: themeColors.background }}
		>
			<View className="mt-3">{children}</View>
			<SectionTitle tone="laterite">{title}</SectionTitle>
			<Text
				className="font-sans text-[13px] mt-2 leading-5"
				style={{ color: themeColors.secondary }}
			>
				Esta área chega nas próximas versões do app. Fica atento à
				estrada.
			</Text>
		</SafeAreaView>
	);
}
