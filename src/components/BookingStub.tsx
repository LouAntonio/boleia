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
import { rideProgress, rideMode } from '../mock/repos/rideRepo';
import { statusMeta } from '../utils/status';
import RouteRail from './RouteRail';
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

// Bilhete vivo Boleia viva — banda sólida de estado com rota em display,
// rail de progresso e talão com QR + total. Sem perfuração, sem contorno.
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
	const modeLabel =
		rideMode(ride) === 'interprovincial'
			? 'Interprovincial'
			: 'Intermunicipal';
	const stopsLabel =
		ride.stops.length === 0
			? 'sem paragens'
			: `${ride.stops.length} paragem${ride.stops.length === 1 ? '' : 'ens'}`;

	return (
		<Pressable
			onPress={onPress}
			className="rounded-3xl overflow-hidden"
			style={({ pressed }) => ({
				backgroundColor: themeColors.card,
				opacity: pressed ? 0.94 : 1,
				transform: [{ scale: pressed ? 0.99 : 1 }],
				shadowColor: '#000',
				shadowOpacity: 0.08,
				shadowOffset: { width: 0, height: 4 },
				shadowRadius: 12,
				elevation: 3,
			})}
		>
			<View
				className="px-5 pt-4 pb-3.5"
				style={{ backgroundColor: band.bg }}
			>
				<View className="flex-row items-center justify-between">
					<View className="flex-row items-center">
						<Ionicons name={band.icon} size={15} color={band.fg} />
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
					className="font-display text-[23px] leading-8 mt-1.5"
					style={{ color: band.fg }}
				>
					{ride.origin.name} → {ride.destination.name}
				</Text>
			</View>

			<View className="px-5 py-4">
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
				<View className="flex-row items-center justify-between mt-3">
					<Text
						className="font-sans text-[12px] flex-1"
						style={{ color: themeColors.secondary }}
					>
						{modeLabel} · {stopsLabel}
					</Text>
					<Text
						className="font-mono text-[11px] uppercase tracking-[2px] ml-3"
						style={{ color: themeColors.laterite }}
					>
						{code}
					</Text>
				</View>
				{note ? (
					<Text
						numberOfLines={1}
						className="font-sans text-[12px] mt-1.5"
						style={{ color: themeColors.secondary }}
					>
						{note}
					</Text>
				) : null}
				{booking.reason ? (
					<Text
						className="font-sans text-[12px] mt-1"
						style={{ color: themeColors.error }}
					>
						{booking.reason}
					</Text>
				) : null}
			</View>

			<View
				className="px-5 py-4 border-t"
				style={{
					borderColor: themeColors.border,
					backgroundColor: themeColors.background,
				}}
			>
				<View className="flex-row items-center">
					<QRStamp seed={booking.id} size={52} />
					<View className="flex-1 ml-3">
						<Text
							className="font-display text-[22px]"
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
				{footer ? <View className="mt-4">{footer}</View> : null}
			</View>
		</Pressable>
	);
}
