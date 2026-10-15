import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { BoleiaAuthStackParamList } from '../../types/navigation';
import AuthShell from '../../components/AuthShell';
import BoleiaButton from '../../components/BoleiaButton';
import Input from '../../components/Input';
import { apiErrorMessage } from '../../lib/api';
import { signInPhone } from '../../lib/phone-auth';
import { sessionUserFrom } from '../../lib/auth-client';
import { navigationRef } from '../../lib/navigationRef';
import { maskPhone, normalizePhone } from '../../utils/phone';

export default function LoginScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaAuthStackParamList, 'Login'>
		>();
	const { themeColors } = useThemeColors();
	const [phone, setPhone] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	const canSubmit = normalizePhone(phone).length >= 9 && password.length >= 8;

	const submit = async () => {
		if (!canSubmit) return;
		const normalized = normalizePhone(phone);
		setPending(true);
		setError(null);
		try {
			const { user } = await signInPhone(normalized, password);
			const sessionUser = sessionUserFrom(user);
			if (!sessionUser.name) {
				navigation.navigate('ProfileSetup', { userId: sessionUser.id });
				return;
			}
			navigationRef.reset({
				index: 0,
				routes: [{ name: 'App', params: { screen: 'Main' } }],
			});
		} catch (e) {
			/*
			 * 403 é o `phone/sign-in` a dizer que a conta existe e a senha está
			 * certa, mas o telefone continua por verificar. Não é senha errada,
			 * e mandar a pessoa ao ecrã de verificação por causa de uma senha
			 * errada era o que acontecia antes: o backend respondia 403 antes de
			 * comparar a senha.
			 */
			if (
				(e as { response?: { status?: number } })?.response?.status ===
				403
			) {
				setError(
					'O teu número ainda não foi verificado. Confirma o código que enviamos por WhatsApp.',
				);
				navigation.navigate('OtpVerify', {
					phone: normalized,
					purpose: 'signup',
				});
				return;
			}
			setError(
				apiErrorMessage(
					e,
					'Número de telefone ou senha inválidos. Tenta de novo.',
				),
			);
		} finally {
			setPending(false);
		}
	};

	return (
		<AuthShell
			title="Entra com o teu número"
			subtitle="Tel e senha. Se te esqueceres da senha, recuperas com um código por WhatsApp."
			footer={
				<View>
					<Pressable
						onPress={() => navigation.navigate('ForgotPassword')}
						className="items-center py-2"
					>
						<Text
							className="font-sansBold text-body-small"
							style={{ color: themeColors.primary }}
						>
							Esqueci-me da senha
						</Text>
					</Pressable>
					<View className="flex-row justify-center pt-6">
						<Text
							className="font-sans text-body-small"
							style={{ color: themeColors.secondary }}
						>
							Ainda não tens conta?{' '}
						</Text>
						<Pressable
							onPress={() => navigation.navigate('Register')}
						>
							<Text
								className="font-sansBold text-body-small"
								style={{ color: themeColors.primary }}
							>
								Criar conta
							</Text>
						</Pressable>
					</View>
				</View>
			}
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
			<Input
				label="Senha"
				value={password}
				onChangeText={(t) => {
					setPassword(t);
					setError(null);
				}}
				isPassword
				placeholder="A tua senha"
				leftIcon="lock-closed-outline"
				autoCapitalize="none"
				onSubmitEditing={submit}
				returnKeyType="go"
			/>
			{error ? (
				<Text
					className="font-sans text-body-small mb-5"
					style={{ color: themeColors.error }}
				>
					{error}
				</Text>
			) : null}
			<BoleiaButton
				title="Entrar"
				onPress={submit}
				loading={pending}
				disabled={!canSubmit}
				strong
			/>
		</AuthShell>
	);
}
