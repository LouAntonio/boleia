import React, { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import {
	MONTHS_PT,
	WEEKDAY_PT,
	calendarCells,
	fmtRange,
	todayKey,
	toDateKey,
} from '../utils/date';

// Escolha de um intervalo de datas por bottom-sheet com calendário mensal.
export default function DateRangePicker({
	label = 'Quando',
	valueFrom,
	valueTo,
	onChange,
}: {
	label?: string;
	valueFrom: string;
	valueTo: string;
	onChange: (from: string, to: string) => void;
}) {
	const { themeColors } = useThemeColors();
	const [visible, setVisible] = useState(false);
	const [draftFrom, setDraftFrom] = useState('');
	const [draftTo, setDraftTo] = useState('');

	const now = new Date();
	const [year, setYear] = useState(now.getFullYear());
	const [month, setMonth] = useState(now.getMonth());

	const today = todayKey();
	const cells = calendarCells(year, month);
	const rows: number[][] = [];
	for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

	const hasRange = !!valueFrom || !!valueTo;
	const canPrev = !(year === now.getFullYear() && month === now.getMonth());

	const open = () => {
		setDraftFrom(valueFrom);
		setDraftTo(valueTo);
		setVisible(true);
	};

	const apply = () => {
		onChange(draftFrom, draftTo);
		setVisible(false);
	};

	const clear = () => {
		setDraftFrom('');
		setDraftTo('');
	};

	const prevMonth = () => {
		if (month === 0) {
			setYear(year - 1);
			setMonth(11);
		} else {
			setMonth(month - 1);
		}
	};

	const nextMonth = () => {
		if (month === 11) {
			setYear(year + 1);
			setMonth(0);
		} else {
			setMonth(month + 1);
		}
	};

	const tapDay = (day: number) => {
		const key = toDateKey(new Date(year, month, day));
		if (key < today) return;
		if (!draftFrom || (draftFrom && draftTo)) {
			setDraftFrom(key);
			setDraftTo('');
		} else if (key < draftFrom) {
			setDraftFrom(key);
			setDraftTo('');
		} else {
			setDraftTo(key);
		}
	};

	const renderCell = (day: number, i: number) => {
		if (day === 0) return <View key={i} className="flex-1 h-10" />;
		const key = toDateKey(new Date(year, month, day));
		const disabled = key < today;
		const isStart = key === draftFrom;
		const isEnd = key === draftTo;
		const isRange =
			!!draftFrom && !!draftTo && key > draftFrom && key < draftTo;

		if (isStart || isEnd) {
			return (
				<View
					key={i}
					className="flex-1 h-10 items-center justify-center"
				>
					<View
						className="w-9 h-9 rounded-full items-center justify-center"
						style={{
							backgroundColor: isStart
								? themeColors.primary
								: themeColors.laterite,
						}}
					>
						<Text
							className="font-sansBold text-[14px]"
							style={{ color: themeColors.card }}
						>
							{day}
						</Text>
					</View>
				</View>
			);
		}

		return (
			<Pressable
				key={i}
				disabled={disabled}
				onPress={() => tapDay(day)}
				className="flex-1 h-10 items-center justify-center"
				style={
					isRange
						? { backgroundColor: 'rgba(242,169,0,0.16)' }
						: undefined
				}
			>
				<Text
					className={
						isRange
							? 'font-sansBold text-[14px]'
							: 'font-sansMedium text-[14px]'
					}
					style={{
						color: disabled
							? themeColors.border
							: isRange
								? themeColors.laterite
								: themeColors.text,
					}}
				>
					{day}
				</Text>
			</Pressable>
		);
	};

	return (
		<>
			<Pressable onPress={open} className="flex-row items-center py-3">
				<View className="w-6 items-center">
					<Ionicons
						name="calendar-outline"
						size={16}
						color={themeColors.primary}
					/>
				</View>
				<View className="flex-1 ml-3">
					<Text
						className="font-mono text-[10px] uppercase tracking-[2px]"
						style={{ color: themeColors.laterite }}
					>
						{label}
					</Text>
					<Text
						className={
							hasRange
								? 'font-sansBold text-[15px] mt-0.5'
								: 'font-sans text-[15px] mt-0.5'
						}
						style={{
							color: hasRange
								? themeColors.text
								: themeColors.border,
						}}
					>
						{fmtRange(valueFrom, valueTo)}
					</Text>
				</View>
				<Ionicons
					name="chevron-down"
					size={16}
					color={themeColors.border}
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
						}}
						onPress={(e) => e.stopPropagation()}
					>
						<View className="items-center mb-3">
							<View
								className="w-10 h-1 rounded-full"
								style={{
									backgroundColor: themeColors.border,
								}}
							/>
						</View>

						<View className="flex-row items-center justify-between mb-3">
							<Text
								className="font-display text-[18px]"
								style={{ color: themeColors.text }}
							>
								Escolhe o intervalo
							</Text>
							<Pressable
								onPress={() => setVisible(false)}
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

						<View className="flex-row items-center justify-between mb-3">
							<Pressable
								onPress={prevMonth}
								disabled={!canPrev}
								className="w-8 h-8 items-center justify-center rounded-full border"
								style={{
									borderColor: themeColors.border,
									opacity: canPrev ? 1 : 0.35,
								}}
							>
								<Ionicons
									name="chevron-back"
									size={18}
									color={themeColors.secondary}
								/>
							</Pressable>
							<Text
								className="font-display text-[16px]"
								style={{ color: themeColors.text }}
							>
								{MONTHS_PT[month]} {year}
							</Text>
							<Pressable
								onPress={nextMonth}
								className="w-8 h-8 items-center justify-center rounded-full border"
								style={{ borderColor: themeColors.border }}
							>
								<Ionicons
									name="chevron-forward"
									size={18}
									color={themeColors.secondary}
								/>
							</Pressable>
						</View>

						<View className="flex-row mb-1">
							{WEEKDAY_PT.map((w, i) => (
								<View key={i} className="flex-1 items-center">
									<Text
										className="font-mono text-[10px]"
										style={{ color: themeColors.secondary }}
									>
										{w}
									</Text>
								</View>
							))}
						</View>

						{rows.map((row, ri) => (
							<View key={ri} className="flex-row">
								{row.map((day, i) => renderCell(day, i))}
							</View>
						))}

						<View
							className="flex-row items-center justify-between mt-4 pt-4 border-t"
							style={{ borderColor: themeColors.border }}
						>
							<View className="flex-1">
								<Text
									className="font-mono text-[10px] uppercase tracking-[2px]"
									style={{ color: themeColors.laterite }}
								>
									Intervalo
								</Text>
								<Text
									className={
										draftFrom
											? 'font-sansBold text-[15px] mt-0.5'
											: 'font-sans text-[15px] mt-0.5'
									}
									style={{
										color: draftFrom
											? themeColors.text
											: themeColors.border,
									}}
								>
									{fmtRange(draftFrom, draftTo)}
								</Text>
							</View>
							<Pressable
								onPress={clear}
								className="px-3 py-2 rounded-full border mr-2"
								style={{ borderColor: themeColors.border }}
							>
								<Text
									className="font-sansMedium text-[12px] uppercase tracking-wider"
									style={{ color: themeColors.secondary }}
								>
									Limpar
								</Text>
							</Pressable>
							<Pressable
								onPress={apply}
								className="px-4 py-2 rounded-full"
								style={{ backgroundColor: themeColors.text }}
							>
								<Text
									className="font-sansMedium text-[12px] uppercase tracking-wider"
									style={{ color: themeColors.card }}
								>
									Aplicar
								</Text>
							</Pressable>
						</View>
					</Pressable>
				</Pressable>
			</Modal>
		</>
	);
}
