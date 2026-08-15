import React, { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';

const DIAL = 300;
const CENTER = DIAL / 2;
const RADIUS = 125;
const TICK = 32;
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const pad2 = (n: number) => String(n).padStart(2, '0');

// Relógio analógico em bottom-sheet para escolher a hora de partida —
// 24 horas no mostrador (passo de 15°), depois minutos de 5 em 5.
export default function TimePicker({
	label = 'Hora de partida',
	value,
	onChange,
}: {
	label?: string;
	value: string;
	onChange: (time: string) => void;
}) {
	const { themeColors } = useThemeColors();
	const [visible, setVisible] = useState(false);
	const [step, setStep] = useState<'h' | 'm'>('h');
	const [dh, setDh] = useState(6);
	const [dm, setDm] = useState(0);

	const now = new Date();

	const open = () => {
		const [h, m] = value ? value.split(':').map(Number) : [6, 0];
		setDh(h >= 0 && h <= 23 ? h : now.getHours());
		setDm(m >= 0 && m <= 59 ? m : now.getMinutes());
		setStep('h');
		setVisible(true);
	};

	const apply = () => {
		onChange(`${pad2(dh)}:${pad2(dm)}`);
		setVisible(false);
	};

	const setNow = () => {
		setDh(now.getHours());
		setDm(now.getMinutes());
	};

	const position = (i: number, count: number) => {
		const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
		return {
			left: CENTER + RADIUS * Math.cos(angle) - TICK / 2,
			top: CENTER + RADIUS * Math.sin(angle) - TICK / 2,
		};
	};

	const renderTick = (
		key: string,
		text: string,
		active: boolean,
		onPress: () => void,
		i: number,
		count: number,
	) => {
		const pos = position(i, count);
		return (
			<Pressable
				key={key}
				onPress={onPress}
				hitSlop={2}
				className="absolute items-center justify-center"
				style={{
					left: pos.left,
					top: pos.top,
					width: TICK,
					height: TICK,
					borderRadius: TICK / 2,
					backgroundColor: active
						? themeColors.primary
						: 'transparent',
				}}
			>
				<Text
					className="font-mono text-[10px]"
					style={{
						color: active
							? themeColors.card
							: themeColors.secondary,
					}}
				>
					{text}
				</Text>
			</Pressable>
		);
	};

	return (
		<>
			<Pressable onPress={open} className="flex-row items-center py-3">
				<View className="w-6 items-center">
					<Ionicons
						name="time-outline"
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
							value
								? 'font-sansBold text-[15px] mt-0.5'
								: 'font-sans text-[15px] mt-0.5'
						}
						style={{
							color: value
								? themeColors.text
								: themeColors.border,
						}}
					>
						{value || 'Escolher hora'}
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

						<View className="flex-row items-center justify-between mb-2">
							<Text
								className="font-display text-[18px]"
								style={{ color: themeColors.text }}
							>
								Escolhe a hora
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

						<View className="flex-row rounded-full p-0.5 border mb-4 self-center">
							{(
								[
									{ step: 'h', label: 'Horas' },
									{ step: 'm', label: 'Minutos' },
								] as const
							).map((opt) => {
								const active = step === opt.step;
								return (
									<Pressable
										key={opt.step}
										onPress={() => setStep(opt.step)}
										className="px-4 py-1.5 rounded-full"
										style={{
											backgroundColor: active
												? themeColors.text
												: 'transparent',
										}}
									>
										<Text
											className="font-sansMedium text-[12px] uppercase tracking-wider"
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

						<View
							className="self-center"
							style={{ width: DIAL, height: DIAL }}
						>
							<View
								className="absolute rounded-full border"
								style={{
									left: CENTER - RADIUS - 1,
									top: CENTER - RADIUS - 1,
									width: RADIUS * 2 + 2,
									height: RADIUS * 2 + 2,
									borderRadius: RADIUS + 1,
									borderColor: themeColors.border,
								}}
							/>
							{step === 'h'
								? Array.from({ length: 24 }, (_, i) =>
										renderTick(
											`h-${i}`,
											pad2(i),
											dh === i,
											() => {
												setDh(i);
												setStep('m');
											},
											i,
											24,
										),
									)
								: MINUTES.map((m, i) =>
										renderTick(
											`m-${m}`,
											pad2(m),
											dm === m,
											() => setDm(m),
											i,
											12,
										),
									)}

							<View
								className="absolute items-center justify-center"
								style={{
									left: CENTER - 46,
									top: CENTER - 24,
									width: 92,
									height: 48,
									borderRadius: 24,
									backgroundColor: themeColors.background,
								}}
							>
								<Text
									className="font-mono text-[22px]"
									style={{ color: themeColors.text }}
								>
									{pad2(dh)}:{pad2(dm)}
								</Text>
							</View>
						</View>

						<Text
							className="font-mono text-[10px] uppercase tracking-[2px] text-center mt-3"
							style={{ color: themeColors.secondary }}
						>
							{step === 'h'
								? 'Toca a hora, depois escolhe os minutos'
								: 'Minutos de 5 em 5'}
						</Text>

						<View
							className="flex-row items-center justify-between mt-4 pt-4 border-t"
							style={{ borderColor: themeColors.border }}
						>
							<Pressable
								onPress={setNow}
								className="px-3 py-2 rounded-full border mr-2"
								style={{ borderColor: themeColors.border }}
							>
								<Text
									className="font-sansMedium text-[12px] uppercase tracking-wider"
									style={{ color: themeColors.secondary }}
								>
									Agora
								</Text>
							</Pressable>
							<Pressable
								onPress={apply}
								className="flex-1 py-2 rounded-full items-center"
								style={{ backgroundColor: themeColors.text }}
							>
								<Text
									className="font-sansMedium text-[12px] uppercase tracking-wider"
									style={{ color: themeColors.card }}
								>
									Aplicar {pad2(dh)}:{pad2(dm)}
								</Text>
							</Pressable>
						</View>
					</Pressable>
				</Pressable>
			</Modal>
		</>
	);
}
