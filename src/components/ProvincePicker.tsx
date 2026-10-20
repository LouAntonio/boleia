import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import { PROVINCES } from '../lib/locations';
import { MIN_TAP } from '../store/type';

/**
 * Escolha de uma província.
 *
 * É o picker do modo **interprovincial**, onde a origem e o destino são
 * províncias e não municípios. O valor devolvido é o **código** da província
 * (`cuanza-norte`), que é o que o `GET /api/rides` aceita em
 * `originProvinceId`/`destinationProvinceId` — o UUID continua aceito, mas a
 * app já não o conhece.
 *
 * A lista é local (`lib/locations.ts`), gerada da seed do backend: são 21
 * províncias que não mudam e não justificam um pedido. Antes, abrir este
 * picker ia buscar as províncias à API.
 *
 * **Em chips que quebram para a linha seguinte**, e não numa coluna: 21 nomes
 * curtos leem-se melhor lado a lado, e a lista deixa de parecer um menu. É o
 * mesmo desenho das províncias dentro do `LocalityPicker`, mas com quebra de
 * linha em vez de scroll horizontal.
 *
 * **Não tem caixa de pesquisa, ao contrário do `LocalityPicker`.** São 21
 * províncias contra 306 municípios: a lista cabe num ecrã e a pesquisa seria
 * um campo a mais para escrever.
 */
export default function ProvincePicker({
	label,
	value,
	onChange,
	exclude,
	placeholder = 'Escolhe a província',
	dotColor,
	disabled = false,
}: {
	label: string;
	/** Código da província escolhida, ou `''`. */
	value: string;
	onChange: (provinceCode: string) => void;
	/** Província a esconder, para não permitir origem igual a destino. */
	exclude?: string;
	placeholder?: string;
	/** A cor do marcador da paragem, para o eixo ler de cima a baixo. */
	dotColor?: string;
	disabled?: boolean;
}) {
	const { themeColors } = useThemeColors();
	const [visible, setVisible] = useState(false);

	const nameOf = useMemo(
		() =>
			new Map(
				PROVINCES.map((province) => [province.code, province.name]),
			),
		[],
	);
	const options = useMemo(
		() => PROVINCES.filter((province) => province.code !== exclude),
		[exclude],
	);

	const selectedName = value ? (nameOf.get(value) ?? null) : null;

	const pick = (provinceCode: string) => {
		onChange(provinceCode);
		setVisible(false);
	};

	return (
		<>
			<Pressable
				onPress={() => setVisible(true)}
				disabled={disabled}
				accessibilityRole="button"
				accessibilityLabel={`${label}: ${selectedName ?? placeholder}`}
				className="flex-row items-center py-3"
				style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
			>
				<View className="w-6 items-center">
					<View
						className="w-3 h-3 rounded-full"
						style={{
							backgroundColor: disabled
								? themeColors.border
								: (dotColor ?? themeColors.text),
						}}
					/>
				</View>

				<View className="flex-1 ml-3">
					<Text
						className="font-sansMedium text-body-xs"
						style={{ color: themeColors.secondary }}
					>
						{label}
					</Text>
					<Text
						className={
							selectedName
								? 'font-sansBold text-label-small mt-0.5'
								: 'font-sans text-label-small mt-0.5'
						}
						style={{
							color: selectedName
								? themeColors.text
								: themeColors.border,
						}}
					>
						{selectedName ?? placeholder}
					</Text>
				</View>

				<Ionicons
					name="chevron-forward"
					size={16}
					color={themeColors.secondary}
				/>
			</Pressable>

			<Modal
				visible={visible}
				transparent
				animationType="slide"
				onRequestClose={() => setVisible(false)}
			>
				<Pressable
					className="flex-1 justify-end"
					style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
					onPress={() => setVisible(false)}
				>
					<Pressable
						className="rounded-t-3xl border-t px-5 pt-3 pb-6"
						style={{
							backgroundColor: themeColors.card,
							borderColor: themeColors.border,
							maxHeight: '75%',
						}}
						onPress={(e) => e.stopPropagation()}
					>
						<View className="items-center mb-3">
							<View
								className="w-10 h-1 rounded-full"
								style={{ backgroundColor: themeColors.border }}
							/>
						</View>

						<View className="flex-row items-center justify-between mb-3">
							<Text
								className="font-sansExtraBold text-title-tertiary"
								style={{ color: themeColors.text }}
							>
								{label}
							</Text>
							<Pressable
								onPress={() => setVisible(false)}
								hitSlop={10}
								className="w-8 h-8 rounded-full items-center justify-center"
								style={{
									backgroundColor: themeColors.background,
								}}
							>
								<Ionicons
									name="close"
									size={18}
									color={themeColors.secondary}
								/>
							</Pressable>
						</View>

						<ScrollView showsVerticalScrollIndicator={false}>
							<View className="flex-row flex-wrap gap-2 pb-2">
								<Pressable
									onPress={() => pick('')}
									hitSlop={6}
									accessibilityRole="button"
									accessibilityState={{
										selected: value === '',
									}}
									className="rounded-full px-3 py-1.5 border justify-center"
									style={{
										minHeight: MIN_TAP,
										borderColor:
											value === ''
												? themeColors.text
												: themeColors.border,
										backgroundColor:
											value === ''
												? themeColors.text
												: themeColors.card,
									}}
								>
									<Text
										className="font-sansMedium text-body-xs"
										style={{
											color:
												value === ''
													? themeColors.card
													: themeColors.secondary,
										}}
									>
										{placeholder}
									</Text>
								</Pressable>

								{options.map((province) => {
									const active = value === province.code;
									return (
										<Pressable
											key={province.code}
											onPress={() => pick(province.code)}
											hitSlop={6}
											accessibilityRole="button"
											accessibilityState={{
												selected: active,
											}}
											className="rounded-full px-3 py-1.5 border justify-center"
											style={{
												minHeight: MIN_TAP,
												borderColor: active
													? themeColors.text
													: themeColors.border,
												backgroundColor: active
													? themeColors.text
													: themeColors.card,
											}}
										>
											<Text
												className="font-sansMedium text-body-xs"
												style={{
													color: active
														? themeColors.card
														: themeColors.secondary,
												}}
											>
												{province.name}
											</Text>
										</Pressable>
									);
								})}
							</View>
						</ScrollView>
					</Pressable>
				</Pressable>
			</Modal>
		</>
	);
}
