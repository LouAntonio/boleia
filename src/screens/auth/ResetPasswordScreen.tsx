import React, { useState } from 'react';
import {
	View,
	Text,
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaAuthStackParamList } from '../../types/navigation';
import BoleiaButton from '../../components/BoleiaButton';
import Input from '../../components/Input';
import { setPassword } from '../../mock/repos/authRepo';

export default function ResetPasswordScreen() {
	const route =
		useRoute<RouteProp<BoleiaAuthStackParamList, 'ResetPassword'>>();
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaAuthStackParamList, 'ResetPassword'>
		>();
	const { themeColors } = useThemeColors();
	const [password, setPasswordValue] = useState('');
	const [confirm, setConfirm] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	const passwordOk = password.length >= 6;
	const canSubmit = passwordOk && confirm.length > 0 && password === confirm;

	const submit = () => {
		if (!canSubmit) return;
		setPending(true);
		// latência simulada
		setTimeout(() => {
			setPassword(route.params.phone, password);
			setPending(false);
			Alert.alert('Senha alterada', 'Entra com a tua nova senha.', [
				{ text: 'OK', onPress: () => navigation.popToTop() },
			]);
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
						Recuperação de senha
					</Text>
					<Text
						className="font-display text-[30px] mt-3"
						style={{ color: themeColors.text }}
					>
						Senha nova
					</Text>
					<Text
						className="font-sans text-[14px] mt-2 leading-5"
						style={{ color: themeColors.secondary }}
					>
						Escolhe uma senha com pelo menos 6 caracteres. Vais
						usá-la para entrar a partir de agora.
					</Text>

					<View className="mt-8">
						<Input
							label="Senha nova"
							value={password}
							onChangeText={(t) => {
								setPasswordValue(t);
								setError(null);
							}}
							isPassword
							placeholder="Mínimo de 6 caracteres"
							leftIcon="lock-closed-outline"
							autoCapitalize="none"
						/>
						<Input
							label="Confirmar senha nova"
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
							title="Guardar senha"
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
