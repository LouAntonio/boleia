import React, { ReactNode } from 'react';
import {
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	Text,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../hooks/useThemeColors';

// Envelope de autenticação — coluna centralizada com eyebrow mono, título
// display e cartão-ticket. Os ecrãs fornecem só o conteúdo e o rodapé.
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
								className="mb-5 self-start"
							>
								<Text
									className="font-sansBold text-[13px]"
									style={{ color: themeColors.laterite }}
								>
									← Voltar
								</Text>
							</Pressable>
						) : null}
						<Text
							className="font-mono text-[11px] uppercase tracking-[3px]"
							style={{ color: themeColors.laterite }}
						>
							{eyebrow}
						</Text>
						<Text
							className="font-display text-[28px] leading-9 mt-3"
							style={{ color: themeColors.text }}
						>
							{title}
						</Text>
						{subtitle ? (
							<Text
								className="font-sans text-[14px] mt-2 leading-5"
								style={{ color: themeColors.secondary }}
							>
								{subtitle}
							</Text>
						) : null}
						<View
							className="mt-7 rounded-3xl border px-5 py-6"
							style={{
								borderColor: themeColors.border,
								backgroundColor: themeColors.card,
							}}
						>
							{children}
						</View>
						{footer ? <View className="mt-6">{footer}</View> : null}
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
