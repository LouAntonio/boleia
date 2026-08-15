import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { BoleiaAuthStackParamList } from '../../types/navigation';
import AuthShell from '../../components/AuthShell';
import BoleiaButton from '../../components/BoleiaButton';
import Input from '../../components/Input';
import Perforation from '../../components/Perforation';
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
		<AuthShell
			eyebrow="Recuperação de senha"
			title="Esqueceu-se da senha?"
			subtitle="Diz-nos o teu número. Vais receber um código por SMS para criares uma senha nova."
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
				maxLength={11}
			/>
			{error ? (
				<Text
					className="font-sans text-[13px] mb-5"
					style={{ color: themeColors.error }}
				>
					{error}
				</Text>
			) : null}
			<Perforation />
			<View className="mt-1">
				<BoleiaButton
					title="Enviar código"
					onPress={submit}
					loading={pending}
					disabled={!canSubmit}
				/>
			</View>
		</AuthShell>
	);
}
