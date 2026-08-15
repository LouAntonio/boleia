import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { BoleiaAuthStackParamList } from '../../types/navigation';
import AuthShell from '../../components/AuthShell';
import BoleiaButton from '../../components/BoleiaButton';
import Input from '../../components/Input';
import Perforation from '../../components/Perforation';
import { login, normalizePhone } from '../../mock/repos/authRepo';
import { useAppStore } from '../../store/appStore';
import { navigationRef } from '../../lib/navigationRef';
import { maskPhone } from '../../utils/phone';

const DEMO_PHONE = '930673691';
const DEMO_PASSWORD = 'senha';

export default function LoginScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaAuthStackParamList, 'Login'>
		>();
	const { themeColors } = useThemeColors();
	const [phone, setPhone] = useState(maskPhone(DEMO_PHONE));
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	const canSubmit = normalizePhone(phone).length >= 9 && password.length >= 5;

	const submit = () => {
		if (!canSubmit) return;
		setPending(true);
		// latência simulada
		setTimeout(() => {
			const res = login(phone, password);
			setPending(false);
			if (!res.ok) {
				setError(
					res.error === 'inexistente'
						? 'Nenhuma conta com este número. Cria uma conta.'
						: 'Senha errada. Tenta de novo.',
				);
				return;
			}
			if (!res.user.firstName) {
				navigation.navigate('ProfileSetup', { phone: res.user.phone });
			} else {
				useAppStore.getState().signIn(res.user.id);
				navigationRef.reset({
					index: 0,
					routes: [{ name: 'App', params: { screen: 'Main' } }],
				});
			}
		}, 400);
	};

	return (
		<AuthShell
			eyebrow="Boleia"
			title="Entra com o teu número"
			subtitle="Tel e senha. Se te esqueceres da senha, recuperas com um código por SMS."
			footer={
				<View>
					<Pressable
						onPress={() => navigation.navigate('ForgotPassword')}
						className="items-center py-2"
					>
						<Text
							className="font-sansBold text-[13px] uppercase tracking-wider"
							style={{ color: themeColors.laterite }}
						>
							Esqueci-me da senha
						</Text>
					</Pressable>
					<View
						className="rounded-xl border px-4 py-3 mt-4"
						style={{
							borderColor: themeColors.laterite,
							backgroundColor: themeColors.card,
						}}
					>
						<Text
							className="font-mono text-[12px]"
							style={{ color: themeColors.laterite }}
						>
							Demo: {DEMO_PHONE} / {DEMO_PASSWORD}
						</Text>
					</View>
					<View className="flex-row justify-center pt-6">
						<Text
							className="font-sans text-[13px]"
							style={{ color: themeColors.secondary }}
						>
							Ainda não tens conta?{' '}
						</Text>
						<Pressable
							onPress={() => navigation.navigate('Register')}
						>
							<Text
								className="font-sansBold text-[13px] uppercase tracking-wider"
								style={{ color: themeColors.laterite }}
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
					className="font-sans text-[13px] mb-5"
					style={{ color: themeColors.error }}
				>
					{error}
				</Text>
			) : null}
			<Perforation />
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
