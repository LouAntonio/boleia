import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Booking, Ride } from '../types/boleia';
import { useThemeColors } from '../hooks/useThemeColors';
import { hhmm, fmtKz } from '../mock/helpers';
import { rideMode } from '../mock/repos/rideRepo';
import { statusMeta } from '../utils/status';
import RouteRail from './RouteRail';
import Perforation from './Perforation';
import QRStamp from './QRStamp';
import BoleiaButton from './BoleiaButton';

const OUTCOME_ICON: Record<
	string,
	'checkmark-circle' | 'close-circle' | 'time-outline'
> = {
	concluida: 'checkmark-circle',
	expirada: 'time-outline',
};

// Recibo do histórico — bilhete espelho do das Próximas, mas "arquivado":
// banda cinza, rail neutro e QR esbatido, com carimbo USADO / SEM EFEITO
// sobre o talão. A viagem já passou.
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
	const meta = statusMeta(booking.status);
	const icon = OUTCOME_ICON[booking.status] ?? 'close-circle';
	const stampText = booking.status === 'concluida' ? 'USADO' : 'SEM EFEITO';
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
		<View
			className="rounded-3xl border overflow-hidden"
			style={{
				borderColor: themeColors.border,
				backgroundColor: themeColors.card,
			}}
		>
			<View
				className="px-4 pt-3 pb-2.5"
				style={{ backgroundColor: themeColors.border }}
			>
				<View className="flex-row items-center justify-between">
					<View className="flex-row items-center">
						<Ionicons
							name={icon}
							size={14}
							color={themeColors.secondary}
						/>
						<Text
							className="font-mono text-[10px] uppercase tracking-[2px] ml-1.5"
							style={{ color: themeColors.secondary }}
						>
							{meta.label}
						</Text>
					</View>
					<Text
						className="font-mono text-[10px] uppercase tracking-[2px]"
						style={{
							color: themeColors.secondary,
							opacity: 0.85,
						}}
					>
						{dateLabel} · {hhmm(ride.departure)}
					</Text>
				</View>
				<Text
					numberOfLines={1}
					className="font-display text-[21px] leading-7 mt-1"
					style={{ color: themeColors.secondary }}
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
					railColor={themeColors.border}
				/>
				<View className="flex-row items-center justify-between mt-2.5">
					<Text
						className="font-mono text-[10px] uppercase tracking-[1px] flex-1"
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

			<View className="px-4 pb-4" style={{ position: 'relative' }}>
				<View className="flex-row items-center">
					<QRStamp seed={booking.id} size={50} muted />
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

				<View
					pointerEvents="none"
					style={{
						position: 'absolute',
						top: 4,
						alignSelf: 'center',
						transform: [{ rotate: '-12deg' }],
						opacity: 0.45,
					}}
				>
					<View
						className="rounded-lg border-2 px-3 py-1"
						style={{ borderColor: themeColors.secondary }}
					>
						<Text
							className="font-mono text-[13px] uppercase tracking-[3px]"
							style={{ color: themeColors.secondary }}
						>
							{stampText}
						</Text>
					</View>
				</View>

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
			</View>
		</View>
	);
}
