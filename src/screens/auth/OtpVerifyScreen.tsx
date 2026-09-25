import React, { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaAuthStackParamList } from '../../types/navigation';
import AuthShell from '../../components/AuthShell';
import BoleiaButton from '../../components/BoleiaButton';
import { sendOtp, verifyOtpCode, apiErrorMessage } from '../../lib/api';

export default function OtpVerifyScreen() {
	const route = useRoute<RouteProp<BoleiaAuthStackParamList, 'OtpVerify'>>();
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaAuthStackParamList, 'OtpVerify'>
		>();
	const { phone, purpose } = route.params;

	const { themeColors } = useThemeColors();
	const [code, setCode] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);
	const [resent, setResent] = useState(false);

	const confirmCode = async () => {
		if (code.length < 6) return;
		setPending(true);
		setError(null);
		try {
			const res = await verifyOtpCode(phone, purpose, code);
			if (purpose === 'reset') {
				if (!res.token) {
					throw new Error('missing-token');
				}
				navigation.navigate('ResetPassword', {
					phone,
					token: res.token,
				});
				return;
			}
			Alert.alert(
				'Conta verificada',
				'Já podes entrar com o teu número e senha.',
				[{ text: 'OK', onPress: () => navigation.popToTop() }],
			);
		} catch (e) {
			setError(
				apiErrorMessage(e, 'Código errado ou expirado. Tenta de novo.'),
			);
		} finally {
			setPending(false);
		}
	};

	const resend = async () => {
		setError(null);
		try {
			await sendOtp(phone, purpose);
			setResent(true);
		} catch (e) {
			setError(
				apiErrorMessage(
					e,
					'Não foi possível reenviar o código. Tenta de novo.',
				),
			);
		}
	};

	return (
		<AuthShell
			eyebrow="Confirmação"
			title="Insere o código"
			subtitle={
				<>
					Enviámos um código de 6 dígitos por WhatsApp para{' '}
					<Text
						className="font-sans"
						style={{ color: themeColors.text }}
					>
						+244 {phone}
					</Text>
					{purpose === 'signup'
						? ', só para confirmar o teu número.'
						: ', só para definires a senha nova.'}
				</>
			}
			back={() => navigation.goBack()}
			footer={
				<View className="flex-row items-center justify-center">
					<Text
						className="font-sans text-body-small"
						style={{ color: themeColors.secondary }}
					>
						Não recebeste?{' '}
					</Text>
					<Pressable onPress={resend}>
						<Text
							className="font-sansBold text-body-small"
							style={{ color: themeColors.laterite }}
						>
							{resent ? 'Reenviado ✓' : 'Reenviar código'}
						</Text>
					</Pressable>
				</View>
			}
		>
			<View
				className="rounded-xl border-2 border-dashed px-4"
				style={{
					borderColor: error ? themeColors.error : themeColors.border,
					backgroundColor: themeColors.card,
				}}
			>
				<TextInput
					value={code}
					onChangeText={(t) => {
						setCode(t.replace(/\D/g, '').slice(0, 6));
						setError(null);
					}}
					keyboardType="number-pad"
					placeholder="000000"
					placeholderTextColor={themeColors.border}
					className="py-4 font-sansMedium text-title-secondary text-center"
					style={{ color: themeColors.text, letterSpacing: 8 }}
					maxLength={6}
					autoFocus
				/>
			</View>
			{error ? (
				<Text
					className="font-sans text-body-small mt-3"
					style={{ color: themeColors.error }}
				>
					{error}
				</Text>
			) : null}
			<View className="mt-1">
				<BoleiaButton
					title="Continuar"
					onPress={confirmCode}
					loading={pending}
					disabled={code.length < 6}
					strong
				/>
			</View>
		</AuthShell>
	);
}
