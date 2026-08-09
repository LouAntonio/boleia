import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { RouteProp, useRoute } from '@react-navigation/native';
import { BoleiaAuthStackParamList } from '../../types/navigation';
import { navigationRef } from '../../lib/navigationRef';
import BoleiaButton from '../../components/BoleiaButton';
import { findOrCreateByPhone, updateUser } from '../../mock/repos/authRepo';
import { useAppStore } from '../../store/appStore';

export default function ProfileSetupScreen() {
	const route =
		useRoute<RouteProp<BoleiaAuthStackParamList, 'ProfileSetup'>>();
	const phone = route.params.phone;
	const { themeColors } = useThemeColors();

	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [bio, setBio] = useState('');
	const [pending, setPending] = useState(false);

	const canSave = firstName.trim().length > 0 && lastName.trim().length > 0;

	const save = () => {
		if (!canSave) return;
		setPending(true);
		setTimeout(() => {
			const user = findOrCreateByPhone(phone);
			updateUser(user.id, {
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				bio: bio.trim(),
			});
			useAppStore.getState().markProfileReady();
			navigationRef.reset({
				index: 0,
				routes: [{ name: 'App', params: { screen: 'Main' } }],
			});
		}, 500);
	};

	const field = (
		label: string,
		value: string,
		setter: (v: string) => void,
	) => (
		<View className="mb-4">
			<Text
				className="font-sansMedium text-[12px] uppercase tracking-wider mb-1.5"
				style={{ color: themeColors.laterite }}
			>
				{label}
			</Text>
			<View
				className="rounded-xl border px-3.5"
				style={{
					borderColor: themeColors.border,
					backgroundColor: themeColors.card,
				}}
			>
				<TextInput
					value={value}
					onChangeText={setter}
					placeholderTextColor={themeColors.border}
					className="py-3 font-sans text-[15px]"
					style={{ color: themeColors.text }}
				/>
			</View>
		</View>
	);

	return (
		<SafeAreaView
			className="flex-1"
			style={{ backgroundColor: themeColors.background }}
		>
			<ScrollView
				className="flex-1 px-6 pt-14"
				contentContainerStyle={{ paddingBottom: 32 }}
			>
				<Text
					className="font-mono text-[11px] uppercase tracking-[3px]"
					style={{ color: themeColors.laterite }}
				>
					Conta criada
				</Text>
				<Text
					className="font-display text-[30px] mt-3"
					style={{ color: themeColors.text }}
				>
					Dados do teu perfil
				</Text>
				<Text
					className="font-sans text-[14px] mt-2 leading-5"
					style={{ color: themeColors.secondary }}
				>
					O mesmo perfil serve para viajares como passageiro ou
					montares a tua boleia como motorista.
				</Text>

				<View className="mt-8">
					{field('Primeiro nome', firstName, setFirstName)}
					{field('Apelido', lastName, setLastName)}
					{field('Sobre ti (opcional)', bio, setBio)}
					<Text
						className="font-sans text-[12px] mb-6"
						style={{ color: themeColors.secondary }}
					>
						A seguir: podes verificar o BI e registar a viatura para
						publicar viagens.
					</Text>
					<BoleiaButton
						title="Começar a viajar"
						onPress={save}
						loading={pending}
						disabled={!canSave}
					/>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
