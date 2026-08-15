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
			className="flex-row items-center py-2.5"
			style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
		>
			<View
				className="h-5 w-5 rounded-full border items-center justify-center mr-3"
				style={{
					borderColor: checked
						? themeColors.mato
						: themeColors.border,
					backgroundColor: checked ? themeColors.mato : 'transparent',
				}}
			>
				{checked && (
					<Ionicons name="checkmark" size={13} color="#FFFFFF" />
				)}
			</View>
			<Text
				className="font-sans text-[13px] flex-1"
				style={{ color: themeColors.text }}
			>
				{label}
			</Text>
			{optional ? (
				<Text
					className="font-mono text-[10px] uppercase tracking-[2px] ml-2"
					style={{ color: themeColors.secondary }}
				>
					Opcional
				</Text>
			) : null}
		</Pressable>
	);
}
