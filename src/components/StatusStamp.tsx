import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { statusMeta, StatusTone } from '../utils/status';

// Selo de estado — cápsula com fundo fraco da semântica + texto na cor da
// semântica. Nunca cor sozinha: o rótulo é sempre presente (acessibilidade
// do Pixar). `pending` usa caution, que existe precisamente para "ainda não
// é sucesso e não depende do utilizador".
const TONE: Record<StatusTone, { bg: string; fg: string }> = {
	pending: { bg: 'caution', fg: 'cautionText' },
	active: { bg: 'accentWeak', fg: 'primary' },
	done: { bg: 'successWeak', fg: 'success' },
	failed: { bg: 'dangerWeak', fg: 'error' },
	neutral: { bg: 'background', fg: 'secondary' },
};

export default function StatusStamp({
	status,
	label,
}: {
	status: string;
	label?: string;
}) {
	const { themeColors } = useThemeColors();
	const meta = statusMeta(status);
	const { bg, fg } = TONE[meta.tone];

	return (
		<View
			className="flex-row items-center self-start rounded-full px-2.5 py-1"
			style={{
				backgroundColor: themeColors[bg as keyof typeof themeColors],
			}}
		>
			<Text
				className="font-sansMedium text-body-xs"
				style={{ color: themeColors[fg as keyof typeof themeColors] }}
			>
				{label ?? meta.label}
			</Text>
		</View>
	);
}
