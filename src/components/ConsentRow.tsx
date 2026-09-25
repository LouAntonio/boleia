import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';

// Linha de consentimento estilo radio — círculo que muda para mato quando
// marcado. Usada nos termos, privacidade e novidades do cadastro.
export default function ConsentRow({
	label,
	checked,
	onChange,
	optional = false,
	disabled = false,
}: {
	label: string;
	checked: boolean;
	onChange: () => void;
	optional?: boolean;
	disabled?: boolean;
}) {
	const { themeColors } = useThemeColors();

	return (
		<Pressable
			onPress={onChange}
			disabled={disabled}
			className="flex-row items-center min-h-[44px] py-2"
			style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
		>
			<View
				className="h-6 w-6 rounded-lg items-center justify-center mr-3"
				style={{
					backgroundColor: checked
						? themeColors.primary
						: themeColors.card,
					borderWidth: 1,
					borderColor: checked
						? themeColors.primary
						: themeColors.border,
				}}
			>
				{checked && (
					<Ionicons
						name="checkmark"
						size={14}
						color={themeColors.onPrimary}
					/>
				)}
			</View>
			<Text
				className="font-sans text-body-small flex-1"
				style={{ color: themeColors.text }}
			>
				{label}
			</Text>
			{optional ? (
				<Text
					className="font-sansMedium text-body-xs ml-2"
					style={{ color: themeColors.secondary }}
				>
					Opcional
				</Text>
			) : null}
		</Pressable>
	);
}
