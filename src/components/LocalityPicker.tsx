import React, { useMemo, useState } from 'react';
import {
	View,
	Text,
	Pressable,
	Modal,
	TextInput,
	ScrollView,
	ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import { toAscii } from '../lib/format';
import { useAllLocalities, useProvinces } from '../hooks/useLocalities';
import type { ApiLocality } from '../lib/api';

/**
 * Escolha de local por bottom-sheet com pesquisa.
 *
 * O valor devolvido é sempre o `id` da localidade, que é o que o backend
 * espera em `originLocalityId`/`destinationLocalityId`. Anteriormente o
 * picker devolvia o nome da província no modo interprovincial, o que não
 * corresponde a nenhum identificador do servidor.
 *
 * A lista vem da API. São ~306 municípios, por isso a grelha de chips não
 * escala e a escolha é sempre por pesquisa com filtro de província.
 */
export default function LocalityPicker({
	value,
	onChange,
	exclude,
	restrictToProvinceId,
	variant = 'box',
	label,
	dotColor,
}: {
	value: string;
	onChange: (localityId: string) => void;
	/** Local a esconder, para não permitir origem igual a destino. */
	exclude?: string;
	/** Restringe a escolha a uma província (pesquisa intermunicipal). */
	restrictToProvinceId?: string | null;
	variant?: 'row' | 'box';
	label?: string;
	dotColor?: string;
}) {
	const { themeColors } = useThemeColors();
	const [visible, setVisible] = useState(false);
	const [provinceId, setProvinceId] = useState('');
	const [query, setQuery] = useState('');

	const provinces = useProvinces();
	const localities = useAllLocalities();

	const byId = useMemo(
		() => new Map(localities.map((l) => [l.id, l])),
		[localities],
	);
	const provinceName = useMemo(() => {
		const map = new Map((provinces.data ?? []).map((p) => [p.id, p.name]));
		return (id: string) => map.get(id) ?? '';
	}, [provinces.data]);

	const selected = value ? byId.get(value) : undefined;

	// A lista de províncias offered é a união das províncias que têm
	// localidades, para não oferecer uma província vazia.
	const provincesWithLocalities = useMemo(() => {
		const present = new Set(localities.map((l) => l.provinceId));
		return (provinces.data ?? []).filter((p) => present.has(p.id));
	}, [provinces.data, localities]);

	const options = useMemo(() => {
		const q = toAscii(query.trim());
		return localities
			.filter((l) => l.id !== exclude)
			.filter(
				(l) =>
					!restrictToProvinceId ||
					l.provinceId === restrictToProvinceId,
			)
			.filter((l) => !provinceId || l.provinceId === provinceId)
			.filter((l) => {
				if (!q) return true;
				return (
					toAscii(l.municipality).includes(q) ||
					toAscii(l.name).includes(q) ||
					toAscii(provinceName(l.provinceId)).includes(q)
				);
			})
			.slice(0, 200);
	}, [
		localities,
		exclude,
		restrictToProvinceId,
		provinceId,
		query,
		provinceName,
	]);

	const open = () => {
		// Se a escolha está restrita a uma província, não faz sentido oferecer
		// os chips de província: pré-selecciona-a e esconde-os.
		setProvinceId(restrictToProvinceId ?? '');
		setQuery('');
		setVisible(true);
	};

	const pick = (locality: ApiLocality) => {
		onChange(locality.id);
		setVisible(false);
	};

	const hasValue = !!selected;
	const triggerLabel = selected
		? `${selected.municipality} · ${provinceName(selected.provinceId)}`
		: 'Escolher local';

	const trigger =
		variant === 'row' ? (
			<Pressable
				onPress={open}
				className="flex-row items-center py-3"
				accessibilityRole="button"
				accessibilityLabel={label ?? 'Escolher local'}
			>
				<View className="w-6 items-center">
					<View
						className="w-3 h-3 rounded-full"
						style={{
							backgroundColor: dotColor ?? themeColors.primary,
						}}
					/>
				</View>
				<View className="flex-1 ml-3">
					<Text
						className="font-sansMedium text-body-xs"
						style={{ color: themeColors.secondary }}
					>
						{label ?? 'Local'}
					</Text>
					<Text
						className={
							hasValue
								? 'font-sansBold text-label-small mt-0.5'
								: 'font-sans text-label-small mt-0.5'
						}
						style={{
							color: hasValue
								? themeColors.text
								: themeColors.border,
						}}
					>
						{triggerLabel}
					</Text>
				</View>
				<Ionicons
					name="chevron-down"
					size={16}
					color={themeColors.border}
				/>
			</Pressable>
		) : (
			<Pressable
				onPress={open}
				className="rounded-xl px-4 py-3 border min-h-[44px] justify-center"
				style={{
					borderColor: hasValue
						? themeColors.primary
						: themeColors.border,
					backgroundColor: themeColors.card,
				}}
			>
				<Text
					className={
						hasValue
							? 'font-sansBold text-label-small'
							: 'font-sans text-label-small'
					}
					style={{
						color: hasValue ? themeColors.text : themeColors.border,
					}}
				>
					{triggerLabel}
				</Text>
			</Pressable>
		);

	const showProvinceChips = !restrictToProvinceId;

	return (
		<>
			{trigger}
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
							maxHeight: '88%',
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
								{label ?? 'Escolhe o teu local'}
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

						<View
							className="flex-row items-center rounded-xl border px-3 mb-2"
							style={{
								borderColor: themeColors.border,
								backgroundColor: themeColors.background,
							}}
						>
							<Ionicons
								name="search"
								size={18}
								color={themeColors.secondary}
							/>
							<TextInput
								className="flex-1 py-2.5 pl-2 font-sans text-body-small"
								style={{ color: themeColors.text }}
								placeholder="Pesquisar município"
								placeholderTextColor={themeColors.border}
								value={query}
								onChangeText={setQuery}
								autoCorrect={false}
							/>
							{query ? (
								<Pressable
									onPress={() => setQuery('')}
									hitSlop={10}
								>
									<Ionicons
										name="close-circle"
										size={18}
										color={themeColors.border}
									/>
								</Pressable>
							) : null}
						</View>

						{showProvinceChips ? (
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								className="mb-2"
							>
								{provincesWithLocalities.map((p) => {
									const active = provinceId === p.id;
									return (
										<Pressable
											key={p.id}
											onPress={() =>
												setProvinceId(
													active ? '' : p.id,
												)
											}
											className="rounded-full px-3 py-1.5 border mr-2 min-h-[32px] justify-center"
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
												className="font-sansMedium text-body-xs"
												style={{
													color: active
														? themeColors.card
														: themeColors.secondary,
												}}
											>
												{p.name}
											</Text>
										</Pressable>
									);
								})}
							</ScrollView>
						) : null}

						<ScrollView
							keyboardShouldPersistTaps="handled"
							style={{ maxHeight: 380 }}
						>
							{provinces.isLoading ? (
								<View className="py-10 items-center">
									<ActivityIndicator
										color={themeColors.primary}
									/>
								</View>
							) : options.length === 0 ? (
								<View className="py-10 items-center">
									<Text
										className="font-sans text-body-small"
										style={{ color: themeColors.secondary }}
									>
										Sem municípios a bater certo.
									</Text>
								</View>
							) : (
								options.map((l) => {
									const active = value === l.id;
									return (
										<Pressable
											key={l.id}
											onPress={() => pick(l)}
											className="flex-row items-center px-1 py-3 border-b min-h-[44px]"
											style={{
												borderColor: themeColors.border,
											}}
										>
											<View className="flex-1">
												<Text
													className="font-sansMedium text-label-small"
													style={{
														color: themeColors.text,
													}}
												>
													{l.municipality}
												</Text>
												<Text
													className="font-sans text-body-xs"
													style={{
														color: themeColors.secondary,
													}}
												>
													{provinceName(l.provinceId)}
												</Text>
											</View>
											{active ? (
												<Ionicons
													name="checkmark-circle"
													size={20}
													color={themeColors.primary}
												/>
											) : null}
										</Pressable>
									);
								})
							)}
						</ScrollView>
					</Pressable>
				</Pressable>
			</Modal>
		</>
	);
}
