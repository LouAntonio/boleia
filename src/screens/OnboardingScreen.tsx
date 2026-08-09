import React, { useState, useRef } from 'react';
import {
	View,
	Text,
	Dimensions,
	TouchableOpacity,
	StyleSheet,
	Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	useAnimatedScrollHandler,
	interpolate,
	Extrapolation,
	SharedValue,
	FadeInDown,
	FadeInUp,
} from 'react-native-reanimated';
import { useThemeColors } from '../hooks/useThemeColors';
import { colors } from '../store/colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

const { width, height } = Dimensions.get('window');

const SLIDES = [
	{
		id: '1',
		title: 'Moto Táxi Rápido',
		description:
			'Chegue ao seu destino de forma rápida e segura com os nossos motoristas parceiros em Angola.',
		image: require('../../assets/images/onboarding_1.png'),
	},
	{
		id: '2',
		title: 'Pedidos Simples',
		description:
			'Faça encomendas ou peça para buscar produtos com apenas alguns cliques no app.',
		image: require('../../assets/images/onboarding_2.png'),
	},
	{
		id: '3',
		title: 'Segurança em 1º Lugar',
		description:
			'Motoristas verificados e acompanhamento da viagem em tempo real para sua proteção.',
		image: require('../../assets/images/onboarding_3.png'),
	},
];

const Dot = ({
	index,
	scrollX,
	themeColors,
}: {
	index: number;
	scrollX: SharedValue<number>;
	themeColors: any;
}) => {
	const animatedDotStyle = useAnimatedStyle(() => {
		const inputRange = [
			(index - 1) * width,
			index * width,
			(index + 1) * width,
		];

		const dotWidth = interpolate(
			scrollX.value,
			inputRange,
			[8, 22, 8],
			Extrapolation.CLAMP,
		);

		const opacity = interpolate(
			scrollX.value,
			inputRange,
			[0.3, 1, 0.3],
			Extrapolation.CLAMP,
		);

		return {
			width: dotWidth,
			opacity,
			backgroundColor:
				opacity > 0.7 ? themeColors.primary : themeColors.border,
		};
	});

	return <Animated.View style={[animatedDotStyle, styles.dot]} />;
};

export default function OnboardingScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<RootStackParamList, 'Onboarding'>
		>();
	const [currentIndex, setCurrentIndex] = useState(0);
	const flatListRef = useRef<Animated.FlatList<any>>(null);
	const scrollX = useSharedValue(0);

	const { themeColors, isDark } = useThemeColors();

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			scrollX.value = event.contentOffset.x;
		},
	});

	const handleNext = () => {
		if (currentIndex < SLIDES.length - 1) {
			flatListRef.current?.scrollToIndex({
				index: currentIndex + 1,
				animated: true,
			});
		} else {
			navigation.replace('Auth', { screen: 'Login' });
		}
	};

	return (
		<SafeAreaView
			className="flex-1"
			style={{ backgroundColor: themeColors.background }}
		>
			{/* Skip Button */}
			<TouchableOpacity
				className="absolute top-14 right-6 z-10 px-4 py-2"
				onPress={() => navigation.replace('Auth', { screen: 'Login' })}
				activeOpacity={0.7}
			>
				<Text
					className="text-sm font-black uppercase tracking-widest"
					style={{ color: themeColors.primary }}
				>
					Pular
				</Text>
			</TouchableOpacity>

			<Animated.FlatList
				ref={flatListRef}
				data={SLIDES}
				horizontal
				pagingEnabled
				onScroll={scrollHandler}
				scrollEventThrottle={16}
				bounces={false}
				showsHorizontalScrollIndicator={false}
				onMomentumScrollEnd={(e) => {
					const index = Math.round(
						e.nativeEvent.contentOffset.x / width,
					);
					setCurrentIndex(index);
				}}
				keyExtractor={(item) => item.id}
				renderItem={({ item, index: _index }) => (
					<View style={{ width }} className="flex-1 px-10 pt-16">
						<Animated.View
							entering={FadeInUp.duration(800).delay(200)}
							className="items-center justify-center mb-12"
							style={{ height: height * 0.4 }}
						>
							<Image
								source={item.image}
								style={styles.illustration}
								resizeMode="contain"
							/>
						</Animated.View>

						<View className="items-center">
							<View className="items-center mb-6">
								<Animated.Text
									entering={FadeInDown.duration(600).delay(
										400,
									)}
									className="text-[25px] font-black tracking-tighter text-center"
									// eslint-disable-next-line react-native/no-inline-styles
									style={{
										color: themeColors.text,
										lineHeight: 42,
									}}
								>
									{item.title}
								</Animated.Text>
								<Animated.View
									entering={FadeInDown.duration(600).delay(
										500,
									)}
									className="h-1.5 w-14 rounded-full mt-2"
									style={{
										backgroundColor: themeColors.primary,
									}}
								/>
							</View>
							<Animated.Text
								entering={FadeInDown.duration(600).delay(700)}
								className="text-[15px] font-medium text-center leading-relaxed"
								// eslint-disable-next-line react-native/no-inline-styles
								style={{
									color: isDark ? '#A1A1AA' : '#64748B',
									paddingHorizontal: 20,
									letterSpacing: 0.2,
								}}
							>
								{item.description}
							</Animated.Text>
						</View>
					</View>
				)}
			/>

			{/* Footer */}
			<View className="px-8 pb-12 pt-4">
				<View className="flex-row justify-between items-center">
					<View className="flex-row items-center">
						{SLIDES.map((_, i) => (
							<Dot
								key={i}
								index={i}
								scrollX={scrollX}
								themeColors={themeColors}
							/>
						))}
					</View>

					<TouchableOpacity
						className="w-16 h-16 rounded-full items-center justify-center elevation-5 shadow-lg"
						// eslint-disable-next-line react-native/no-inline-styles
						style={{
							backgroundColor: themeColors.primary,
							shadowColor: themeColors.primary,
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: 0.3,
							shadowRadius: 8,
						}}
						onPress={handleNext}
						activeOpacity={0.8}
					>
						<Text
							className="text-2xl font-black"
							style={{ color: colors.light.text }}
						>
							{currentIndex === SLIDES.length - 1 ? '✓' : '→'}
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	dot: {
		height: 8,
		borderRadius: 4,
		marginHorizontal: 4,
	},
	illustration: {
		width: width * 0.8,
		height: width * 0.8,
	},
});
