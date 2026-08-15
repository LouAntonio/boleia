import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaAuthStackParamList } from '../../types/navigation';
import BoleiaButton from '../../components/BoleiaButton';
import { verifyOtp, requestOtp } from '../../mock/repos/authRepo';

export default function OtpVerifyScreen() {
	const route = useRoute<RouteProp<BoleiaAuthStackParamList, 'OtpVerify'>>();
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaAuthStackParamList, 'OtpVerify'>
		>();
	const phone = route.params.phone;

	const { themeColors } = useThemeColors();
	const [code, setCode] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);
	const [resent, setResent] = useState(false);

	const continueRecovery = () => {
		if (!verifyOtp(phone, code)) {
			setError('Código errado ou expirado. Tenta de novo.');
			return;
		}
		setPending(true);
		setTimeout(() => {
			setPending(false);
			navigation.navigate('ResetPassword', { phone });
		}, 400);
	};

	const resend = () => {
		requestOtp(phone);
		setError(null);
		setResent(true);
	};

	return (
		<SafeAreaView
			className="flex-1 px-6 pt-14"
			style={{ backgroundColor: themeColors.background }}
		>
			<Pressable onPress={() => navigation.goBack()} className="mb-4">
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
				Confirmação
			</Text>
			<Text
				className="font-display text-[30px] mt-3"
				style={{ color: themeColors.text }}
			>
				Insere o código
			</Text>
			<Text
				className="font-sans text-[14px] mt-2 leading-5"
				style={{ color: themeColors.secondary }}
			>
				Enviámos um SMS de 6 dígitos para{' '}
				<Text className="font-mono" style={{ color: themeColors.text }}>
					+244 {phone}
				</Text>
				, só para definir a senha nova.
			</Text>

			<View
				className="mt-8 rounded-2xl border px-4"
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
					className="py-4 font-mono text-[22px] text-center"
					style={{ color: themeColors.text, letterSpacing: 8 }}
					maxLength={6}
					autoFocus
				/>
			</View>

			{error ? (
				<Text
					className="font-sans text-[13px] mt-3"
					style={{ color: themeColors.error }}
				>
					{error}
				</Text>
			) : (
				<Text
					className="font-sans text-[13px] mt-3"
					style={{ color: themeColors.secondary }}
				>
					Demo: o código é 773214.
				</Text>
			)}

			<View className="mt-6">
				<BoleiaButton
					title="Continuar"
					onPress={continueRecovery}
					loading={pending}
					disabled={code.length < 6}
				/>
			</View>

			<View className="flex-row items-center justify-center mt-6">
				<Text
					className="font-sans text-[13px]"
					style={{ color: themeColors.secondary }}
				>
					Não recebeste?{' '}
				</Text>
				<Pressable onPress={resend}>
					<Text
						className="font-sansBold text-[13px]"
						style={{ color: themeColors.laterite }}
					>
						{resent ? 'Reenviado ✓' : 'Reenviar SMS'}
					</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}
