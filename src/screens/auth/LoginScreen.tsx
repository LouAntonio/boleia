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
import { authClient, sessionUserFrom } from '../../lib/auth-client';
import { navigationRef } from '../../lib/navigationRef';
import { maskPhone, normalizePhone } from '../../utils/phone';

export default function LoginScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaAuthStackParamList, 'Login'>
		>();
	const { themeColors } = useThemeColors();
	/*
	 * Dois modos de entrada: número com senha, email com link mágico.
	 * Separados em dois painéis, não num formulário único — um email e um
	 * número no mesmo ecrã confundiriam quem só quer entrar de uma das duas
	 * maneiras, e cada modo tem o seu próprio estado e os seus erros.
	 */
	const [mode, setMode] = useState<'phone' | 'email'>('phone');

	return (
		<AuthShell
			title={
				mode === 'phone'
					? 'Entra com o teu número'
					: 'Entra com o teu email'
			}
			subtitle={
				mode === 'phone'
					? 'Tel e senha. Se te esqueceres da senha, recuperas com um código por WhatsApp.'
					: 'Nós mandamos um link por email. Abrir é entrar — sem senha nenhuma.'
			}
			footer={
				<View>
					{mode === 'phone' ? (
						<Pressable
							onPress={() =>
								navigation.navigate('ForgotPassword')
							}
							className="items-center py-2"
						>
							<Text
								className="font-sansBold text-body-small"
								style={{ color: themeColors.primary }}
							>
								Esqueci-me da senha
							</Text>
						</Pressable>
					) : null}
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
			{mode === 'phone' ? (
				<PhonePanel onEmail={() => setMode('email')} />
			) : (
				<EmailPanel onPhone={() => setMode('phone')} />
			)}
		</AuthShell>
	);
}

/**
 * Número e senha — a entrada de sempre.
 *
 * O atalho para o email fica abaixo do botão principal, e não acima dos
 * campos: quem entra como sempre não deve ver um caminho novo à frente do
 * que já conhece.
 */
function PhonePanel({ onEmail }: { onEmail: () => void }) {
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
		<>
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
			<Pressable
				onPress={onEmail}
				className="items-center pt-2"
				accessibilityRole="button"
				accessibilityLabel="Entrar por email, com link mágico"
			>
				<Text
					className="font-sansBold text-body-small p-2"
					style={{ color: themeColors.primary }}
				>
					Entrar por email
				</Text>
			</Pressable>
		</>
	);
}

/**
 * Email e link mágico.
 *
 * **Sem senha mesmo.** O email é provado pelo link que o servidor manda e
 * que fecha o circuito por deep link (`boleia://`): o `expoClient` não faz
 * o fetch da página no browser, o servidor anexa a sessão ao redirect e o
 * `useMagicLinkResume` (montado no `RootNavigator`) recolhe o cookie e abre
 * a app em cima. Ao clicar "Entrar por email" no telemóvel a sessão nasce
 * sem o utilizador passar por campo nenhum de senha.
 *
 * Depois do envio não há spinner nem navegação: o painel troca para "o link
 * está na caixa de entrada", que é a instrução certa agora. Reenviar é um
 * clique — e cada envio invalida o anterior, o que faz da forma velha uma
 * confusão, não um risco.
 */
function EmailPanel({ onPhone }: { onPhone: () => void }) {
	const { themeColors } = useThemeColors();
	const [email, setEmail] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);
	const [sentTo, setSentTo] = useState<string | null>(null);

	const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	const send = async () => {
		const value = email.trim();
		if (!EMAIL_RE.test(value)) {
			setError('Escreve um email válido.');
			return;
		}
		setPending(true);
		setError(null);
		try {
			const { error: err } = await authClient.signIn.magicLink({
				email: value,
				// Caminho relativo: é o `expoClient` que o converte em deep
				// link (`Linking.createURL`) antes de o servidor o ver.
				callbackURL: '/explorar',
			});
			if (err) throw err;
			setSentTo(value);
		} catch (e) {
			setError(
				authErrorMessage(
					e,
					'Não conseguimos mandar o link. Tenta de novo.',
				),
			);
		} finally {
			setPending(false);
		}
	};

	if (sentTo !== null) {
		return (
			<>
				<View className="rounded-xl p-4 mb-5">
					<Text
						className="font-sans text-body leading-6"
						style={{ color: themeColors.text }}
					>
						Enviámos o link para{' '}
						<Text className="font-sansBold">{sentTo}</Text>. Abre-o
						nesse aparelho para entrares — expira em 5 minutos, e
						uma vez usado serve para nada.
					</Text>
				</View>
				<BoleiaButton
					title="Entrar com o número"
					variant="outline"
					onPress={onPhone}
				/>
			</>
		);
	}

	return (
		<>
			<Input
				label="Email"
				value={email}
				onChangeText={(t) => {
					setEmail(t);
					setError(null);
				}}
				keyboardType="email-address"
				autoCapitalize="none"
				autoComplete="email"
				placeholder="o.teu@email.ao"
				leftIcon="mail-outline"
				onSubmitEditing={send}
				returnKeyType="go"
				editable={!pending}
			/>
			<Text
				className="font-sans text-body-xs mb-5 leading-5"
				style={{ color: themeColors.secondary }}
			>
				Só usamos o email para o link de entrada e para avisos que
				ninguém deve perder.
			</Text>
			{error ? (
				<Text
					className="font-sans text-body-small mb-5"
					style={{ color: themeColors.error }}
				>
					{error}
				</Text>
			) : null}
			<BoleiaButton
				title={pending ? 'A mandar o link…' : 'Mandar link mágico'}
				onPress={send}
				loading={pending}
				disabled={pending || !email.trim()}
				strong
			/>
			<Pressable
				onPress={onPhone}
				className="items-center pt-2"
				accessibilityRole="button"
				accessibilityLabel="Entrar com o número de telefone"
			>
				<Text
					className="font-sansBold text-body-small p-2"
					style={{ color: themeColors.primary }}
				>
					Entrar com o número
				</Text>
			</Pressable>
		</>
	);
}

/** Mensagem de erro de uma resposta do `authClient`, com queda para o título. */
function authErrorMessage(error: unknown, fallback: string): string {
	const message =
		(error as { message?: string } | null | undefined)?.message ?? '';
	return message.length > 0 ? message : fallback;
}
