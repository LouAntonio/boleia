import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
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
import { requestOtp, normalizePhone } from '../../mock/repos/authRepo';

const DEMO_PHONE = '923456789';

function maskPhone(phone: string): string {
	const digits = phone.replace(/\D/g, '').slice(0, 9);
	if (digits.length <= 3) return digits;
	if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
	return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

export default function PhoneEntryScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaAuthStackParamList, 'PhoneEntry'>
		>();
	const { themeColors } = useThemeColors();
	const [phone, setPhone] = useState(maskPhone(DEMO_PHONE));
	const [pending, setPending] = useState(false);

	const submit = () => {
		if (normalizePhone(phone).length < 9) return;
		setPending(true);
		// latência simulada
		setTimeout(() => {
			requestOtp(phone);
			setPending(false);
			navigation.navigate('OtpVerify', { phone });
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
						Vais receber um código por SMS para confirmares o
						número. Sem senhas para decorar.
					</Text>

					<View
						className="mt-8 rounded-2xl border px-4"
						style={{
							borderColor: themeColors.border,
							backgroundColor: themeColors.card,
						}}
					>
						<TextInput
							value={phone}
							onChangeText={(t) => setPhone(maskPhone(t))}
							keyboardType="phone-pad"
							placeholder="9XX XXX XXX"
							placeholderTextColor={themeColors.border}
							className="py-4 font-mono text-[18px]"
							style={{ color: themeColors.text }}
							maxLength={11}
						/>
					</View>

					<View className="mt-16 justify-end">
						<View
							className="rounded-xl border px-4 py-3 mb-4"
							style={{
								borderColor: themeColors.laterite,
								backgroundColor: themeColors.card,
							}}
						>
							<Text
								className="font-mono text-[12px]"
								style={{ color: themeColors.laterite }}
							>
								Demo: usa o código 773214
							</Text>
						</View>
						<BoleiaButton
							title="Enviar código"
							onPress={submit}
							loading={pending}
							disabled={normalizePhone(phone).length < 9}
						/>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
