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
import { login, normalizePhone } from '../../mock/repos/authRepo';
import { useAppStore } from '../../store/appStore';
import { navigationRef } from '../../lib/navigationRef';
import { maskPhone } from '../../utils/phone';

const DEMO_PHONE = '923456789';
const DEMO_PASSWORD = '123456';

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

	const canSubmit = normalizePhone(phone).length >= 9 && password.length >= 6;

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
				useAppStore.getState().signIn();
				navigationRef.reset({
					index: 0,
					routes: [{ name: 'App', params: { screen: 'Main' } }],
				});
			}
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
					<Text
						className="font-mono text-[11px] uppercase tracking-[3px]"
						style={{ color: themeColors.laterite }}
					>
						Boleia · Angola
					</Text>
					<Text
						className="font-display text-[30px] mt-3"
						style={{ color: themeColors.text }}
					>
						Entra com o teu número
					</Text>
					<Text
						className="font-sans text-[14px] mt-2 leading-5"
						style={{ color: themeColors.secondary }}
					>
						Tel e senha. Se te esqueceres da senha, recuperas com um
						código por SMS.
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
							title="Entrar"
							onPress={submit}
							loading={pending}
							disabled={!canSubmit}
						/>
					</View>

					<Pressable
						onPress={() => navigation.navigate('ForgotPassword')}
						className="items-center py-3"
					>
						<Text
							className="font-sansBold text-[13px]"
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

					<View className="flex-row justify-center mt-auto pt-10">
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
								className="font-sansBold text-[13px]"
								style={{ color: themeColors.laterite }}
							>
								Criar conta
							</Text>
						</Pressable>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
