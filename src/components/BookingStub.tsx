import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withRepeat,
	withSequence,
	withTiming,
	useReducedMotion,
} from 'react-native-reanimated';
import { Booking, Ride } from '../types/boleia';
import { useThemeColors } from '../hooks/useThemeColors';
import { hhmm, fmtKz } from '../mock/helpers';
import { rideProgress } from '../mock/repos/rideRepo';
import { statusMeta } from '../utils/status';
import RouteRail from './RouteRail';
import Perforation from './Perforation';
import QRStamp from './QRStamp';

const CELU = '#F7F3E7';
const ASFALTO = '#17141B';

function LiveDot({ color }: { color: string }) {
	const reduced = useReducedMotion();
	const opacity = useSharedValue(1);

	useEffect(() => {
		if (reduced) return;
		opacity.value = withRepeat(
			withSequence(
				withTiming(0.25, { duration: 900 }),
				withTiming(1, { duration: 900 }),
			),
			-1,
		);
	}, [reduced, opacity]);

	const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
	return (
		<Animated.View
			style={[
				animated,
				{
					width: 8,
					height: 8,
					borderRadius: 4,
					backgroundColor: color,
				},
			]}
		/>
	);
}

function bandOf(status: string, themeColors: Record<string, string>) {
	switch (status) {
		case 'pedido':
			return {
				bg: themeColors.laterite,
				fg: CELU,
				icon: 'time-outline' as const,
				label: 'A aguardar confirmação',
			};
		case 'confirmada':
			return {
				bg: themeColors.primary,
				fg: ASFALTO,
				icon: 'checkmark-circle' as const,
				label: 'Confirmada',
			};
		case 'em_viagem':
			return {
				bg: themeColors.mato,
				fg: CELU,
				icon: 'navigate' as const,
				label: 'Ao vivo',
			};
		case 'concluida':
			return {
				bg: themeColors.mato,
				fg: CELU,
				icon: 'checkmark-circle' as const,
				label: 'Concluída',
			};
		default:
			return {
				bg: themeColors.error,
				fg: CELU,
				icon: 'close-circle' as const,
				label: statusMeta(status).label,
			};
	}
}

// Bilhete vivo — banda tingida por estado, rail horizontal com progresso,
// talão destacável com QR decorativo. A assinatura da carteira de reservas.
export default function BookingStub({
	booking,
	ride,
	onPress,
	footer,
	note,
}: {
	booking: Booking;
	ride: Ride;
	onPress?: () => void;
	footer?: React.ReactNode;
	note?: string;
}) {
	const { themeColors } = useThemeColors();
	const band = bandOf(booking.status, themeColors);
	const live = booking.status === 'em_viagem';
	const code = `BL-${booking.id.replace(/^bk_/, '').toUpperCase()}`;
	const dateLabel = new Date(ride.departure).toLocaleDateString('pt-PT', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
	});

	return (
		<Pressable
			onPress={onPress}
			className="rounded-3xl border overflow-hidden"
			style={({ pressed }) => ({
				borderColor: themeColors.border,
				backgroundColor: themeColors.card,
				opacity: pressed ? 0.92 : 1,
				transform: [{ scale: pressed ? 0.99 : 1 }],
			})}
		>
			<View
				className="px-4 pt-3 pb-2.5"
				style={{ backgroundColor: band.bg }}
			>
				<View className="flex-row items-center justify-between">
					<View className="flex-row items-center">
						<Ionicons name={band.icon} size={14} color={band.fg} />
						<Text
							className="font-mono text-[10px] uppercase tracking-[2px] ml-1.5"
							style={{ color: band.fg }}
						>
							{band.label}
						</Text>
					</View>
					<View className="flex-row items-center">
						{live && (
							<View className="mr-2">
								<LiveDot color={band.fg} />
							</View>
						)}
						<Text
							className="font-mono text-[10px] uppercase tracking-[2px]"
							style={{ color: band.fg, opacity: 0.85 }}
						>
							{dateLabel} · {hhmm(ride.departure)}
						</Text>
					</View>
				</View>
				<Text
					numberOfLines={1}
					className="font-display text-[21px] leading-7 mt-1"
					style={{ color: band.fg }}
				>
					{ride.origin.name} → {ride.destination.name}
				</Text>
			</View>

			<View className="px-4 py-3">
				<RouteRail
					origin={{
						place: ride.origin.name,
						time: hhmm(ride.departure),
					}}
					destination={{
						place: ride.destination.name,
						time: hhmm(ride.arrival),
					}}
					progress={live ? rideProgress(ride) : 0}
					live={live}
					railColor={live ? themeColors.mato : themeColors.primary}
				/>
				<View className="flex-row items-center justify-between mt-2.5">
					<Text
						className="font-mono text-[11px] uppercase tracking-[2px]"
						style={{ color: themeColors.laterite }}
					>
						{code}
					</Text>
					{note ? (
						<Text
							numberOfLines={1}
							className="font-mono text-[10px] flex-1 text-right ml-3"
							style={{ color: themeColors.secondary }}
						>
							{note}
						</Text>
					) : null}
				</View>
				{booking.reason ? (
					<Text
						className="font-sans text-[11px] mt-1"
						style={{ color: themeColors.error }}
					>
						{booking.reason}
					</Text>
				) : null}
			</View>

			<Perforation tight />

			<View className="px-4 pb-4">
				<View className="flex-row items-center">
					<QRStamp seed={booking.id} size={50} />
					<View className="flex-1 ml-3">
						<Text
							className="font-display text-[20px]"
							style={{ color: themeColors.text }}
						>
							{fmtKz(booking.amount)}
						</Text>
						<Text
							className="font-mono text-[10px] uppercase tracking-wider mt-0.5"
							style={{ color: themeColors.secondary }}
						>
							{booking.seats} lugar
							{booking.seats > 1 ? 'es' : ''}
						</Text>
					</View>
				</View>
				{footer ? <View className="mt-3">{footer}</View> : null}
			</View>
		</Pressable>
	);
}
