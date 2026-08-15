import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';

// Slot de foto do dossiê (KYC / viatura) — borda tracejada enquanto vazio,
// imagem + badge de remover quando preenchido. Rótulo mono em `secondary` (a11y).
// Quadrado via aspectRatio; a grelha no ecrã limita a largura (max-w) para não
// crescer em ecrãs largos. `className` substitui o padrão `flex-1`.
export default function PhotoSlot({
	uri,
	label,
	onPick,
	onRemove,
	wide = false,
	className = '',
}: {
	uri: string | null;
	label: string;
	onPick: () => void;
	onRemove?: () => void;
	wide?: boolean;
	className?: string;
}) {
	const { themeColors } = useThemeColors();

	return (
		<View className={className || 'flex-1'}>
			<Pressable
				onPress={onPick}
				className="w-full rounded-2xl border items-center justify-center overflow-hidden"
				style={({ pressed }) => ({
					borderColor: themeColors.border,
					borderStyle: uri ? 'solid' : 'dashed',
					backgroundColor: themeColors.card,
					aspectRatio: wide ? 16 / 9 : 1,
					opacity: pressed ? 0.8 : 1,
				})}
			>
				{uri ? (
					<Image
						source={{ uri }}
						className="w-full h-full"
						resizeMode="cover"
					/>
				) : (
					<View className="items-center justify-center">
						<View
							className="w-9 h-9 rounded-full items-center justify-center"
							style={{
								backgroundColor: `${themeColors.laterite}1A`,
							}}
						>
							<Ionicons
								name="camera-outline"
								size={17}
								color={themeColors.laterite}
							/>
						</View>
						<Text
							className="font-mono text-[8px] uppercase tracking-[1.5px] mt-1.5"
							style={{ color: themeColors.secondary }}
						>
							Adicionar
						</Text>
					</View>
				)}
				{uri && onRemove ? (
					<Pressable
						onPress={onRemove}
						hitSlop={8}
						className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full items-center justify-center"
						style={({ pressed }) => ({
							backgroundColor: themeColors.text,
							opacity: pressed ? 0.7 : 1,
						})}
					>
						<Ionicons
							name="close"
							size={13}
							color={themeColors.card}
						/>
					</Pressable>
				) : null}
			</Pressable>
			<Text
				numberOfLines={1}
				className="font-mono text-[9px] uppercase tracking-[1.5px] mt-1.5 text-center"
				style={{ color: themeColors.secondary }}
			>
				{label}
			</Text>
		</View>
	);
}

// Rail de progresso do dossiê — a pista enche (mato) à medida que as fotos entram.
export function ProgressRail({ done, total }: { done: number; total: number }) {
	const { themeColors } = useThemeColors();
	const p = Math.max(0, Math.min(1, done / total));
	const complete = done >= total;

	return (
		<View>
			<View className="flex-row items-center justify-between">
				<Text
					className="font-mono text-[9px] uppercase tracking-[2px]"
					style={{ color: themeColors.secondary }}
				>
					{done} de {total} {total === 1 ? 'foto' : 'fotos'}
				</Text>
				<Text
					className="font-mono text-[9px] uppercase tracking-[2px]"
					style={{
						color: complete
							? themeColors.mato
							: themeColors.secondary,
					}}
				>
					{complete ? 'Completo' : 'Por completar'}
				</Text>
			</View>
			<View
				className="h-[6px] rounded-full mt-1.5 overflow-hidden"
				style={{ backgroundColor: themeColors.border }}
			>
				<View
					className="h-full rounded-full"
					style={{
						backgroundColor: themeColors.mato,
						width: `${p * 100}%`,
					}}
				/>
			</View>
		</View>
	);
}
