import React, { ReactNode } from 'react';
import {
	Image,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	Text,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useThemeColors } from '../hooks/useThemeColors';

// Envelope de autenticação — header centrado animado (logo + eyebrow + título
// + subtítulo), cartão-ticket e rodapé. Fusão da identidade Boleia com o
// ritmo de entrada do FDA.
export default function AuthShell({
	eyebrow,
	title,
	subtitle,
	back,
	children,
	footer,
}: {
	eyebrow: string;
	title: string;
	subtitle?: ReactNode;
	back?: () => void;
	children: ReactNode;
	footer?: ReactNode;
}) {
	const { themeColors } = useThemeColors();

	return (
		<SafeAreaView
			className="flex-1"
			style={{ backgroundColor: themeColors.background }}
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				className="flex-1"
			>
				<ScrollView
					className="flex-1 px-5"
					contentContainerStyle={{ flexGrow: 1, paddingVertical: 32 }}
					keyboardShouldPersistTaps="handled"
				>
					<View className="w-full max-w-md self-center flex-1 justify-center">
						{back ? (
							<Pressable
								onPress={back}
								className="mb-4 self-start"
							>
								<Text
									className="font-sansBold text-[13px] uppercase tracking-wider"
									style={{ color: themeColors.laterite }}
								>
									← Voltar
								</Text>
							</Pressable>
						) : null}
						<Animated.View
							entering={FadeInDown.duration(800).delay(200)}
							className="items-center"
						>
							<Image
								source={require('../../assets/images/logo.png')}
								className="w-20 h-20 rounded-3xl mb-4"
								resizeMode="contain"
							/>
							<Text
								className="font-mono text-[11px] uppercase tracking-[3px]"
								style={{ color: themeColors.laterite }}
							>
								{eyebrow}
							</Text>
							<Text
								className="font-display text-[30px] uppercase tracking-tight text-center mt-3"
								style={{ color: themeColors.text }}
							>
								{title}
							</Text>
							{subtitle ? (
								<Text
									className="font-sans text-[14px] mt-2 leading-5 text-center"
									style={{ color: themeColors.secondary }}
								>
									{subtitle}
								</Text>
							) : null}
						</Animated.View>
						<Animated.View
							entering={FadeInUp.duration(800).delay(400)}
							className="mt-7 rounded-3xl border px-5 py-6"
							style={{
								borderColor: themeColors.border,
								backgroundColor: themeColors.card,
							}}
						>
							{children}
						</Animated.View>
						{footer ? (
							<Animated.View
								entering={FadeInUp.duration(800).delay(650)}
								className="mt-6"
							>
								{footer}
							</Animated.View>
						) : null}
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
