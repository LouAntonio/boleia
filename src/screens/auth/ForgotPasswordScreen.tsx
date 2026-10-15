import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { BoleiaAuthStackParamList } from '../../types/navigation';
import AuthShell from '../../components/AuthShell';
import BoleiaButton from '../../components/BoleiaButton';
import Input from '../../components/Input';
import { apiErrorMessage } from '../../lib/api';
import { sendOtp } from '../../lib/phone-auth';
import { maskPhone, normalizePhone } from '../../utils/phone';

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

	const submit = async () => {
		if (!canSubmit) return;
		const normalized = normalizePhone(phone);
		setPending(true);
		setError(null);
		try {
			await sendOtp(normalized, 'reset');
			navigation.navigate('OtpVerify', {
				phone: normalized,
				purpose: 'reset',
			});
		} catch (e) {
			setError(
				apiErrorMessage(
					e,
					'Não foi possível enviar o código. Tenta de novo.',
				),
			);
		} finally {
			setPending(false);
		}
	};

	return (
		<AuthShell
			contextLabel="Recuperação de senha"
			title="Esqueceu-se da senha?"
			subtitle="Diz-nos o teu número. Vais receber um código por WhatsApp para criares uma senha nova."
			back={() => navigation.goBack()}
		>
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
			{error ? (
				<Text
					className="font-sans text-body-small mb-5"
					style={{ color: themeColors.error }}
				>
					{error}
				</Text>
			) : null}
			<View className="mt-1">
				<BoleiaButton
					title="Enviar código"
					onPress={submit}
					loading={pending}
					disabled={!canSubmit}
					strong
				/>
			</View>
		</AuthShell>
	);
}
