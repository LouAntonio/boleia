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
import { registerUser, normalizePhone } from '../../mock/repos/authRepo';
import { maskPhone } from '../../utils/phone';

export default function RegisterScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaAuthStackParamList, 'Register'>
		>();
	const { themeColors } = useThemeColors();
	const [phone, setPhone] = useState('');
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	const passwordOk = password.length >= 6;
	const canSubmit =
		normalizePhone(phone).length >= 9 &&
		passwordOk &&
		confirm.length > 0 &&
		password === confirm;

	const submit = () => {
		if (!canSubmit) return;
		setPending(true);
		// latência simulada
		setTimeout(() => {
			const res = registerUser(phone, password);
			setPending(false);
			if (!res.ok) {
				setError(
					'Já existe uma conta com este número. Entra com a tua senha.',
				);
				return;
			}
			navigation.navigate('ProfileSetup', { phone: res.user.phone });
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
						Boleia · Angola
					</Text>
					<Text
						className="font-display text-[30px] mt-3"
						style={{ color: themeColors.text }}
					>
						Cria a tua conta
					</Text>
					<Text
						className="font-sans text-[14px] mt-2 leading-5"
						style={{ color: themeColors.secondary }}
					>
						O mesmo perfil serve para viajares como passageiro ou
						montares a tua boleia como motorista.
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
							placeholder="Mínimo de 6 caracteres"
							leftIcon="lock-closed-outline"
							autoCapitalize="none"
						/>
						<Input
							label="Confirmar senha"
							value={confirm}
							onChangeText={(t) => {
								setConfirm(t);
								setError(null);
							}}
							isPassword
							placeholder="Repete a senha"
							leftIcon="lock-closed-outline"
							autoCapitalize="none"
							onSubmitEditing={submit}
							returnKeyType="go"
							error={
								confirm.length > 0 && confirm !== password
									? 'As senhas não coincidem.'
									: undefined
							}
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
							title="Criar conta"
							onPress={submit}
							loading={pending}
							disabled={!canSubmit}
						/>
					</View>

					<View className="flex-row justify-center mt-auto pt-10">
						<Text
							className="font-sans text-[13px]"
							style={{ color: themeColors.secondary }}
						>
							Já tens conta?{' '}
						</Text>
						<Pressable onPress={() => navigation.goBack()}>
							<Text
								className="font-sansBold text-[13px]"
								style={{ color: themeColors.laterite }}
							>
								Entrar
							</Text>
						</Pressable>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
