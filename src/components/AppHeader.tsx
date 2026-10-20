import React from 'react';
import { View, Image, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
 * Cabeçalho da app: marca à esquerda (leva a casa), avatar à direita (leva ao
 * perfil).
 *
 * **Toca nas bordas do dispositivo.** O `SafeAreaView` dos ecrãs que o recebem
 * tem de declarar `edges={['left','right','bottom']}` — sem `top`. O header
 * mete-se por baixo da barra de notificação, e é a **cor dele** que preenche
 * essa faixa até ao canto do ecrã.
 *
 * Antes o inverso: o `SafeAreaView` empurrava tudo para baixo da barra, e nessa
 * faixa via-se a cor do ecrã (`background`) a encontrar o branco do header
 * (`card`) exactamente a meio. Duas cores emendadas onde não devem — e no
 * iPhone com notch, um rectângulo de cor errada ao lado da câmara.
 *
 * No Android 15+ a barra de notificação é transparente por lei: não há
 * `backgroundColor` para lhe pôr. Desenhar por baixo com a cor certa **é** o
 * mecanismo, e é o que o `paddingTop` abaixo faz.
 *
 * **Barra fixa, fora do scroll.** Fica no topo e o conteúdo passa por baixo.
 * Um cabeçalho que scrolla com o conteúdo não é um cabeçalho.
 *
 * **Continua a não ser chrome do `native-stack`.** Há nove botões de voltar
 * escritos à mão nos ecrãs empilhados, e um header nativo apareceria por cima
 * de todos eles. Como só vai nas raízes de tab, que já são folhas, não há
 * conflito.
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

/** Folga entre o conteúdo do header e o seu bordo. */
const GAP = 12;

/**
 * `assets/images/lockup.png`: o glifo e a wordmark de `logo.png`, **sem a
 * tagline** ("Disponibilidade, Rapidez e Segurança").
 *
 * A tagline foi cortada por medição, não por gosto: medindo a imagem, a
 * wordmark acaba em y≈275 e a tagline vive em y≈288-294. A 42px de altura total
 * seriam menos de dois pixels — não é uma tagline, é uma linha de ruído
 * amarela debaixo do logo.
 *
 * **O lockup é branco sobre placa escura, e a placa fica.** Tirá-la para
 * combinar com o `card` branco deixaria o "BOLEIA" branco sobre branco. Por
 * isso a marca é um bloco escuro no canto — que é o que o ficheiro de marca
 * é. O glifo lê-se; a wordmark, a este tamanho, é reforço e não leitura.
 */
const LOCKUP = require('../../assets/images/lockup.png');

export default function AppHeader() {
	const { themeColors } = useThemeColors();
	const insets = useSafeAreaInsets();
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
			className="flex-row items-center justify-between px-5"
			style={{
				// O `GAP` em baixo é a folga que o `py-3` dava; em cima quem a dá
				// é a própria barra de notificação.
				paddingTop: insets.top + GAP,
				paddingBottom: GAP,
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
					source={LOCKUP}
					style={{ width: 56, height: 42 }}
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
