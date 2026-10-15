import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '../../hooks/useThemeColors';
import { useSessionUser, useSessionUserId } from '../../hooks/useSessionUser';
import { authClient } from '../../lib/auth-client';
import {
	SessionRow,
	apiErrorMessage,
	deleteAccount,
	unlinkGoogle,
	updateProfile,
} from '../../lib/api';
import { describeDevice, sessionDate } from '../../lib/device';
import { navigationRef } from '../../lib/navigationRef';
import { useAppStore } from '../../store/appStore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';

import BackButton from '../../components/BackButton';
import BoleiaButton from '../../components/BoleiaButton';
import Card from '../../components/Card';
import Input from '../../components/Input';
import SectionTitle from '../../components/SectionTitle';

/**
 * Conta e segurança.
 *
 * Seis blocos num scroll só, e não seis ecrãs. Um ecrã destes abre-se uma vez
 * de tempos em tempos e percorre-se de cima a baixo; obrigar a traversar seis
 * navegações para encontrar "terminar as outras sessões" faz as pessoas
 * desistirem pelo caminho.
 *
 * **Nada disto precisa de backend novo.** Cada bloco é um endpoint que já
 * existia — `PATCH /api/account/profile`, `POST /api/account/delete`,
 * `POST /api/account/unlink-google`, e os stock do better-auth
 * (`change-email`, `send-verification-email`, `list-sessions`,
 * `revoke-session`, `revoke-other-sessions`, `change-password`,
 * `link-social`).
 */

/** Divisória dentro de um cartão agrupado, a indiciar o membro do grupo. */
function Divider() {
	const { themeColors } = useThemeColors();
	return (
		<View
			style={{ height: 1, backgroundColor: themeColors.border }}
			className="ml-[60px]"
		/>
	);
}

/**
 * Uma linha com o que está e a acção que muda.
 *
 * Sem `onPress` é só informação (o endereço actual). Com `onPress` é um alvo
 * de toque — daí o `min-h-[52px]`: uma linha de texto com uma palavra à
 * direita não pode ser mais alta que o alvo mínimo do sistema.
 */
function SettingRow({
	label,
	value,
	action,
	onPress,
	tone = 'default',
	icon,
}: {
	label: string;
	value?: string;
	action?: string;
	onPress?: () => void;
	tone?: 'default' | 'danger';
	icon?: keyof typeof Ionicons.glyphMap;
}) {
	const { themeColors } = useThemeColors();
	const danger = tone === 'danger';
	const ink = danger ? themeColors.error : themeColors.text;

	const body = (
		<View className="flex-row items-center px-4 py-3.5 min-h-[52px]">
			{icon ? (
				<View
					className="w-9 h-9 rounded-full items-center justify-center"
					style={{
						backgroundColor: danger
							? themeColors.dangerWeak
							: themeColors.accentWeak,
					}}
				>
					<Ionicons
						name={icon}
						size={17}
						color={danger ? themeColors.error : themeColors.primary}
					/>
				</View>
			) : null}
			<Text
				className={`font-sansMedium text-body-small flex-1 ${icon ? 'ml-3' : ''}`}
				style={{ color: ink }}
			>
				{label}
			</Text>
			{value ? (
				<Text
					className="font-sans text-body-small mr-3"
					style={{ color: themeColors.secondary }}
					numberOfLines={1}
				>
					{value}
				</Text>
			) : null}
			{action ? (
				<Text
					className="font-sansBold text-body-small"
					style={{
						color: danger ? themeColors.error : themeColors.primary,
					}}
				>
					{action}
				</Text>
			) : null}
		</View>
	);

	if (!onPress) return body;

	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="button"
			style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
		>
			{body}
		</Pressable>
	);
}

/** Um bloco do ecrã: título, o que a pessoa precisa de saber, e o conteúdo. */
function Block({
	title,
	hint,
	children,
}: {
	title: string;
	/** O que a pessoa precisa de saber antes de mexer. Opcional: alguns blocos falam por si. */
	hint?: string;
	children: React.ReactNode;
}) {
	const { themeColors } = useThemeColors();
	return (
		<View className="mt-6">
			<SectionTitle>{title}</SectionTitle>
			{hint ? (
				<Text
					className="font-sans text-body-small mt-1 mb-4"
					style={{ color: themeColors.secondary }}
				>
					{hint}
				</Text>
			) : (
				<View className="h-4" />
			)}
			{children}
		</View>
	);
}

export default function AccountScreen() {
	const { themeColors } = useThemeColors();
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'Account'>
		>();
	const queryClient = useQueryClient();
	const me = useSessionUser();
	const sessionUserId = useSessionUserId();

	/* Identidade */
	const [name, setName] = useState(me?.name ?? '');
	const [surname, setSurname] = useState(me?.surname ?? '');
	const [savingName, setSavingName] = useState(false);
	const [nameSaved, setNameSaved] = useState(false);

	/* Email */
	const [newEmail, setNewEmail] = useState('');
	const [savingEmail, setSavingEmail] = useState(false);

	/* Senha */
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [savingPassword, setSavingPassword] = useState(false);

	/* Google e eliminação */
	const [googleBusy, setGoogleBusy] = useState(false);
	const [deleting, setDeleting] = useState(false);

	/*
	 * As sessões e as contas ligadas vão pelo `authClient`, não pelo axios.
	 *
	 * São endpoints do próprio better-auth e o `authClient` é quem tem a
	 * sessão — mandá-los pelo `client` do axios obrigaria a ir buscar o cookie
	 * à mão para um ecrã que, no resto, é igual aos outros.
	 */
	const sessionsQuery = useQuery({
		queryKey: ['account', 'sessions', sessionUserId],
		queryFn: async () => {
			const { data } = await authClient.listSessions();
			return (data ?? []) as SessionRow[];
		},
		enabled: !!sessionUserId,
	});
	const accountsQuery = useQuery({
		queryKey: ['account', 'accounts', sessionUserId],
		queryFn: async () => {
			const { data } = await authClient.listAccounts();
			return data ?? [];
		},
		enabled: !!sessionUserId,
	});

	const sessions = sessionsQuery.data ?? [];
	const googleLinked = (accountsQuery.data ?? []).some(
		(a) => a.providerId === 'google',
	);

	const refresh = useCallback(async () => {
		await queryClient.invalidateQueries({ queryKey: ['account'] });
		await authClient.getSession();
	}, [queryClient]);

	/**
	 * O email a sério é o que não vive no domínio sintético.
	 *
	 * Toda a conta de telefone nasce com `<phone>@boleia.ao` porque o better-auth
	 * exige um email e não há outro campo. Esse endereço não recebe correio, logo
	 * está sempre por verificar — e dizer isso é melhor do que mostrar um
	 * "verificado" que não verifica nada.
	 */
	const currentEmail = me?.email ?? '';
	const synthetic = currentEmail.endsWith('@boleia.ao');
	const emailVerified = !synthetic && me?.emailVerified === true;

	async function saveIdentity() {
		if (savingName) return;
		const trimmed = name.trim();
		if (!trimmed) {
			Alert.alert('Nome', 'O nome não pode ficar vazio.');
			return;
		}
		setSavingName(true);
		setNameSaved(false);
		try {
			await updateProfile({ name: trimmed, surname: surname.trim() });
			setNameSaved(true);
			await refresh();
		} catch (error) {
			Alert.alert(
				'Identidade',
				apiErrorMessage(error, 'Não foi possível guardar o teu nome.'),
			);
		} finally {
			setSavingName(false);
		}
	}

	async function changeEmail() {
		if (savingEmail) return;
		const value = newEmail.trim().toLowerCase();
		if (!value.includes('@') || value.endsWith('@boleia.ao')) {
			Alert.alert('Email', 'Escreve um endereço de email a sério.');
			return;
		}
		setSavingEmail(true);
		try {
			const { error } = await authClient.changeEmail({ newEmail: value });
			if (error)
				throw new Error(error.message ?? 'Não foi possível trocar.');
			setNewEmail('');
			await refresh();
			Alert.alert(
				'Email trocado',
				'Enviámos um link para o novo endereço. Ele só passa a valer depois de carregares nesse link.',
			);
		} catch (err) {
			Alert.alert(
				'Email',
				err instanceof Error
					? err.message
					: 'Não foi possível trocar o email.',
			);
		} finally {
			setSavingEmail(false);
		}
	}

	async function resendVerification() {
		try {
			await authClient.sendVerificationEmail({
				email: currentEmail,
				callbackURL: Linking.createURL('/'),
			});
			Alert.alert(
				'Email enviado',
				'Confirma o teu endereço na mensagem.',
			);
		} catch {
			Alert.alert(
				'Email',
				'Não foi possível reenviar. Tenta mais tarde.',
			);
		}
	}

	/**
	 * Ligar o Google é um redirect OAuth, e o `expo-linking` dá o esquema
	 * `boleia://` para o browser devolver à app.
	 *
	 * **Não é o mesmo que o botão "Continuar com Google" do login.** Esse cria
	 * conta nova. Ligar a uma conta de telefone que já existe só é possível
	 * **com sessão activa**, porque o backend tem `disableImplicitLinking:
	 * true` — decisão certa e que não se mexe: sem ela, um atacante criava uma
	 * conta de telefone com o email de outra pessoa e ficava com a conta
	 * quando a vítima carregava no botão do Google.
	 */
	async function linkGoogle() {
		if (googleBusy) return;
		setGoogleBusy(true);
		try {
			await authClient.linkSocial({
				provider: 'google',
				callbackURL: Linking.createURL('/'),
			});
		} catch {
			Alert.alert('Google', 'Não foi possível abrir o login do Google.');
			setGoogleBusy(false);
		}
	}

	function confirmUnlink() {
		Alert.alert(
			'Desvincular o Google',
			'Passas a entrar só com o telefone e a senha. Se te esqueceres da senha, já não há Google para te trazer de volta.',
			[
				{ text: 'Cancelar', style: 'cancel' },
				{
					text: 'Desvincular',
					style: 'destructive',
					onPress: async () => {
						try {
							await unlinkGoogle();
							await refresh();
						} catch (error) {
							Alert.alert(
								'Google',
								apiErrorMessage(
									error,
									'Não foi possível desvincular.',
								),
							);
						}
					},
				},
			],
		);
	}

	async function changePassword() {
		if (savingPassword) return;
		if (!currentPassword) {
			Alert.alert('Palavra-passe', 'Escreve a tua palavra-passe actual.');
			return;
		}
		if (newPassword.length < 8) {
			Alert.alert(
				'Palavra-passe',
				'A nova palavra-passe precisa de pelo menos 8 caracteres.',
			);
			return;
		}
		setSavingPassword(true);
		try {
			await authClient.changePassword({
				currentPassword,
				newPassword,
				revokeOtherSessions: true,
			});
			setCurrentPassword('');
			setNewPassword('');
			Alert.alert(
				'Palavra-passe trocada',
				'As outras sessões foram terminadas, por segurança.',
			);
		} catch (error) {
			Alert.alert(
				'Palavra-passe',
				apiErrorMessage(
					error,
					'Não foi possível trocar a palavra-passe.',
				),
			);
		} finally {
			setSavingPassword(false);
		}
	}

	async function revoke(token: string) {
		try {
			await authClient.revokeSession({ token });
			await refresh();
		} catch {
			Alert.alert('Sessões', 'Não foi possível terminar essa sessão.');
		}
	}

	async function revokeOthers() {
		try {
			await authClient.revokeOtherSessions();
			await refresh();
		} catch {
			Alert.alert('Sessões', 'Não foi possível fazer isso.');
		}
	}

	function confirmDelete() {
		Alert.alert(
			'Eliminar a conta',
			'Perdes as viagens, as reservas e o histórico. Não há como desfazer.',
			[
				{ text: 'Cancelar', style: 'cancel' },
				{
					text: 'Eliminar',
					style: 'destructive',
					onPress: async () => {
						setDeleting(true);
						try {
							await deleteAccount();
							void authClient.signOut().catch(() => {});
							useAppStore.getState().resetAfterLogout();
							queryClient.clear();
							navigationRef.reset({
								index: 0,
								routes: [
									{
										name: 'Auth',
										params: { screen: 'Login' },
									},
								],
							});
						} catch (error) {
							setDeleting(false);
							Alert.alert(
								'Eliminar a conta',
								apiErrorMessage(
									error,
									'Não foi possível eliminar a conta.',
								),
							);
						}
					},
				},
			],
		);
	}

	return (
		<SafeAreaView
			className="flex-1 px-5"
			style={{ backgroundColor: themeColors.background }}
		>
			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingBottom: 40 }}
				keyboardShouldPersistTaps="handled"
			>
				<View className="flex-row items-center pt-1 pb-4">
					<BackButton onPress={() => navigation.goBack()} />
					<Text
						className="font-sansExtraBold text-title-tertiary flex-1 ml-3"
						style={{ color: themeColors.text }}
					>
						Conta e segurança
					</Text>
				</View>

				{/* ---------------- Identidade ---------------- */}
				<Block
					title="Identidade"
					hint="É este o nome que os outros veem quando reservam contigo."
				>
					<Card padded={false} className="p-4">
						<Input
							label="Nome"
							value={name}
							onChangeText={(t) => {
								setName(t);
								setNameSaved(false);
							}}
							placeholder="Ex.: Lourenço"
							autoCapitalize="words"
						/>
						<Input
							label="Apelido"
							value={surname}
							onChangeText={(t) => {
								setSurname(t);
								setNameSaved(false);
							}}
							placeholder="Ex.: António"
							autoCapitalize="words"
							containerStyle={{ marginBottom: 4 }}
						/>
						<BoleiaButton
							title={nameSaved ? 'Guardado' : 'Guardar'}
							onPress={saveIdentity}
							loading={savingName}
							disabled={!name.trim()}
						/>
					</Card>
				</Block>

				{/* ---------------- Email ---------------- */}
				<Block
					title="Email"
					hint={
						synthetic
							? 'A conta de telefone não tem email a sério. Junta um para poderes entrar também por link.'
							: emailVerified
								? 'Email confirmado. Podes usá-lo para entrar.'
								: 'Falta confirmar este endereço.'
					}
				>
					<Card padded={false}>
						<SettingRow
							label="Endereço actual"
							value={currentEmail || '—'}
						/>
						{synthetic ? null : (
							<>
								<Divider />
								<SettingRow
									label="Reenviar email de confirmação"
									action="Enviar"
									onPress={resendVerification}
								/>
							</>
						)}
					</Card>

					<Card padded={false} className="mt-3 p-4">
						<Input
							label="Novo email"
							value={newEmail}
							onChangeText={setNewEmail}
							placeholder="nome@exemplo.ao"
							keyboardType="email-address"
							autoCapitalize="none"
							autoCorrect={false}
							containerStyle={{ marginBottom: 4 }}
						/>
						{/*
						 * O aviso não é decorativo.
						 *
						 * O backend tem `requireEmailVerification: false`, portanto a
						 * troca aplica-se logo e o endereço fica por confirmar até
						 * alguém clicar no link. Dizer isso é melhor do que deixar a
						 * pessoa dias com um email que ainda não é seu — e do que
						 * esconder que o endereço fica reservado nesse intervalo.
						 */}
						<Text
							className="font-sans text-body-xs mb-3"
							style={{ color: themeColors.secondary }}
						>
							O endereço só fica teu quando carregares no link que
							enviamos. Até lá, continua a valer o antigo.
						</Text>
						<BoleiaButton
							title="Trocar email"
							onPress={changeEmail}
							loading={savingEmail}
							disabled={!newEmail.trim()}
						/>
					</Card>
				</Block>

				{/* ---------------- Google ---------------- */}
				<Block
					title="Conta Google"
					hint="Uma segunda porta de entrada. Podes desligá-la sem perder a conta."
				>
					<Card padded={false}>
						<SettingRow
							icon="logo-google"
							label={
								accountsQuery.isPending
									? 'A ver as tuas contas…'
									: googleLinked
										? 'Ligada a esta conta'
										: 'Não está ligada'
							}
							action={
								googleLinked
									? 'Desvincular'
									: googleBusy
										? 'A abrir…'
										: 'Ligar'
							}
							onPress={googleLinked ? confirmUnlink : linkGoogle}
						/>
					</Card>
				</Block>

				{/* ---------------- Sessões ---------------- */}
				<Block
					title="Sessões"
					hint="Onde a tua conta está aberta. Um sítio que não reconheças, termina."
				>
					<Card padded={false}>
						{sessionsQuery.isPending ? (
							<View className="p-4">
								<Text
									className="font-sans text-body-small"
									style={{ color: themeColors.secondary }}
								>
									A procurar sessões…
								</Text>
							</View>
						) : sessions.length === 0 ? (
							<View className="p-4">
								<Text
									className="font-sans text-body-small"
									style={{ color: themeColors.secondary }}
								>
									Não foi possível ler as sessões. Tenta mais
									tarde.
								</Text>
							</View>
						) : (
							sessions.map((session, index) => (
								<View key={session.token}>
									{index > 0 ? <Divider /> : null}
									<View className="flex-row items-center px-4 py-3.5">
										<View
											className="w-9 h-9 rounded-full items-center justify-center"
											style={{
												backgroundColor:
													themeColors.accentWeak,
											}}
										>
											<Ionicons
												name="phone-portrait-outline"
												size={17}
												color={themeColors.primary}
											/>
										</View>
										<View className="flex-1 ml-3 mr-2">
											<Text
												className="font-sansMedium text-body-small"
												style={{
													color: themeColors.text,
												}}
											>
												{describeDevice(
													session.userAgent,
												) ?? 'Dispositivo desconhecido'}
											</Text>
											<Text
												className="font-sans text-body-xs mt-0.5"
												style={{
													color: themeColors.secondary,
												}}
											>
												{[
													session.ipAddress ??
														'IP desconhecido',
													sessionDate(
														session.createdAt,
													),
												].join(' · ')}
											</Text>
										</View>
										<BoleiaButton
											title="Terminar"
											onPress={() =>
												revoke(session.token)
											}
											variant="ghost"
											small
										/>
									</View>
								</View>
							))
						)}
					</Card>

					{sessions.length > 1 ? (
						<View className="mt-3">
							<BoleiaButton
								title="Terminar as outras sessões"
								onPress={revokeOthers}
								variant="secondary"
							/>
						</View>
					) : null}
				</Block>

				{/* ---------------- Palavra-passe ---------------- */}
				<Block
					title="Palavra-passe"
					hint="Trocar a palavra-passe termina as outras sessões."
				>
					<Card padded={false} className="p-4">
						<Input
							label="Palavra-passe actual"
							value={currentPassword}
							onChangeText={setCurrentPassword}
							isPassword
							containerStyle={{ marginBottom: 4 }}
						/>
						<Input
							label="Nova palavra-passe"
							value={newPassword}
							onChangeText={setNewPassword}
							isPassword
							containerStyle={{ marginBottom: 4 }}
						/>
						<Text
							className="font-sans text-body-xs -mt-1 mb-3"
							style={{ color: themeColors.secondary }}
						>
							Pelo menos 8 caracteres.
						</Text>
						<BoleiaButton
							title="Trocar palavra-passe"
							onPress={changePassword}
							loading={savingPassword}
							disabled={
								!currentPassword || newPassword.length < 8
							}
						/>
					</Card>
				</Block>

				{/* ---------------- Eliminar ---------------- */}
				<Block title="Eliminar conta">
					<Card padded={false}>
						<SettingRow
							icon="trash-outline"
							label="Eliminar a minha conta e os meus dados"
							action={deleting ? 'A eliminar…' : 'Eliminar'}
							tone="danger"
							onPress={confirmDelete}
						/>
					</Card>
				</Block>
			</ScrollView>
		</SafeAreaView>
	);
}
