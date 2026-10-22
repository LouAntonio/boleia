import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { type RouteProp } from '@react-navigation/native';
import { BoleiaMainStackParamList } from '../../types/navigation';
import { useThemeColors } from '../../hooks/useThemeColors';
import BackButton from '../../components/BackButton';
import Card from '../../components/Card';
import BoleiaButton from '../../components/BoleiaButton';
import Avatar from '../../components/Avatar';
import SectionTitle from '../../components/SectionTitle';
import { qk } from '../../lib/queryKeys';
import { getPublicProfile } from '../../lib/api';
import { fullName, initials, fmtDayMonthYear, dateOf } from '../../lib/format';

/**
 * Perfil público de quem vai numa boleia.
 *
 * Dados reais do `GET /api/people/:id` — nome completo, apresentação e
 * "membro desde". É a projectação do backend: se o servidor não manda email,
 * telefone ou documentos, este ecrã nunca os mostra; não é uma decisão da
 * UI, é a ausência dos campos no tipo.
 *
 * **Sem reputação inventada.** Não há backend de avaliações, e uma nota
 * escrita à mão ("3.7") seria um dado falsificado numa superfície de
 * confiança. O que existe vem, o que não existe não aparece.
 */
export default function PublicProfileScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'PublicProfile'>
		>();
	const route =
		useRoute<RouteProp<BoleiaMainStackParamList, 'PublicProfile'>>();
	const { themeColors } = useThemeColors();
	const userId = route.params.userId;

	const {
		data: person,
		isLoading,
		isError,
	} = useQuery({
		queryKey: qk.people.of(userId),
		queryFn: () => getPublicProfile(userId),
		enabled: userId.length > 0,
	});

	if (isLoading) {
		return (
			<SafeAreaView
				className="flex-1 px-5"
				style={{ backgroundColor: themeColors.background }}
			>
				<Card>
					<View className="items-center py-8">
						<Text
							className="font-sans text-body-small"
							style={{ color: themeColors.secondary }}
						>
							A carregar o perfil…
						</Text>
					</View>
				</Card>
			</SafeAreaView>
		);
	}

	if (isError || !person) {
		return (
			<SafeAreaView
				className="flex-1 px-5"
				style={{ backgroundColor: themeColors.background }}
			>
				<Header title="Perfil" onBack={() => navigation.goBack()} />
				<Card>
					<View className="items-center py-6">
						<Text
							className="font-sansBold text-body-small"
							style={{ color: themeColors.text }}
						>
							Perfil não encontrado
						</Text>
						<Text
							className="font-sans text-body-xs text-center mt-1.5"
							style={{ color: themeColors.secondary }}
						>
							A pessoa pode ter apagado a conta, ou o link veio de
							uma viagem antiga sem presença.
						</Text>
					</View>
				</Card>
			</SafeAreaView>
		);
	}

	const memberSince = fmtDayMonthYear(dateOf(person.createdAt));

	return (
		<SafeAreaView
			className="flex-1 px-5"
			style={{ backgroundColor: themeColors.background }}
		>
			<Header title="Perfil" onBack={() => navigation.goBack()} />
			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingBottom: 40 }}
				showsVerticalScrollIndicator={false}
			>
				<Card>
					<View className="flex-row items-center py-2">
						<Avatar
							initials={
								initials(person.name, person.surname ?? '') ||
								person.name.charAt(0)
							}
							size={64}
						/>
						<View className="flex-1 ml-4">
							<Text
								className="font-sansExtraBold text-title-tertiary"
								style={{ color: themeColors.text }}
								numberOfLines={2}
							>
								{fullName(person.name, person.surname)}
							</Text>
							<Text
								className="font-sansMedium text-body-xs mt-1"
								style={{ color: themeColors.secondary }}
							>
								Membro desde {memberSince}
							</Text>
						</View>
					</View>
				</Card>

				<View className="mt-5">
					<SectionTitle>Apresentação</SectionTitle>
					<Card>
						{person.bio ? (
							<Text
								className="font-sans text-body leading-6"
								style={{ color: themeColors.text }}
							>
								{person.bio}
							</Text>
						) : (
							<Text
								className="font-sans text-body-small"
								style={{ color: themeColors.secondary }}
							>
								Esta pessoa ainda não escreveu uma apresentação.
							</Text>
						)}
					</Card>
				</View>

				<View className="mt-5">
					<SectionTitle>Privacidade</SectionTitle>
					<Card>
						<Text
							className="font-sans text-body-xs leading-5"
							style={{ color: themeColors.secondary }}
						>
							Aqui fica só o que a pessoa escolhe partilhar: nome,
							apresentação e a data em que entrou. Nenhum contacto
							ou documento é público na Boleia — os dados de
							embarque vão ao motorista pela reserva, não por este
							cartão.
						</Text>
					</Card>
				</View>

				<View className="w-full mt-6">
					<BoleiaButton
						title="Voltar"
						variant="secondary"
						onPress={() => navigation.goBack()}
					/>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

/**
 * Cabeçalho uniforme dos três estados (loading/erro/card).
 *
 * Mesmo no loading, o `BackButton` está no sítio: um ecrã que ainda não
 * decidiu o que mostrar não deve tirar a saída a quem clicou sem querer.
 */
function Header({ title, onBack }: { title: string; onBack: () => void }) {
	const { themeColors } = useThemeColors();
	return (
		<View className="flex-row items-center pt-2 pb-3">
			<View className="mr-3">
				<BackButton onPress={onBack} />
			</View>
			<Text
				className="font-sansExtraBold text-title-secondary"
				style={{ color: themeColors.text }}
			>
				{title}
			</Text>
		</View>
	);
}
