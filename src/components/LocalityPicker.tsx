import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { MAJOR_LOCALITIES } from '../mock/locale';
import { Locality } from '../types/boleia';

// Escolha de localidade por chips — usado no motorista (publicar) e
// no passageiro (pesquisa).
export default function LocalityPicker({
	value,
	onChange,
	exclude,
	filter,
}: {
	value: string;
	onChange: (id: string) => void;
	exclude?: string;
	filter?: (l: Locality) => boolean;
}) {
	const { themeColors } = useThemeColors();
	const options = MAJOR_LOCALITIES.filter(
		(l) => (!exclude || l.id !== exclude) && (!filter || filter(l)),
	);

	const selected = MAJOR_LOCALITIES.find((l) => l.id === value);

	return (
		<View>
			{selected ? (
				<Pressable
					onPress={() => onChange('')}
					className="rounded-xl px-4 py-3 border"
					style={{
						borderColor: themeColors.laterite,
						backgroundColor: themeColors.card,
					}}
				>
					<Text
						className="font-sansBold text-[15px]"
						style={{ color: themeColors.text }}
					>
						{selected.municipality}
						<Text
							className="font-sans text-[12px]"
							style={{ color: themeColors.secondary }}
						>
							{'  ·  '}
							{selected.province}
						</Text>
					</Text>
				</Pressable>
			) : (
				<View className="flex-row flex-wrap">
					{options.map((l) => {
						const active = value === l.id;
						return (
							<Pressable
								key={l.id}
								onPress={() => onChange(l.id)}
								className="rounded-full px-3 py-1.5 border mr-2 mb-2"
								style={{
									borderColor: active
										? themeColors.text
										: themeColors.border,
									backgroundColor: active
										? themeColors.text
										: themeColors.card,
								}}
							>
								<Text
									className="font-sansMedium text-[12px]"
									style={{
										color: active
											? themeColors.card
											: themeColors.secondary,
									}}
								>
									{l.municipality}
								</Text>
							</Pressable>
						);
					})}
				</View>
			)}
		</View>
	);
}
