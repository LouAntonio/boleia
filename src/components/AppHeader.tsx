import React from 'react';
import { View, Image, Pressable } from 'react-native';
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
 * Cabeçalho da app: glifo à esquerda (leva a casa), avatar à direita (leva ao
 * perfil).
 *
 * **Barra fixa, fora do scroll.** Fica no topo do ecrã com fundo `card` e uma
 * hairline `border` por baixo, e o conteúdo passa por baixo dela. Antes era uma
 * linha dentro do `ScrollView`, o que quiere dizer que o "cabeçalho" scrollava
 * com o conteúdo e não se via nada — nenhuma barra, nenhuma cor, nenhuma
 * separação. Um cabeçalho que aparece e desaparece não é um cabeçalho.
 *
 * **Continua a não ser chrome do `native-stack`.** A razão é a mesma de
 * sempre: há nove botões de voltar escritos à mão nos ecrãs empilhados, e um
 * header nativo apareceria por cima de todos eles. Como só vai nas raízes de
 * tab, que já são folhas, não há conflito — e fixá-lo aqui não muda isso.
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

/**
 * `assets/images/mark.png`, e não `logo.png`.
 *
 * O `logo.png` é o lockup completo: fundo escuro, wordmark e a tagline
 * "Disponibilidade, Rapidez e Segurança". A 28px de altura a tagline é ilegível
 * e o resto vira um borrão. O `mark.png` é só o glifo, recortado do `icon.png`
 * com os cantos transparentes — o original vinha com uma placa opaca #121212
 * que num cabeçalho claro era um mosaico.
 */
const MARK = require('../../assets/images/mark.png');

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
		<View
			className="flex-row items-center justify-between px-5 py-3"
			style={{
				backgroundColor: themeColors.card,
				borderBottomWidth: 1,
				borderBottomColor: themeColors.border,
			}}
		>
			<Pressable
				onPress={() => navigation.navigate(home)}
				accessibilityRole="button"
				accessibilityLabel="Ir para o início"
				hitSlop={8}
			>
				<Image
					source={MARK}
					style={{ width: 28, height: 28 }}
					resizeMode="contain"
					accessibilityIgnoresInvertColors
				/>
			</Pressable>

			<Avatar
				initials={initialsLabel}
				size={36}
				onPress={() => navigation.navigate(profile)}
				accessibilityLabel="Abrir perfil"
			/>
		</View>
	);
}
