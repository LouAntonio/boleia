import React, { useMemo, useState } from 'react';
import {
	View,
	Text,
	Pressable,
	Modal,
	TextInput,
	ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import { toAscii } from '../lib/format';
import { PROVINCES } from '../lib/locations';

/**
 * Escolha de local por bottom-sheet com pesquisa.
 *
 * O valor devolvido é o **código** do município (`huambo.catabola`), que é o
 * que o `GET /api/rides` aceita em `origin`/`destination` e o que o
 * `POST /api/rides` aceita em `originLocalityId`/`destinationLocalityId`. O
 * UUID continua aceito pelo backend, mas a app já não o conhece.
 *
 * A lista é local (`lib/locations.ts`), gerada da seed do backend. Antes, abrir
 * este picker disparava 22 pedidos à API — as 21 províncias e uma chamada por
 * província — para montar 306 municípios que nunca mudam.
 *
 * O código leva a província à frente porque há três nomes repetidos no país
 * (Canacassala, Catabola e Quizenga): o nome sozinho não identifica nada.
 */
export default function LocalityPicker({
	value,
	onChange,
	exclude,
	restrictToProvince,
	variant = 'box',
	label,
	dotColor,
}: {
	value: string;
	onChange: (municipalityCode: string) => void;
	/** Local a esconder, para não permitir origem igual a destino. */
	exclude?: string;
	/** Restringe a escolha a uma província (pesquisa intermunicipal). */
	restrictToProvince?: string | null;
	variant?: 'row' | 'box';
	label?: string;
	dotColor?: string;
}) {
	const { themeColors } = useThemeColors();
	const [visible, setVisible] = useState(false);
	const [province, setProvince] = useState('');
	const [query, setQuery] = useState('');

	const selected = useMemo(() => {
		for (const candidate of PROVINCES) {
			const found = candidate.municipalities.find(
				(municipality) => municipality.code === value,
			);
			if (found) return { ...found, province: candidate };
		}
		return undefined;
	}, [value]);

	const options = useMemo(() => {
		const q = toAscii(query.trim());
		return PROVINCES.filter(
			(candidate) =>
				(!restrictToProvince ||
					candidate.code === restrictToProvince) &&
				(!province || candidate.code === province),
		)
			.flatMap((candidate) =>
				candidate.municipalities.map((municipality) => ({
					...municipality,
					province: candidate,
				})),
			)
			.filter((municipality) => municipality.code !== exclude)
			.filter((municipality) => {
				if (!q) return true;
				return (
					toAscii(municipality.name).includes(q) ||
					toAscii(municipality.province.name).includes(q)
				);
			})
			.slice(0, 200);
	}, [exclude, restrictToProvince, province, query]);

	const open = () => {
		// Se a escolha está restrita a uma província, não faz sentido oferecer
		// os chips de província: pré-selecciona-a e esconde-os.
		setProvince(restrictToProvince ?? '');
		setQuery('');
		setVisible(true);
	};

	const pick = (municipalityCode: string) => {
		onChange(municipalityCode);
		setVisible(false);
	};

	const hasValue = !!selected;
	const triggerLabel = selected
		? `${selected.name} · ${selected.province.name}`
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

	const showProvinceChips = !restrictToProvince;

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

						{/*
						 * Chips em quebra de linha, não em scroll horizontal: os
						 * 21 nomes cabem em duas ou três linhas, e uma linha
						 * horizontal esconderia metade das províncias sem que
						 * nada indicasse que há mais.
						 */}
						{showProvinceChips ? (
							<View className="flex-row flex-wrap gap-2 mb-2">
								{PROVINCES.map((candidate) => {
									const active = province === candidate.code;
									return (
										<Pressable
											key={candidate.code}
											onPress={() =>
												setProvince(
													active
														? ''
														: candidate.code,
												)
											}
											hitSlop={6}
											accessibilityRole="button"
											accessibilityState={{
												selected: active,
											}}
											className="rounded-full px-3 py-1.5 border min-h-[32px] justify-center"
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
												{candidate.name}
											</Text>
										</Pressable>
									);
								})}
							</View>
						) : null}

						<ScrollView
							keyboardShouldPersistTaps="handled"
							style={{ maxHeight: 380 }}
							showsVerticalScrollIndicator={false}
						>
							{options.length === 0 ? (
								<View className="py-10 items-center">
									<Text
										className="font-sans text-body-small"
										style={{ color: themeColors.secondary }}
									>
										Sem municípios a bater certo.
									</Text>
								</View>
							) : (
								options.map((municipality) => {
									const active = value === municipality.code;
									return (
										<Pressable
											key={municipality.code}
											onPress={() =>
												pick(municipality.code)
											}
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
													{municipality.name}
												</Text>
												<Text
													className="font-sans text-body-xs"
													style={{
														color: themeColors.secondary,
													}}
												>
													{municipality.province.name}
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
