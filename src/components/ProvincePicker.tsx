import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import { useProvinces } from '../hooks/useLocalities';
import { MIN_TAP } from '../store/type';
import type { ApiProvince } from '../lib/api';

/**
 * Escolha de uma província.
 *
 * É o picker do modo **interprovincial**, onde a origem e o destino são
 * províncias e não municípios. Só existe porque o `GET /api/rides` ganhou
 * `originProvinceId` / `destinationProvinceId`: sem eles, escolher uma província
 * seria um selector que não filtra nada, e o rótulo "interprovincial" seria uma
 * promessa que o servidor não cumpre.
 *
 * **Não tem caixa de pesquisa, ao contrário do `LocalityPicker`.** São 21
 * províncias contra 306 localidades: uma lista cabe num ecrã e a pesquisa seria
 * um campo a mais para escrever. É a mesma razão pela qual o modal é mais
 * baixo e não ocupa 88% da altura.
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
	/** Id da província escolhida, ou `''`. */
	value: string;
	onChange: (provinceId: string) => void;
	/** Província a esconder, para não permitir origem igual a destino. */
	exclude?: string;
	placeholder?: string;
	/** A cor do marcador da paragem, para o eixo ler de cima a baixo. */
	dotColor?: string;
	disabled?: boolean;
}) {
	const { themeColors } = useThemeColors();
	const [visible, setVisible] = useState(false);
	const provinces = useProvinces();

	const nameOf = useMemo(() => {
		const index = new Map(
			(provinces.data ?? []).map((p) => [p.id, p.name]),
		);
		return (id: string) => (id ? (index.get(id) ?? null) : null);
	}, [provinces.data]);

	const options = useMemo(
		() =>
			(provinces.data ?? []).filter((p: ApiProvince) => p.id !== exclude),
		[provinces.data, exclude],
	);

	const selectedName = nameOf(value);

	const pick = (provinceId: string) => {
		onChange(provinceId);
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
							// Menos alto que o modal das localidades: 21 itens cabem
							// sem ocuparem o ecrã todo.
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

						{provinces.isPending ? (
							<Text
								className="font-sans text-body-small py-6 text-center"
								style={{ color: themeColors.secondary }}
							>
								A carregar províncias…
							</Text>
						) : (
							<>
								<Pressable
									onPress={() => pick('')}
									className="flex-row items-center px-3 py-3 rounded-xl mb-1"
									style={{ minHeight: MIN_TAP }}
								>
									<Text
										className="font-sans text-body-small"
										style={{ color: themeColors.secondary }}
									>
										Todas as províncias
									</Text>
								</Pressable>

								{options.map((province) => {
									const active = value === province.id;
									return (
										<Pressable
											key={province.id}
											onPress={() => pick(province.id)}
											accessibilityRole="button"
											accessibilityState={{
												selected: active,
											}}
											className="flex-row items-center px-3 py-3 rounded-xl mb-1"
											style={{
												minHeight: MIN_TAP,
												backgroundColor: active
													? themeColors.background
													: 'transparent',
											}}
										>
											<Ionicons
												name="map-outline"
												size={16}
												color={
													active
														? themeColors.primary
														: themeColors.secondary
												}
											/>
											<Text
												className={
													active
														? 'font-sansBold text-body-small ml-3'
														: 'font-sans text-body-small ml-3'
												}
												style={{
													color: active
														? themeColors.text
														: themeColors.text,
												}}
											>
												{province.name}
											</Text>
										</Pressable>
									);
								})}
							</>
						)}
					</Pressable>
				</Pressable>
			</Modal>
		</>
	);
}
