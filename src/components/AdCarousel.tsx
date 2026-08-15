import React, { useEffect, useState } from 'react';
import { View, Text, AccessibilityInfo } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useThemeColors } from '../hooks/useThemeColors';

const AUTO_MS = 5000;

type Ad = {
	id: string;
	image: number;
	eyebrow: string;
	title: string;
};

// Cartaz fixo: a imagem muda in-place (crossfade), sem scroll horizontal.
const ADS: Ad[] = [
	{
		id: 'ad1',
		image: require('../../assets/images/onboarding_1.png'),
		eyebrow: 'Nova rota',
		title: 'Luanda → Benguela todos os dias',
	},
	{
		id: 'ad2',
		image: require('../../assets/images/onboarding_2.png'),
		eyebrow: 'Em destaque',
		title: 'Motoristas verificados e pontuais',
	},
	{
		id: 'ad3',
		image: require('../../assets/images/onboarding_3.png'),
		eyebrow: 'Oferta',
		title: 'Carteira Boleia a carregar sem taxas',
	},
];

export default function AdCarousel() {
	const { themeColors } = useThemeColors();
	const [index, setIndex] = useState(0);

	useEffect(() => {
		let timer: ReturnType<typeof setInterval> | null = null;
		let cancelled = false;
		AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
			if (reduced || cancelled) return;
			timer = setInterval(() => {
				setIndex((i) => (i + 1) % ADS.length);
			}, AUTO_MS);
		});
		return () => {
			cancelled = true;
			if (timer) clearInterval(timer);
		};
	}, []);

	const ad = ADS[index];

	return (
		<View className="mb-6">
			<View className="flex-row items-center justify-between mb-2">
				<Text
					className="font-mono text-[10px] uppercase tracking-[3px]"
					style={{ color: themeColors.secondary }}
				>
					Publicidade
				</Text>
				<View className="flex-row">
					{ADS.map((a, i) => (
						<View
							key={a.id}
							className="h-1.5 rounded-full mx-0.5"
							style={{
								width: i === index ? 18 : 6,
								backgroundColor:
									i === index
										? themeColors.primary
										: themeColors.border,
							}}
						/>
					))}
				</View>
			</View>

			<View
				className="rounded-2xl overflow-hidden border"
				style={{
					height: 170,
					borderColor: themeColors.border,
				}}
			>
				<Animated.Image
					key={ad.id}
					source={ad.image}
					resizeMode="cover"
					entering={FadeIn.duration(600)}
					exiting={FadeOut.duration(600)}
					className="absolute inset-0 w-full h-full"
				/>
				<View className="absolute inset-0 justify-end px-4 pb-4 pt-10">
					<View
						className="self-start rounded-full px-2 py-0.5 mb-1.5"
						style={{ backgroundColor: themeColors.primary }}
					>
						<Text
							className="font-mono text-[9px] uppercase tracking-widest"
							style={{ color: themeColors.text }}
						>
							{ad.eyebrow}
						</Text>
					</View>
					<Text
						className="font-display text-[17px]"
						style={{
							color: themeColors.background,
							textShadowColor: 'rgba(0,0,0,0.55)',
							textShadowOffset: { width: 0, height: 1 },
							textShadowRadius: 6,
						}}
					>
						{ad.title}
					</Text>
				</View>
			</View>
		</View>
	);
}
