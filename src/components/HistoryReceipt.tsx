import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Booking, Ride } from '../types/boleia';
import { useThemeColors } from '../hooks/useThemeColors';
import { hhmm, fmtKz } from '../mock/helpers';
import RouteStrip, { StripStop } from './RouteStrip';
import Perforation from './Perforation';
import BoleiaButton from './BoleiaButton';

function outcomeOf(status: string, themeColors: Record<string, string>) {
	if (status === 'concluida') {
		return {
			icon: 'checkmark-circle' as const,
			color: themeColors.mato,
			tint: `${themeColors.mato.replace('#', '')}1F`,
		};
	}
	return {
		icon: 'close-circle' as const,
		color: themeColors.error,
		tint: `${themeColors.error.replace('#', '')}1F`,
	};
}

// Recibo do histórico — linha compacta com resultado (check/x) que expande
// ao toque para mostrar a rota completa e o talão. Esbatido, ao contrário
// do bilhete vivo das próximas.
export default function HistoryReceipt({
	booking,
	ride,
	onReview,
}: {
	booking: Booking;
	ride: Ride;
	onReview?: () => void;
}) {
	const { themeColors } = useThemeColors();
	const [expanded, setExpanded] = useState(false);
	const outcome = outcomeOf(booking.status, themeColors);
	const code = `BL-${booking.id.replace(/^bk_/, '').toUpperCase()}`;
	const dateLabel = new Date(ride.departure).toLocaleDateString('pt-PT', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	});

	const origin: StripStop = {
		place: ride.origin.name,
		time: hhmm(ride.departure),
		km: `${ride.origin.km} km`,
		kind: 'origin',
	};
	const stops: StripStop[] = ride.stops.map((s) => ({
		place: s.name,
		time: s.time,
		km: `${s.km} km`,
		kind: 'stop',
	}));
	const destination: StripStop = {
		place: ride.destination.name,
		time: hhmm(ride.arrival),
		km: `${ride.destination.km} km`,
		kind: 'destination',
	};

	return (
		<View
			className="rounded-2xl border overflow-hidden"
			style={{
				borderColor: themeColors.border,
				backgroundColor: themeColors.card,
			}}
		>
			<Pressable
				onPress={() => setExpanded((e) => !e)}
				className="flex-row items-center px-4 py-3"
				style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
			>
				<View
					className="w-9 h-9 rounded-full items-center justify-center"
					style={{ backgroundColor: `#${outcome.tint}` }}
				>
					<Ionicons
						name={outcome.icon}
						size={18}
						color={outcome.color}
					/>
				</View>
				<View className="flex-1 ml-3">
					<Text
						numberOfLines={1}
						className="font-sansBold text-[14px]"
						style={{ color: themeColors.text }}
					>
						{ride.origin.name} → {ride.destination.name}
					</Text>
					<Text
						className="font-mono text-[10px] uppercase tracking-wider mt-0.5"
						style={{ color: themeColors.secondary }}
					>
						{dateLabel}
					</Text>
				</View>
				<Text
					className="font-mono text-[12px]"
					style={{ color: themeColors.secondary }}
				>
					{fmtKz(booking.amount)}
				</Text>
				<Ionicons
					name={expanded ? 'chevron-up' : 'chevron-down'}
					size={15}
					color={themeColors.border}
					style={{ marginLeft: 8 }}
				/>
			</Pressable>

			{expanded && (
				<Animated.View
					entering={FadeInDown.duration(180)}
					className="px-4 pb-4 border-t"
					style={{ borderTopColor: themeColors.border }}
				>
					<View className="pt-3">
						<RouteStrip
							origin={origin}
							stops={stops}
							destination={destination}
							rowHeight={40}
						/>
					</View>
					<Perforation tight />
					<View className="flex-row items-center justify-between">
						<Text
							className="font-mono text-[11px] uppercase tracking-[2px]"
							style={{ color: themeColors.laterite }}
						>
							{code}
						</Text>
						<Text
							className="font-mono text-[11px]"
							style={{ color: themeColors.secondary }}
						>
							{booking.seats} lugar
							{booking.seats > 1 ? 'es' : ''}
						</Text>
					</View>
					{booking.reason ? (
						<Text
							className="font-sans text-[11px] mt-1"
							style={{ color: themeColors.error }}
						>
							{booking.reason}
						</Text>
					) : null}
					{booking.status === 'concluida' && onReview ? (
						<View className="mt-3">
							<BoleiaButton
								small
								title="Avaliar motorista"
								variant="outline"
								onPress={onReview}
							/>
						</View>
					) : null}
				</Animated.View>
			)}
		</View>
	);
}
