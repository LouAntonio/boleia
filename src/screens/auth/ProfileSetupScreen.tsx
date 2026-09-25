import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { BoleiaAuthStackParamList } from '../../types/navigation';
import AuthShell from '../../components/AuthShell';
import BoleiaButton from '../../components/BoleiaButton';
import Input from '../../components/Input';
import { updateProfile, apiErrorMessage } from '../../lib/api';
import { useAppStore } from '../../store/appStore';
import { navigationRef } from '../../lib/navigationRef';

export default function ProfileSetupScreen() {
	const route =
		useRoute<RouteProp<BoleiaAuthStackParamList, 'ProfileSetup'>>();
	const navigation = useNavigation();
	const { userId } = route.params;
	const { themeColors } = useThemeColors();

	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [bio, setBio] = useState('');
	const [pending, setPending] = useState(false);

	const canSave = firstName.trim().length > 0 && lastName.trim().length > 0;

	const save = async () => {
		if (!canSave) return;
		setPending(true);
		try {
			await updateProfile({
				name: firstName.trim(),
				surname: lastName.trim(),
				bio: bio.trim() || undefined,
			});
			useAppStore.getState().signIn(userId);
			navigationRef.reset({
				index: 0,
				routes: [{ name: 'App', params: { screen: 'Main' } }],
			});
		} catch (e) {
			Alert.alert(
				'Erro',
				apiErrorMessage(
					e,
					'Não foi possível guardar o perfil. Tenta de novo.',
				),
			);
		} finally {
			setPending(false);
		}
	};

	return (
		<AuthShell
			contextLabel="Conta criada"
			title="Dados do teu perfil"
			subtitle="O mesmo perfil serve para viajares como passageiro ou montares a tua boleia como motorista."
			back={() => navigation.goBack()}
		>
			<Input
				label="Primeiro nome"
				value={firstName}
				onChangeText={setFirstName}
				placeholder="O teu primeiro nome"
				leftIcon="person-outline"
				autoCapitalize="words"
			/>
			<Input
				label="Apelido"
				value={lastName}
				onChangeText={setLastName}
				placeholder="O teu apelido"
				leftIcon="person-outline"
				autoCapitalize="words"
			/>
			<Input
				label="Sobre ti (opcional)"
				value={bio}
				onChangeText={setBio}
				placeholder="Ex.: costumo viajar ao fim-de-semana"
				multiline
			/>
			<Text
				className="font-sans text-body-xs -mt-2 mb-2"
				style={{ color: themeColors.secondary }}
			>
				A seguir: podes verificar o BI e registar a viatura para
				publicar viagens.
			</Text>
			<View className="mt-1">
				<BoleiaButton
					title="Começar a viajar"
					onPress={save}
					loading={pending}
					disabled={!canSave}
					strong
				/>
			</View>
		</AuthShell>
	);
}
