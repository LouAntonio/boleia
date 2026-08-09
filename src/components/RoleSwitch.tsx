import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Role } from '../types/boleia';
import { useThemeColors } from '../hooks/useThemeColors';

export default function RoleSwitch({
	value,
	onChange,
}: {
	value: Role;
	onChange: (role: Role) => void;
}) {
	const { themeColors } = useThemeColors();
	const options: { role: Role; label: string }[] = [
		{ role: 'passenger', label: 'Passageiro' },
		{ role: 'driver', label: 'Motorista' },
	];

	return (
		<View
			className="flex-row rounded-full p-1 border"
			// eslint-disable-next-line react-native/no-inline-styles
			style={{
				borderColor: themeColors.border,
				backgroundColor: themeColors.card,
			}}
		>
			{options.map((opt) => {
				const active = value === opt.role;
				return (
					<Pressable
						key={opt.role}
						onPress={() => onChange(opt.role)}
						className="flex-1 rounded-full px-4 py-2 items-center"
						// eslint-disable-next-line react-native/no-inline-styles
						style={{
							backgroundColor: active
								? themeColors.text
								: 'transparent',
						}}
					>
						<Text
							className="font-sansMedium text-[13px]"
							// eslint-disable-next-line react-native/no-inline-styles
							style={{
								color: active
									? themeColors.card
									: themeColors.secondary,
							}}
						>
							{opt.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}
