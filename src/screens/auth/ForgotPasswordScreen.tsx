import React, { useState } from 'react';
import {
	View,
	Text,
	Pressable,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { BoleiaAuthStackParamList } from '../../types/navigation';
import BoleiaButton from '../../components/BoleiaButton';
import Input from '../../components/Input';
import {
	requestOtp,
	findByPhone,
	normalizePhone,
} from '../../mock/repos/authRepo';
import { maskPhone } from '../../utils/phone';

export default function ForgotPasswordScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<
				BoleiaAuthStackParamList,
				'ForgotPassword'
			>
		>();
	const { themeColors } = useThemeColors();
	const [phone, setPhone] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	const canSubmit = normalizePhone(phone).length >= 9;

	const submit = () => {
		if (!canSubmit) return;
		const normalized = normalizePhone(phone);
		if (!findByPhone(normalized)) {
			setError(
				'Nenhuma conta com este número. Verifica e tenta de novo.',
			);
			return;
		}
		setPending(true);
		// latência simulada
		setTimeout(() => {
			requestOtp(phone);
			setPending(false);
			navigation.navigate('OtpVerify', { phone: normalized });
		}, 400);
	};

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
					className="flex-1 px-6 pt-14"
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
					keyboardShouldPersistTaps="handled"
				>
					<Pressable
						onPress={() => navigation.goBack()}
						className="mb-4"
					>
						<Text
							className="font-sansBold text-[13px]"
							style={{ color: themeColors.laterite }}
						>
							← Voltar
						</Text>
					</Pressable>

					<Text
						className="font-mono text-[11px] uppercase tracking-[3px]"
						style={{ color: themeColors.laterite }}
					>
						Recuperação de senha
					</Text>
					<Text
						className="font-display text-[30px] mt-3"
						style={{ color: themeColors.text }}
					>
						Esqueceu-se da senha?
					</Text>
					<Text
						className="font-sans text-[14px] mt-2 leading-5"
						style={{ color: themeColors.secondary }}
					>
						Diz-nos o teu número. Vais receber um código por SMS
						para criares uma senha nova.
					</Text>

					<View className="mt-8">
						<Input
							label="Número de telefone"
							value={phone}
							onChangeText={(t) => {
								setPhone(maskPhone(t));
								setError(null);
							}}
							keyboardType="phone-pad"
							placeholder="9XX XXX XXX"
							leftIcon="call-outline"
							maxLength={11}
						/>
					</View>

					{error ? (
						<Text
							className="font-sans text-[13px]"
							style={{ color: themeColors.error }}
						>
							{error}
						</Text>
					) : null}

					<View className="mt-6">
						<BoleiaButton
							title="Enviar código"
							onPress={submit}
							loading={pending}
							disabled={!canSubmit}
						/>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
