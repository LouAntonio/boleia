import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { statusMeta, StatusTone } from '../utils/status';

const TONE_COLOR: Record<StatusTone, string> = {
	pending: 'laterite',
	active: 'primary',
	done: 'mato',
	failed: 'error',
	neutral: 'border',
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
	const color =
		themeColors[TONE_COLOR[meta.tone] as keyof typeof themeColors];

	return (
		<View
			className="flex-row items-center self-start rounded-full px-2.5 py-1 border"
			// eslint-disable-next-line react-native/no-inline-styles
			style={{ borderColor: color }}
		>
			<View
				className="w-[7px] h-[7px] rounded-full mr-1.5"
				// eslint-disable-next-line react-native/no-inline-styles
				style={{ backgroundColor: color }}
			/>
			<Text
				className="font-sansMedium text-[11px] uppercase tracking-wider"
				// eslint-disable-next-line react-native/no-inline-styles
				style={{ color }}
			>
				{label ?? meta.label}
			</Text>
		</View>
	);
}
