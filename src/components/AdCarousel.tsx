import React, { useEffect, useRef, useState } from 'react';
import {
	View,
	Text,
	Dimensions,
	FlatList,
	ImageBackground,
	AccessibilityInfo,
	NativeScrollEvent,
	NativeSyntheticEvent,
} from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W * 0.78;
const GAP = 10;
const AUTO_MS = 5000;

type Ad = {
	id: string;
	image: number;
	eyebrow: string;
	title: string;
};

// Placeholder de publicidade — trocar o require() por banners reais.
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
	const listRef = useRef<FlatList<Ad>>(null);
	const [index, setIndex] = useState(0);

	useEffect(() => {
		let timer: ReturnType<typeof setInterval> | null = null;
		let cancelled = false;
		AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
			if (reduced || cancelled) return;
			timer = setInterval(() => {
				setIndex((i) => {
					const next = (i + 1) % ADS.length;
					listRef.current?.scrollToOffset({
						offset: next * (CARD_W + GAP),
						animated: true,
					});
					return next;
				});
			}, AUTO_MS);
		});
		return () => {
			cancelled = true;
			if (timer) clearInterval(timer);
		};
	}, []);

	const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
		const i = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + GAP));
		setIndex(Math.max(0, Math.min(ADS.length - 1, i)));
	};

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
			<FlatList
				ref={listRef}
				data={ADS}
				horizontal
				pagingEnabled={false}
				snapToInterval={CARD_W + GAP}
				decelerationRate="fast"
				showsHorizontalScrollIndicator={false}
				keyExtractor={(item) => item.id}
				onMomentumScrollEnd={onMomentumEnd}
				contentContainerStyle={{ paddingRight: SCREEN_W - CARD_W }}
				renderItem={({ item }) => (
					<View
						style={{ width: CARD_W, marginRight: GAP }}
						className="rounded-2xl overflow-hidden border"
					>
						<ImageBackground
							source={item.image}
							resizeMode="cover"
							className="justify-end"
							style={{ height: 170 }}
						>
							<View className="px-4 pb-4 pt-10">
								<View
									className="self-start rounded-full px-2 py-0.5 mb-1.5"
									style={{
										backgroundColor: themeColors.primary,
									}}
								>
									<Text
										className="font-mono text-[9px] uppercase tracking-widest"
										style={{ color: themeColors.text }}
									>
										{item.eyebrow}
									</Text>
								</View>
								<Text
									className="font-display text-[17px]"
									style={{
										color: themeColors.background,
										textShadowColor: 'rgba(0,0,0,0.55)',
										textShadowOffset: {
											width: 0,
											height: 1,
										},
										textShadowRadius: 6,
									}}
								>
									{item.title}
								</Text>
							</View>
						</ImageBackground>
					</View>
				)}
			/>
		</View>
	);
}
