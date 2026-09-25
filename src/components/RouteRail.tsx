import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

export type RailEnd = {
	place: string;
	time: string;
};

// RouteRail — rail horizontal compacto: Origem (hora) —·—·— (hora) Destino.
// O traço enche até `progress` e, em viagem, um ponto "em movimento" desliza
// pela pista. Compacto o suficiente para o cartão de resultado.
export default function RouteRail({
	origin,
	destination,
	progress = 0,
	live = false,
	railColor,
}: {
	origin: RailEnd;
	destination: RailEnd;
	progress?: number;
	live?: boolean;
	railColor?: string;
}) {
	const { themeColors } = useThemeColors();
	const p = Math.max(0, Math.min(1, progress));
	const fill = railColor ?? themeColors.primary;
	const track = themeColors.border;

	return (
		<View style={styles.wrap}>
			<View style={styles.end}>
				<Text style={[styles.time, { color: themeColors.text }]}>
					{origin.time}
				</Text>
				<Text
					numberOfLines={1}
					style={[styles.place, { color: themeColors.text }]}
				>
					{origin.place}
				</Text>
			</View>

			<View style={styles.railBox}>
				<View style={[styles.track, { backgroundColor: track }]} />
				{p > 0 && (
					<View
						style={[
							styles.fill,
							{ backgroundColor: fill, width: `${p * 100}%` },
						]}
					/>
				)}
				{live && (
					<View
						style={[
							styles.car,
							{
								backgroundColor: fill,
								borderColor: themeColors.card,
								left: `${p * 100}%`,
							},
						]}
					/>
				)}
			</View>

			<View style={[styles.end, styles.endRight]}>
				<Text style={[styles.time, { color: themeColors.secondary }]}>
					{destination.time}
				</Text>
				<Text
					numberOfLines={1}
					style={[styles.place, { color: themeColors.text }]}
				>
					{destination.place}
				</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	end: {
		flexShrink: 1,
		maxWidth: 96,
	},
	endRight: {
		alignItems: 'flex-end',
	},
	time: {
		fontFamily: 'HankenGrotesk_500Medium',
		fontSize: 12,
	},
	place: {
		fontFamily: 'HankenGrotesk_700Bold',
		fontSize: 12,
		marginTop: 1,
	},
	railBox: {
		flex: 1,
		marginHorizontal: 10,
		height: 20,
		justifyContent: 'center',
	},
	track: {
		position: 'absolute',
		left: 0,
		right: 0,
		height: 3,
		borderRadius: 1.5,
	},
	fill: {
		position: 'absolute',
		left: 0,
		height: 3,
		borderRadius: 1.5,
	},
	car: {
		position: 'absolute',
		width: 10,
		height: 10,
		borderRadius: 5,
		marginLeft: -5,
		borderWidth: 2,
	},
});
