import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaAuthStackParamList } from '../../types/navigation';
import AuthShell from '../../components/AuthShell';
import BoleiaButton from '../../components/BoleiaButton';
import Input from '../../components/Input';
import Perforation from '../../components/Perforation';
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

	const passwordOk = password.length >= 5;
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
		<AuthShell
			eyebrow="Recuperação de senha"
			title="Senha nova"
			subtitle="Escolhe uma senha com pelo menos 5 caracteres. Vais usá-la para entrar a partir de agora."
			back={() => navigation.goBack()}
		>
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
					title="Guardar senha"
					onPress={submit}
					loading={pending}
					disabled={!canSubmit}
					strong
				/>
			</View>
		</AuthShell>
	);
}
