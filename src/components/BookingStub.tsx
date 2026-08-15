import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Booking, Ride } from '../types/boleia';
import { useThemeColors } from '../hooks/useThemeColors';
import { hhmm, fmtKz } from '../mock/helpers';
import RouteStrip, { StripStop } from './RouteStrip';
import StatusStamp from './StatusStamp';
import Perforation from './Perforation';

const PAY_LABEL: Record<string, string> = {
	carteira: 'Carteira',
	dinheiro: 'Dinheiro',
	multicaixa: 'Multicaixa',
};

// Bilhete de reserva — cupão (rota + carimbo) · perfuração · talão destacável
// (código BL-…, lugares, valor, pagamento). Mesma assinatura do ticket da Home.
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
	const code = `BL-${booking.id.replace(/^bk_/, '').toUpperCase()}`;

	return (
		<Pressable
			onPress={onPress}
			className="rounded-3xl border overflow-hidden"
			style={({ pressed }) => ({
				borderColor: themeColors.border,
				backgroundColor: themeColors.card,
				opacity: pressed ? 0.9 : 1,
			})}
		>
			<View className="px-4 pt-4">
				<View className="flex-row items-center justify-between mb-1">
					<Text
						className="font-display text-[16px]"
						style={{ color: themeColors.text }}
					>
						{ride.routeName}
					</Text>
					<StatusStamp status={booking.status} />
				</View>
				<Text
					className="font-mono text-[11px] uppercase tracking-wider mb-3"
					style={{ color: themeColors.secondary }}
				>
					Saída{' '}
					{new Date(ride.departure).toLocaleDateString('pt-PT', {
						weekday: 'short',
						day: 'numeric',
						month: 'short',
					})}{' '}
					· {hhmm(ride.departure)}
				</Text>
				<RouteStrip
					origin={origin}
					stops={stops}
					destination={destination}
				/>
			</View>

			<Perforation tight />

			<View className="px-4 pb-4">
				<View className="flex-row items-center justify-between">
					<Text
						className="font-mono text-[12px] uppercase tracking-[2px]"
						style={{ color: themeColors.laterite }}
					>
						{code}
					</Text>
					<View
						className="self-start rounded-full px-2 py-0.5 border"
						style={{ borderColor: themeColors.border }}
					>
						<Text
							className="font-mono text-[9px] uppercase tracking-wider"
							style={{ color: themeColors.secondary }}
						>
							{PAY_LABEL[booking.paymentMethod] ??
								booking.paymentMethod}
						</Text>
					</View>
				</View>
				<View className="flex-row items-center justify-between mt-1.5">
					<Text
						className="font-mono text-[14px]"
						style={{ color: themeColors.text }}
					>
						{booking.seats} lugar
						{booking.seats > 1 ? 'es' : ''} ·{' '}
						{fmtKz(booking.amount)}
					</Text>
					{note ? (
						<Text
							className="font-sans text-[11px]"
							style={{ color: themeColors.secondary }}
						>
							{note}
						</Text>
					) : null}
				</View>
				{footer ? <View className="mt-3">{footer}</View> : null}
			</View>
		</Pressable>
	);
}
