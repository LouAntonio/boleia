import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { MIN_TAP } from '../store/type';

/**
 * Selector segmentado — cápsula `card` com `p-1`, e a opção activa em cápsula
 * `text` (a tinta do produto) com o rótulo em `card`.
 *
 * Existia escrito à mão no seletor de tema do perfil, 31 linhas. Passa a ser
 * usado em três sítios: tema, comutação de papel no perfil, e modo
 * passageiro/motorista no KYC. O ganho não é o que se vê: é que os três
 * contextos passam a ter exactamente a mesma geometria e o mesmo peso.
 *
 * A opção activa inverte a superfície em vez de levar um fundo de cor: é o
 * mesmo truque do `SegmentedControl` do sistema de origem, e funciona nos dois
 * temas sem nenhum token novo.
 */
export interface SegmentedOption<T extends string> {
	value: T;
	label: string;
}

export default function SegmentedControl<T extends string>({
	options,
	value,
	onChange,
	accessibilityLabel,
	className,
}: {
	options: readonly SegmentedOption<T>[];
	value: T;
	onChange: (next: T) => void;
	accessibilityLabel?: string;
	className?: string;
}) {
	const { themeColors } = useThemeColors();

	return (
		<View
			className={`flex-row rounded-full p-1 ${className ?? ''}`}
			style={{ backgroundColor: themeColors.card }}
			accessibilityRole="radiogroup"
			accessibilityLabel={accessibilityLabel}
		>
			{options.map((option) => {
				const active = option.value === value;
				return (
					<Pressable
						key={option.value}
						onPress={() => onChange(option.value)}
						accessibilityRole="radio"
						accessibilityState={{ selected: active }}
						accessibilityLabel={option.label}
						className="flex-1 rounded-full items-center justify-center px-2"
						style={{
							minHeight: MIN_TAP - 8,
							backgroundColor: active
								? themeColors.text
								: 'transparent',
						}}
					>
						<Text
							className="font-sansMedium text-body-small"
							style={{
								color: active
									? themeColors.card
									: themeColors.secondary,
							}}
						>
							{option.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}
