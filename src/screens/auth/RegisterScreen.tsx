import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { BoleiaAuthStackParamList } from '../../types/navigation';
import AuthShell from '../../components/AuthShell';
import BoleiaButton from '../../components/BoleiaButton';
import ConsentRow from '../../components/ConsentRow';
import Input from '../../components/Input';
import Perforation from '../../components/Perforation';
import { registerUser, normalizePhone } from '../../mock/repos/authRepo';
import { useAppStore } from '../../store/appStore';
import { navigationRef } from '../../lib/navigationRef';
import { maskPhone } from '../../utils/phone';

export default function RegisterScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaAuthStackParamList, 'Register'>
		>();
	const { themeColors } = useThemeColors();
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [phone, setPhone] = useState('');
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [terms, setTerms] = useState(false);
	const [privacy, setPrivacy] = useState(false);
	const [news, setNews] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	const passwordOk = password.length >= 6;
	const canSubmit =
		firstName.trim().length > 0 &&
		lastName.trim().length > 0 &&
		normalizePhone(phone).length >= 9 &&
		passwordOk &&
		confirm.length > 0 &&
		password === confirm &&
		terms &&
		privacy;

	const submit = () => {
		if (!canSubmit) return;
		setPending(true);
		// latência simulada
		setTimeout(() => {
			const res = registerUser(phone, password, { firstName, lastName });
			setPending(false);
			if (!res.ok) {
				setError(
					'Já existe uma conta com este número. Entra com a tua senha.',
				);
				return;
			}
			useAppStore.getState().signIn();
			navigationRef.reset({
				index: 0,
				routes: [{ name: 'App', params: { screen: 'Main' } }],
			});
		}, 400);
	};

	return (
		<AuthShell
			eyebrow="Boleia · Angola"
			title="Cria a tua conta"
			subtitle="O mesmo perfil serve para viajares como passageiro ou montares a tua boleia como motorista."
			back={() => navigation.goBack()}
			footer={
				<View className="flex-row justify-center">
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
			}
		>
			<View className="flex-row">
				<View className="flex-1 mr-2">
					<Input
						label="Primeiro nome"
						value={firstName}
						onChangeText={(t) => {
							setFirstName(t);
							setError(null);
						}}
						placeholder="Ex.: Maria"
						autoCapitalize="words"
					/>
				</View>
				<View className="flex-1 ml-2">
					<Input
						label="Apelido"
						value={lastName}
						onChangeText={(t) => {
							setLastName(t);
							setError(null);
						}}
						placeholder="Ex.: Santos"
						autoCapitalize="words"
					/>
				</View>
			</View>
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
			<Input
				label="Senha"
				value={password}
				onChangeText={(t) => {
					setPassword(t);
					setError(null);
				}}
				isPassword
				placeholder="Mínimo de 6 caracteres"
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
			<Text
				className="font-mono text-[10px] uppercase tracking-[2px] mb-1"
				style={{ color: themeColors.laterite }}
			>
				Termos e privacidade
			</Text>
			<ConsentRow
				label="Aceito os Termos de Serviço"
				checked={terms}
				onChange={() => setTerms(!terms)}
			/>
			<ConsentRow
				label="Aceito a Política de Privacidade"
				checked={privacy}
				onChange={() => setPrivacy(!privacy)}
			/>
			<ConsentRow
				label="Quero receber novidades por SMS"
				checked={news}
				onChange={() => setNews(!news)}
				optional
			/>
			<View className="mt-4">
				<BoleiaButton
					title="Criar conta"
					onPress={submit}
					loading={pending}
					disabled={!canSubmit}
				/>
			</View>
		</AuthShell>
	);
}
