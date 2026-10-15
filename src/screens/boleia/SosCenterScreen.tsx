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
import { BoleiaMainStackParamList } from '../../types/navigation';

/**
 * Central de segurança — ainda não disponível.
 *
 * Não existe endpoint de SOS no backend, e o ecrã já oferecia um botão que
 * confirmava alertas que não chegavam a lado nenhum. Numa emergência, dizer
 * "alerta enviado" sem ter enviado nada é o pior erro que uma app de
 * mobilidade pode cometer, por isso o ecrã explica o que fazer enquanto a
 * functionality não existe.
 */
export default function SosCenterScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'SosCenter'>
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
					Central de segurança
				</Text>
			</View>

			<ScrollView
				className="flex-1"
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
								name="shield-outline"
								size={26}
								color={themeColors.primary}
							/>
						</View>
						<Text
							className="font-sansBold text-label mt-3"
							style={{ color: themeColors.text }}
						>
							A central Boleia ainda não está activa
						</Text>
						<Text
							className="font-sans text-body-small text-center mt-1.5"
							style={{ color: themeColors.secondary }}
						>
							Quando estiver, um alerta SOS avisa a tua pessoa de
							confiança e a central em poucos minutos.
						</Text>
					</View>
				</Card>

				<View
					className="mt-4 p-4 rounded-xl border"
					style={{
						borderColor: themeColors.border,
						backgroundColor: themeColors.card,
					}}
				>
					<Text
						className="font-sansBold text-body-small"
						style={{ color: themeColors.text }}
					>
						Enquanto isso, em emergência
					</Text>
					<Text
						className="font-sans text-body-xs mt-1.5 leading-5"
						style={{ color: themeColors.secondary }}
					>
						Liga directamente para os serviços de emergência locais.
						Diz onde estás, para que caminho fazes e o nome de quem
						viaja contigo.
					</Text>
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
