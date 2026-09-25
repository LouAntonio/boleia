import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

export type StripStop = {
	place: string;
	time: string;
	km?: string;
	kind: 'origin' | 'stop' | 'destination';
};

const NODE = 14;
const R = NODE / 2;
const RAIL_W = 26;
const RAIL = 4;
const TIME_W = 46;

// RouteStrip — caule vertical da estrada: horas à esquerda,
// pista tracejada que preenche com o avanço, marcador de estado na chegada.
export default function RouteStrip({
	origin,
	stops = [],
	destination,
	progress = 0,
	rowHeight = 64,
}: {
	origin: StripStop;
	stops?: StripStop[];
	destination: StripStop;
	progress?: number;
	rowHeight?: number;
}) {
	const { themeColors } = useThemeColors();
	const rows = [origin, ...stops, destination];
	const n = rows.length;
	const totalH = n * rowHeight;
	const p = Math.max(0, Math.min(1, progress));
	const railTop = rowHeight / 2;
	const railH = totalH - rowHeight;

	return (
		<View style={[styles.container, { height: totalH }]}>
			{/* Horas */}
			<View style={styles.timeCol}>
				{rows.map((row, i) => (
					<View
						key={i}
						style={{ height: rowHeight, justifyContent: 'center' }}
					>
						<Text
							// eslint-disable-next-line react-native/no-inline-styles
							style={[
								styles.time,
								{
									color:
										row.kind === 'origin'
											? themeColors.text
											: themeColors.secondary,
								},
							]}
						>
							{row.time}
						</Text>
					</View>
				))}
			</View>

			{/* Trilho */}
			<View style={[styles.railCol, { height: totalH }]}>
				<View
					style={[
						styles.railTrack,
						{
							top: railTop,
							height: railH,
							backgroundColor: themeColors.border,
						},
					]}
				/>
				{p > 0 && (
					<View
						style={[
							styles.railFill,
							{
								top: railTop,
								height: railH * p,
								backgroundColor: themeColors.primary,
							},
						]}
					/>
				)}
				{rows.map((row, i) => (
					<View
						key={`n${i}`}
						style={[
							styles.nodeWrap,
							{
								top: i * rowHeight + rowHeight / 2 - R,
							},
						]}
					>
						<View
							style={[
								row.kind === 'destination'
									? {
											...styles.node,
											backgroundColor:
												themeColors.primary,
										}
									: row.kind === 'origin'
										? {
												...styles.node,
												backgroundColor:
													themeColors.text,
											}
										: {
												...styles.node,
												backgroundColor:
													themeColors.card,
												borderWidth: 2,
												borderColor: themeColors.text,
											},
							]}
						/>
					</View>
				))}
			</View>

			{/* Nomes das paragens */}
			<View style={styles.placeCol}>
				{rows.map((row, i) => (
					<View
						key={`p${i}`}
						style={[styles.placeCell, { height: rowHeight }]}
					>
						{row.kind === 'origin' && (
							<Text
								style={[
									styles.tag,
									{ color: themeColors.secondary },
								]}
							>
								PARTIDA
							</Text>
						)}
						{row.kind === 'destination' ? (
							<View
								style={[
									styles.stamp,
									{ borderColor: themeColors.border },
								]}
							>
								<Text
									style={[
										styles.placeDest,
										{ color: themeColors.text },
									]}
								>
									{row.place}
								</Text>
							</View>
						) : (
							<View style={styles.placeRow}>
								<Text
									// eslint-disable-next-line react-native/no-inline-styles
									style={[
										styles.place,
										{
											color:
												row.kind === 'origin'
													? themeColors.text
													: themeColors.secondary,
										},
									]}
								>
									{row.place}
								</Text>
								{row.km ? (
									<Text
										style={[
											styles.km,
											{ color: themeColors.border },
										]}
									>
										{row.km}
									</Text>
								) : null}
							</View>
						)}
					</View>
				))}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
	},
	timeCol: {
		width: TIME_W,
	},
	time: {
		fontFamily: 'HankenGrotesk_500Medium',
		fontSize: 13,
	},
	railCol: {
		width: RAIL_W,
		overflow: 'hidden',
	},
	railTrack: {
		position: 'absolute',
		left: (RAIL_W - RAIL) / 2,
		width: RAIL,
		borderRadius: RAIL / 2,
	},
	railFill: {
		position: 'absolute',
		left: (RAIL_W - RAIL) / 2,
		width: RAIL,
		borderRadius: RAIL / 2,
	},
	nodeWrap: {
		position: 'absolute',
		left: (RAIL_W - NODE) / 2,
		width: NODE,
		height: NODE,
		alignItems: 'center',
		justifyContent: 'center',
	},
	node: {
		width: NODE,
		height: NODE,
		borderRadius: R,
	},
	placeCol: {
		flex: 1,
		paddingLeft: 8,
	},
	placeCell: {
		justifyContent: 'center',
	},
	tag: {
		fontFamily: 'HankenGrotesk_700Bold',
		fontSize: 11,
		marginBottom: 2,
	},
	placeRow: {
		flexDirection: 'row',
		alignItems: 'baseline',
	},
	place: {
		fontFamily: 'HankenGrotesk_700Bold',
		fontSize: 15,
	},
	km: {
		fontFamily: 'HankenGrotesk_400Regular',
		fontSize: 12,
		marginLeft: 8,
	},
	stamp: {
		alignSelf: 'flex-start',
		borderWidth: 2,
		borderRadius: 6,
		paddingHorizontal: 8,
		paddingVertical: 3,
	},
	placeDest: {
		fontFamily: 'HankenGrotesk_700Bold',
		fontSize: 15,
		letterSpacing: 0.2,
	},
});
