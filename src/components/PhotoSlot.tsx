import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';

// Slot de foto do dossiê (KYC / viatura) — borda tracejada enquanto vazio,
// imagem + badge de remover quando preenchido. Rótulo mono em `secondary` (a11y).
// Dimensão explícita (`size`) em vez de aspectRatio + largura percentual:
// garante quadrados compactos e determinísticos em qualquer plataforma.
// Toque: card preenchido → `onView` (visualizador); vazio → `onPick` (galeria).
export default function PhotoSlot({
	uri,
	label,
	onPick,
	onRemove,
	onView,
	size,
	className = '',
}: {
	uri: string | null;
	label: string;
	onPick: () => void;
	onRemove?: () => void;
	onView?: () => void;
	size: number;
	className?: string;
}) {
	const { themeColors } = useThemeColors();

	return (
		<View className={className} style={{ width: size }}>
			<Pressable
				onPress={uri ? (onView ?? onPick) : onPick}
				className="rounded-2xl border items-center justify-center"
				style={({ pressed }) => ({
					width: size,
					height: size,
					overflow: 'hidden',
					borderColor: themeColors.border,
					borderStyle: uri ? 'solid' : 'dashed',
					backgroundColor: themeColors.card,
					opacity: pressed ? 0.8 : 1,
				})}
			>
				{uri ? (
					<Image
						source={{ uri }}
						resizeMode="cover"
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							width: size,
							height: size,
						}}
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
