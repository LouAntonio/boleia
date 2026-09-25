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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { BoleiaRootStackParamList } from '../types/navigation';
import { useAppStore } from '../store/appStore';

const { width, height } = Dimensions.get('window');

const SLIDES = [
	{
		id: '1',
		title: 'Viaja entre províncias a preço de boleia',
		description:
			'Partilha o lugar vazio na tua viatura ou encontra um motorista de confiança para a tua rota, a partir de Luanda.',
		image: {
			uri: 'https://images.unsplash.com/photo-1687917154293-69aa5d85fa42?auto=format&fit=crop&w=900&q=80',
		},
	},
	{
		id: '2',
		title: 'Paragens combinadas, pedidos claros',
		description:
			'Escolhe o embarque e o desembarque. O motorista confirma a tua reserva e avisas se os planos mudam.',
		image: {
			uri: 'https://images.unsplash.com/photo-1711252675781-22845d855e08?auto=format&fit=crop&w=900&q=80',
		},
	},
	{
		id: '3',
		title: 'Motoristas verificados',
		description:
			'Bilhete de Identidade verificado, viatura registada e avaliações bilaterais. Viajas com quem cumpre.',
		image: {
			uri: 'https://images.unsplash.com/photo-1706733788801-f71266d4ec71?auto=format&fit=crop&w=900&q=80',
		},
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
		return {
			width: dotWidth,
			backgroundColor:
				dotWidth > 12 ? themeColors.primary : themeColors.border,
		};
	});

	return <Animated.View style={[animatedDotStyle, styles.dot]} />;
};

export default function OnboardingScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaRootStackParamList, 'Onboarding'>
		>();
	const [currentIndex, setCurrentIndex] = useState(0);
	const flatListRef = useRef<Animated.FlatList<any>>(null);
	const scrollX = useSharedValue(0);

	const { themeColors } = useThemeColors();

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			scrollX.value = event.contentOffset.x;
		},
	});

	const finish = () => {
		useAppStore.getState().completeOnboarding();
		navigation.replace('Auth', { screen: 'Login' });
	};

	const handleNext = () => {
		if (currentIndex < SLIDES.length - 1) {
			flatListRef.current?.scrollToIndex({
				index: currentIndex + 1,
				animated: true,
			});
		} else {
			finish();
		}
	};

	return (
		<SafeAreaView
			className="flex-1"
			style={{ backgroundColor: themeColors.background }}
		>
			<TouchableOpacity
				className="absolute top-14 right-6 z-10 px-4 py-2"
				onPress={finish}
				activeOpacity={0.7}
			>
				<Text
					className="font-sansBold text-body-small"
					style={{ color: themeColors.laterite }}
				>
					Saltar
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
				renderItem={({ item }) => (
					<View style={{ width }} className="flex-1 px-10 pt-16">
						<Animated.View
							entering={FadeInUp.duration(800).delay(200)}
							className="items-center justify-center mb-12"
							style={{ height: height * 0.4 }}
						>
							<Image
								source={item.image}
								style={styles.illustration}
								resizeMode="cover"
							/>
						</Animated.View>

						<View className="items-center">
							<Animated.Text
								entering={FadeInDown.duration(600).delay(400)}
								className="font-sansExtraBold text-title-primary text-center"
								// eslint-disable-next-line react-native/no-inline-styles
								style={{
									color: themeColors.text,
									lineHeight: 40,
								}}
							>
								{item.title}
							</Animated.Text>
							<Animated.View
								entering={FadeInDown.duration(600).delay(500)}
								className="h-1.5 w-14 rounded-full mt-3"
								style={{
									backgroundColor: themeColors.laterite,
								}}
							/>
							<Animated.Text
								entering={FadeInDown.duration(600).delay(700)}
								className="font-sans text-label-small text-center leading-relaxed"
								// eslint-disable-next-line react-native/no-inline-styles
								style={{
									color: themeColors.secondary,
									paddingHorizontal: 20,
									marginTop: 14,
								}}
							>
								{item.description}
							</Animated.Text>
						</View>
					</View>
				)}
			/>

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
						className="w-[64px] h-[64px] rounded-full items-center justify-center elevation-5 shadow-lg"
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
							className="font-sansExtraBold text-title-secondary"
							// eslint-disable-next-line react-native/no-inline-styles
							style={{ color: themeColors.text }}
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
		borderRadius: 28,
	},
});
