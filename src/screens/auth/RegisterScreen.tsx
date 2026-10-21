import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { BoleiaAuthStackParamList } from '../../types/navigation';
import AuthShell from '../../components/AuthShell';
import BoleiaButton from '../../components/BoleiaButton';
import GroupLabel from '../../components/GroupLabel';

import ConsentRow from '../../components/ConsentRow';
import Input from '../../components/Input';
import { apiErrorMessage } from '../../lib/api';
import { signUp } from '../../lib/phone-auth';
import { showOtpToast } from '../../lib/toast';
import { maskPhone, normalizePhone } from '../../utils/phone';

export default function RegisterScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaAuthStackParamList, 'Register'>
		>();
	const { themeColors } = useThemeColors();
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [terms, setTerms] = useState(false);
	const [privacy, setPrivacy] = useState(false);
	const [news, setNews] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	const passwordOk = password.length >= 8;
	const canSubmit =
		firstName.trim().length > 0 &&
		lastName.trim().length > 0 &&
		normalizePhone(phone).length >= 9 &&
		passwordOk &&
		confirm.length > 0 &&
		password === confirm &&
		terms &&
		privacy;

	const submit = async () => {
		if (!canSubmit) return;
		const normalized = normalizePhone(phone);
		setPending(true);
		setError(null);
		try {
			const result = await signUp({
				phone: normalized,
				password,
				name: firstName.trim(),
				surname: lastName.trim(),
				email: email.trim() || undefined,
				termsAccepted: terms && privacy,
				marketingAccepted: news,
			});
			// Cópia temporária do OTP enquanto o WAME não entrega a mensagem.
			showOtpToast(result.otp);
			// O registo não abre sessão: primeiro confirma-se o telefone
			// com o código enviado por WhatsApp.
			navigation.navigate('OtpVerify', {
				phone: normalized,
				purpose: 'signup',
			});
		} catch (e) {
			setError(
				apiErrorMessage(
					e,
					'Não foi possível criar a conta. Tenta de novo.',
				),
			);
		} finally {
			setPending(false);
		}
	};

	return (
		<AuthShell
			contextLabel="Cadastro · Boleia"
			title="Cria a tua conta"
			subtitle="O mesmo perfil serve para viajares como passageiro ou montares a tua boleia como motorista."
			back={() => navigation.goBack()}
			footer={
				<View className="flex-row justify-center">
					<Text
						className="font-sans text-body-small"
						style={{ color: themeColors.secondary }}
					>
						Já tens conta?{' '}
					</Text>
					<Pressable onPress={() => navigation.goBack()}>
						<Text
							className="font-sansBold text-body-small"
							style={{ color: themeColors.primary }}
						>
							Entrar
						</Text>
					</Pressable>
				</View>
			}
		>
			<View className="mb-4">
				<GroupLabel>1 · Os teus dados</GroupLabel>
			</View>
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
						leftIcon="person-outline"
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
						leftIcon="person-outline"
						autoCapitalize="words"
					/>
				</View>
			</View>
			<View className="mb-4 mt-5">
				<GroupLabel>2 · Contacto</GroupLabel>
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
				leftIcon="call-outline"
				maxLength={11}
			/>
			<Input
				label="Email (opcional)"
				value={email}
				onChangeText={(t) => {
					setEmail(t);
					setError(null);
				}}
				keyboardType="email-address"
				placeholder="O teu email (opcional)"
				leftIcon="mail-outline"
				autoCapitalize="none"
			/>
			<View className="mb-4 mt-5">
				<GroupLabel>3 · Segurança</GroupLabel>
			</View>
			<Input
				label="Senha"
				value={password}
				onChangeText={(t) => {
					setPassword(t);
					setError(null);
				}}
				isPassword
				placeholder="Mínimo de 8 caracteres"
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
			{error ? (
				<Text
					className="font-sans text-body-small mb-5"
					style={{ color: themeColors.error }}
				>
					{error}
				</Text>
			) : null}
			<View className="mb-3 mt-6">
				<GroupLabel>4 · Termos e privacidade</GroupLabel>
			</View>
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
				label="Quero receber novidades por WhatsApp"
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
					strong
				/>
			</View>
		</AuthShell>
	);
}
