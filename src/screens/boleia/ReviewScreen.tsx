import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import BackButton from '../../components/BackButton';
import Card from '../../components/Card';
import BoleiaButton from '../../components/BoleiaButton';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useRoute } from '@react-navigation/native';
import { BoleiaMainStackParamList } from '../../types/navigation';

/**
 * Avaliações — ainda não disponível.
 *
 * Não existe endpoint de reviews no backend. O ecrã mantém-se na navegação
 * porque faz parte do fluxo de uma viagem concluída, mas diz o que falta em vez
 * de simular estrelas e comentários que se perdem ao fechar a app.
 *
 * Quando houver backend, é aqui que se liga: `POST /api/reviews` com
 * `rideId`, `toUserId`, `rating` e `comment`.
 */
export default function ReviewScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'Review'>
		>();
	const route = useRoute<RouteProp<BoleiaMainStackParamList, 'Review'>>();
	const { themeColors } = useThemeColors();

	const subjectLabel =
		route.params.subject === 'passenger'
			? 'Avaliar passageiro'
			: 'Avaliar motorista';

	return (
		<SafeAreaView
			className="flex-1"
			style={{ backgroundColor: themeColors.background }}
		>
			<View className="flex-row items-center px-5 pt-2 pb-3">
				<BackButton onPress={() => navigation.goBack()} />
				<View className="flex-1">
					<Text
						className="font-sansMedium text-body-xs"
						style={{ color: themeColors.secondary }}
					>
						{subjectLabel}
					</Text>
					<Text
						className="font-sansExtraBold text-title-secondary -mt-0.5"
						style={{ color: themeColors.text }}
					>
						Como correu a viagem?
					</Text>
				</View>
			</View>

			<ScrollView
				className="flex-1 px-5"
				contentContainerStyle={{ paddingBottom: 40 }}
				showsVerticalScrollIndicator={false}
			>
				<Card>
					<View className="items-center py-4">
						<View
							className="w-14 h-14 rounded-full items-center justify-center"
							style={{ backgroundColor: themeColors.accentWeak }}
						>
							<Ionicons
								name="star-outline"
								size={26}
								color={themeColors.primary}
							/>
						</View>
						<Text
							className="font-sansBold text-label mt-3"
							style={{ color: themeColors.text }}
						>
							Ainda não podes avaliar
						</Text>
						<Text
							className="font-sans text-body-small text-center mt-1.5"
							style={{ color: themeColors.secondary }}
						>
							As avaliações da Boleia vão ficar disponíveis em
							breve. Entretanto, as viagens que fizeres continuam
							contadas no teu histórico.
						</Text>
					</View>
				</Card>

				<View className="w-full mt-6">
					<BoleiaButton
						title="Voltar"
						onPress={() => navigation.goBack()}
						variant="secondary"
					/>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
