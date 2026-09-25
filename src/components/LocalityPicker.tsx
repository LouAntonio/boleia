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
import { LOCALITIES, PROVINCES } from '../mock/locale';
import { toAscii } from '../mock/helpers';
import { Locality } from '../types/boleia';

// Escolha de localidade por bottom-sheet com pesquisa — usado no motorista
// (publicar) e no passageiro (pesquisa). Com a lista real de ~306 municípios,
// a grelha de chips original não escala; aqui há pesquisa + filtro por província.
export default function LocalityPicker({
	value,
	onChange,
	exclude,
	filter,
	variant = 'box',
	label,
	dotColor,
	scope = 'municipality',
}: {
	value: string;
	onChange: (id: string) => void;
	exclude?: string;
	filter?: (l: Locality) => boolean;
	variant?: 'row' | 'box';
	label?: string;
	dotColor?: string;
	scope?: 'municipality' | 'province';
}) {
	const { themeColors } = useThemeColors();
	const [visible, setVisible] = useState(false);
	const [province, setProvince] = useState('');
	const [query, setQuery] = useState('');

	const isProvinceScope = scope === 'province';

	const available = useMemo(
		() =>
			isProvinceScope
				? []
				: LOCALITIES.filter(
						(l) =>
							(!exclude || l.id !== exclude) &&
							(!filter || filter(l)),
					),
		[exclude, filter, isProvinceScope],
	);

	const provinces = useMemo(() => {
		if (isProvinceScope) return PROVINCES.filter((p) => p !== exclude);
		const present = new Set(available.map((l) => l.province));
		return PROVINCES.filter((p) => present.has(p));
	}, [available, exclude, isProvinceScope]);

	const selected = value ? LOCALITIES.find((l) => l.id === value) : undefined;

	const provinceOptions = useMemo(() => {
		const q = toAscii(query.trim());
		if (!isProvinceScope) return [];
		return provinces.filter((p) => !q || toAscii(p).includes(q));
	}, [isProvinceScope, provinces, query]);

	const localityOptions = useMemo(() => {
		const q = toAscii(query.trim());
		if (isProvinceScope) return [];
		return available.filter((l) => {
			if (province && l.province !== province) return false;
			if (!q) return true;
			return (
				toAscii(l.municipality).includes(q) ||
				toAscii(l.province).includes(q)
			);
		});
	}, [available, isProvinceScope, province, query]);

	const open = () => {
		// se o filtro restringe a uma só província, pré-seleciona
		setProvince(provinces.length === 1 ? provinces[0] : '');
		setQuery('');
		setVisible(true);
	};

	const pick = (id: string) => {
		onChange(id);
		setVisible(false);
	};

	const hasValue = isProvinceScope ? !!value : !!selected;
	const triggerLabel = isProvinceScope
		? value || 'Escolher província'
		: selected
			? `${selected.municipality} · ${selected.province}`
			: 'Escolher local';

	const trigger =
		variant === 'row' ? (
			<Pressable onPress={open} className="flex-row items-center py-3">
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
				className="rounded-xl px-4 py-3 border"
				style={{
					borderColor: hasValue
						? themeColors.primary
						: themeColors.border,
					backgroundColor: themeColors.card,
				}}
			>
				{isProvinceScope ? (
					<Text
						className={
							hasValue
								? 'font-sansBold text-label-small'
								: 'font-sans text-label-small'
						}
						style={{
							color: hasValue
								? themeColors.text
								: themeColors.border,
						}}
					>
						{triggerLabel}
					</Text>
				) : selected ? (
					<Text
						className="font-sansBold text-label-small"
						style={{ color: themeColors.text }}
					>
						{selected.municipality}
						<Text
							className="font-sans text-body-xs"
							style={{ color: themeColors.secondary }}
						>
							{'  ·  '}
							{selected.province}
						</Text>
					</Text>
				) : (
					<Text
						className="font-sans text-label-small"
						style={{ color: themeColors.border }}
					>
						Escolher local
					</Text>
				)}
			</Pressable>
		);

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
								{label ??
									(isProvinceScope
										? 'Escolhe a província'
										: 'Escolhe o teu local')}
							</Text>
							<Pressable
								onPress={() => setVisible(false)}
								hitSlop={6}
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
								placeholder={
									isProvinceScope
										? 'Pesquisar província'
										: 'Pesquisar município'
								}
								placeholderTextColor={themeColors.border}
								value={query}
								onChangeText={setQuery}
								autoCorrect={false}
							/>
							{query ? (
								<Pressable onPress={() => setQuery('')}>
									<Ionicons
										name="close-circle"
										size={18}
										color={themeColors.border}
									/>
								</Pressable>
							) : null}
						</View>

						{!isProvinceScope ? (
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								className="mb-2"
							>
								{provinces.map((p) => {
									const active = province === p;
									return (
										<Pressable
											key={p}
											onPress={() =>
												setProvince(active ? '' : p)
											}
											className="rounded-full px-3 py-1.5 border mr-2"
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
												{p}
											</Text>
										</Pressable>
									);
								})}
							</ScrollView>
						) : null}

						<ScrollView
							className="flex-grow-0"
							keyboardShouldPersistTaps="handled"
							style={{ maxHeight: 380 }}
						>
							{isProvinceScope ? (
								provinceOptions.length === 0 ? (
									<View className="py-10 items-center">
										<Text
											className="font-sans text-body-small"
											style={{
												color: themeColors.secondary,
											}}
										>
											Sem províncias a bater certo.
										</Text>
									</View>
								) : (
									provinceOptions.map((p) => {
										const active = value === p;
										const count = LOCALITIES.filter(
											(l) => l.province === p,
										).length;
										return (
											<Pressable
												key={p}
												onPress={() => pick(p)}
												className="flex-row items-center px-1 py-3 border-b"
												style={{
													borderColor:
														themeColors.border,
												}}
											>
												<View className="flex-1">
													<Text
														className="font-sansMedium text-label-small"
														style={{
															color: themeColors.text,
														}}
													>
														{p}
													</Text>
													<Text
														className="font-sans text-body-xs"
														style={{
															color: themeColors.secondary,
														}}
													>
														{count} município
														{count > 1 ? 's' : ''}
													</Text>
												</View>
												{active ? (
													<Ionicons
														name="checkmark-circle"
														size={20}
														color={
															themeColors.primary
														}
													/>
												) : null}
											</Pressable>
										);
									})
								)
							) : localityOptions.length === 0 ? (
								<View className="py-10 items-center">
									<Text
										className="font-sans text-body-small"
										style={{
											color: themeColors.secondary,
										}}
									>
										Sem municípios a bater certo.
									</Text>
								</View>
							) : (
								localityOptions.map((l) => {
									const active = value === l.id;
									return (
										<Pressable
											key={l.id}
											onPress={() => pick(l.id)}
											className="flex-row items-center px-1 py-3 border-b"
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
													{l.province}
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
