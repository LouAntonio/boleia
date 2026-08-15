import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

const SIZE = 9;
const FINDER_CELLS: Array<[number, number]> = [
	[0, 0],
	[0, 6],
	[6, 0],
];

// eslint-disable-next-line no-bitwise
function hashSeed(str: string): number {
	let h = 2166136261;
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

/* eslint-disable no-bitwise */
function mulberry32(a: number) {
	return function () {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// QRStamp — pseudo-QR determinístico a partir do id (mock, não scannable).
// O "bilhete" ganha o glifo moderno do QR sem depender de uma biblioteca.
export default function QRStamp({
	seed,
	size = 56,
}: {
	seed: string;
	size?: number;
}) {
	const { themeColors } = useThemeColors();
	const cell = size / SIZE;

	const cells = useMemo(() => {
		const rand = mulberry32(hashSeed(seed));
		const grid: boolean[] = [];
		for (let i = 0; i < SIZE * SIZE; i++) {
			const r = Math.floor(i / SIZE);
			const c = i % SIZE;
			const inFinder = FINDER_CELLS.some(
				([fr, fc]) => r >= fr && r < fr + 3 && c >= fc && c < fc + 3,
			);
			grid.push(inFinder ? false : rand() > 0.52);
		}
		return grid;
	}, [seed]);

	return (
		<View
			style={[
				styles.box,
				{ width: size, height: size, borderColor: themeColors.border },
			]}
		>
			{cells.map((filled, i) =>
				filled ? (
					<View
						key={i}
						style={{
							position: 'absolute',
							left: (i % SIZE) * cell,
							top: Math.floor(i / SIZE) * cell,
							width: cell,
							height: cell,
							backgroundColor: themeColors.text,
						}}
					/>
				) : null,
			)}
			{FINDER_CELLS.map(([fr, fc], i) => (
				<View
					key={`f${i}`}
					style={{
						position: 'absolute',
						left: fc * cell,
						top: fr * cell,
						width: cell * 3,
						height: cell * 3,
						borderWidth: cell,
						borderColor: themeColors.text,
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<View
						style={{
							width: cell,
							height: cell,
							backgroundColor: themeColors.text,
						}}
					/>
				</View>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	box: {
		borderWidth: 1,
		borderRadius: 6,
	},
});
