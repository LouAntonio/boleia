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
				bg: themeColors.caution,
				fg: themeColors.cautionText,
				icon: 'time-outline' as const,
				label: 'A aguardar confirmação',
			};
		case 'confirmada':
			return {
				bg: themeColors.primary,
				fg: themeColors.onPrimary,
				icon: 'checkmark-circle' as const,
				label: 'Confirmada',
			};
		case 'em_viagem':
			return {
				bg: themeColors.success,
				fg: themeColors.onPrimary,
				icon: 'navigate' as const,
				label: 'Ao vivo',
			};
		case 'concluida':
			return {
				bg: themeColors.success,
				fg: themeColors.onPrimary,
				icon: 'checkmark-circle' as const,
				label: 'Concluída',
			};
		default:
			return {
				bg: themeColors.dangerWeak,
				fg: themeColors.error,
				icon: 'close-circle' as const,
				label: statusMeta(status).label,
			};
	}
}

// Cartão de reserva — banda de estado com a cor da semântica, itinerário
// completo em rail e o total em coluna própria. O estado aparece sempre com
// ícone + rótulo (nunca só cor).
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
			accessibilityRole="button"
			className="rounded-xl overflow-hidden"
			style={({ pressed }) => ({
				backgroundColor: themeColors.card,
				opacity: pressed ? 0.94 : 1,
				shadowColor: '#000',
				shadowOpacity: 0.08,
				shadowOffset: { width: 0, height: 4 },
				shadowRadius: 12,
				elevation: 3,
			})}
		>
			<View
				className="px-4 pt-3.5 pb-3"
				style={{ backgroundColor: band.bg }}
			>
				<View className="flex-row items-center justify-between">
					<View className="flex-row items-center">
						<Ionicons name={band.icon} size={15} color={band.fg} />
						<Text
							className="font-sansBold text-body-small ml-1.5"
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
							className="font-sansMedium text-body-small"
							style={{ color: band.fg }}
						>
							{dateLabel} · {hhmm(ride.departure)}
						</Text>
					</View>
				</View>
				<Text
					numberOfLines={1}
					className="font-sansExtraBold text-title-secondary mt-1.5"
					style={{ color: band.fg }}
				>
					{ride.origin.name} → {ride.destination.name}
				</Text>
			</View>

			<View className="px-4 py-4">
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
					railColor={live ? themeColors.success : themeColors.primary}
				/>
				<View className="flex-row items-center justify-between mt-3">
					<Text
						className="font-sans text-body-small flex-1"
						style={{ color: themeColors.secondary }}
					>
						{modeLabel} · {stopsLabel}
					</Text>
					<Text
						className="font-sansMedium text-body-small ml-3"
						style={{ color: themeColors.secondary }}
					>
						{code}
					</Text>
				</View>
				{note ? (
					<Text
						numberOfLines={1}
						className="font-sans text-body-small mt-1.5"
						style={{ color: themeColors.secondary }}
					>
						{note}
					</Text>
				) : null}
				{booking.reason ? (
					<Text
						className="font-sans text-body-small mt-1"
						style={{ color: themeColors.error }}
					>
						{booking.reason}
					</Text>
				) : null}
			</View>

			<View
				className="px-4 py-3.5 border-t"
				style={{
					borderColor: themeColors.border,
					backgroundColor: themeColors.background,
				}}
			>
				<View className="flex-row items-center justify-between">
					<Text
						className="font-sans text-body-small"
						style={{ color: themeColors.secondary }}
					>
						{booking.seats} lugar{booking.seats > 1 ? 'es' : ''}
					</Text>
					<Text
						className="font-sansBold text-title-tertiary"
						style={{ color: themeColors.text }}
					>
						{fmtKz(booking.amount)}
					</Text>
				</View>
				{footer ? <View className="mt-4">{footer}</View> : null}
			</View>
		</Pressable>
	);
}
