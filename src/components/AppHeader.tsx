import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../hooks/useThemeColors';
import { useSessionInitials } from '../hooks/useSessionUser';
import { useAppStore } from '../store/appStore';
import Avatar from './Avatar';
import type {
	DriverTabsParamList,
	PassengerTabsParamList,
} from '../types/navigation';

/**
 * Cabeçalho da app: wordmark à esquerda (leva a casa), avatar à direita (leva
 * ao perfil).
 *
 * Não é chrome do `native-stack` — é uma linha dentro do scroll de cada
 * ecrã. A razão está nos nove botões de voltar escritos à mão nos ecrãs
 * empilhados: um header nativo apareceria por cima de todos eles. Como só vai
 * nas raízes de tab, que já são folhas, não há conflito.
 *
 * **Deriva as rotas do papel em vez de as receber como props.** As tabs de
 * passageiro e de motorista têm nomes diferentes para o mesmo sítio
 * (`PassengerProfile` vs `DriverProfile`), e `currentRole` já é a fonte de
 * verdade de que lado está activo. Passar as callbacks de fora obrigaria os
 * cinco ecrãs a repetir a mesma lógica.
 *
 * **Não vai no ecrã de Perfil.** O avatar a levar ao perfil onde já se está é
 * um clique morto; aí o bloco de identidade é o avatar, maior e com nome.
 */

type TabRoute = keyof PassengerTabsParamList | keyof DriverTabsParamList;

export default function AppHeader() {
	const { themeColors } = useThemeColors();
	const navigation = useNavigation<{ navigate: (route: TabRoute) => void }>();
	const initialsLabel = useSessionInitials();
	const currentRole = useAppStore((s) => s.currentRole);

	const isDriver = currentRole === 'driver';
	const home = (isDriver ? 'DriverHome' : 'PassengerHome') as TabRoute;
	const profile = (
		isDriver ? 'DriverProfile' : 'PassengerProfile'
	) as TabRoute;

	return (
		<View className="flex-row items-center justify-between mb-5">
			<Pressable
				onPress={() => navigation.navigate(home)}
				accessibilityRole="button"
				accessibilityLabel="Ir para o início"
				hitSlop={8}
			>
				<Text
					className="font-sansExtraBold text-title-primary"
					style={{ color: themeColors.text }}
				>
					Boleia
				</Text>
			</Pressable>

			<Avatar
				initials={initialsLabel}
				size={44}
				onPress={() => navigation.navigate(profile)}
				accessibilityLabel="Abrir perfil"
			/>
		</View>
	);
}
