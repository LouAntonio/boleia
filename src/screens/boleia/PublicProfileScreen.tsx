import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import BackButton from '../../components/BackButton';
import Card from '../../components/Card';
import BoleiaButton from '../../components/BoleiaButton';
import SectionTitle from '../../components/SectionTitle';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';

/**
 * Perfil público de outro utilizador.
 *
 * Não existe endpoint de perfil no backend, e o caminho que abria este ecrã
 * (a partir da lista de bordo) também não expõe dados de outras pessoas. O
 * ecrã mantém-se na navegação com o que o servidor pode garantir e sem
 * inventar reputação: mostrar um nome e uma nota que não existem seria pior do
 * que não mostrar nada.
 */
export default function PublicProfileScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'PublicProfile'>
		>();
	const { themeColors } = useThemeColors();

	return (
		<SafeAreaView
			className="flex-1 px-5"
			style={{ backgroundColor: themeColors.background }}
		>
			<View className="flex-row items-center pt-2 pb-3">
				<BackButton onPress={() => navigation.goBack()} />
				<Text
					className="font-sansExtraBold text-title-secondary"
					style={{ color: themeColors.text }}
				>
					Perfil
				</Text>
			</View>

			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingBottom: 40 }}
				showsVerticalScrollIndicator={false}
			>
				<Card>
					<View className="items-center py-4">
						<Text
							className="font-sansBold text-label"
							style={{ color: themeColors.text }}
						>
							Perfil ainda não disponível
						</Text>
						<Text
							className="font-sans text-body-small text-center mt-1.5"
							style={{ color: themeColors.secondary }}
						>
							{/*
							 * Só se mostra o que o servidor garante. A
							 * identidade de quem viaja contigo só é partilhada
							 * com o motorista da corrida, e nunca por um
							 * perfil público.
							 */}
							As avaliações e a nota de reputação ficam
							disponíveis em breve.
						</Text>
					</View>
				</Card>

				<View className="mt-5">
					<SectionTitle>Privacidade</SectionTitle>
					<View
						className="p-4 rounded-xl border"
						style={{
							borderColor: themeColors.border,
							backgroundColor: themeColors.card,
						}}
					>
						<Text
							className="font-sans text-body-xs leading-5"
							style={{ color: themeColors.secondary }}
						>
							O teu nome e o teu número só são partilhados com o
							motorista de uma viagem em que reservado lugar. Não
							são públicos.
						</Text>
					</View>
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
