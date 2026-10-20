import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { qk } from '../../lib/queryKeys';
import { useThemeColors } from '../../hooks/useThemeColors';
import TripStripCard from '../../components/TripStripCard';
import ScreenHeader from '../../components/ScreenHeader';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import { listMyRides } from '../../lib/api';
import { toRide } from '../../lib/rideMapper';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
	BoleiaMainStackParamList,
	DriverTabsParamList,
} from '../../types/navigation';

/**
 * Painel do motorista: as suas viagens.
 *
 * A lista serve para escolher a viagem. A gestão — iniciar, terminar, cancelar
 * e responder aos pedidos — vive no ecrã de detalhe (`DriverTrip`). Antes cada
 * cartão trazia os botões e as reservas de todas as viagens, o que tornava a
 * lista uma parede de acções e carregava reservas que ninguém tinha aberto.
 */
export default function TripsScreen() {
	const { themeColors } = useThemeColors();
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'Main'>
		>();
	const tabNavigation =
		useNavigation<BottomTabNavigationProp<DriverTabsParamList>>();

	const { data: page, isLoading } = useQuery({
		// O `limit` na chave: o Perfil pede 100 com `myRides` e esta tela 50. Com
		// a chave em comum eram a mesma query e as contagens do perfil vinham
		// de uma lista truncada (ou o contrário).
		queryKey: qk.myRides.list({ limit: 50 }),
		queryFn: () => listMyRides({ limit: 50 }),
	});
	const mine = (page?.rows ?? []).map(toRide);

	if (!isLoading && mine.length === 0) {
		return (
			<SafeAreaView
				className="flex-1"
				edges={['left', 'right', 'bottom']}
				style={{ backgroundColor: themeColors.background }}
			>
				<AppHeader />

				<View className="flex-1 px-5">
					<ScreenHeader
						title="As tuas viagens"
						meta="Viagens publicadas e pedidos de boleia"
					/>
					<View className="flex-1 justify-center pb-10">
						<EmptyState
							icon="add-circle-outline"
							title="Ainda nada publicado"
							copy="Publica a tua primeira viagem e gere aqui os pedidos de boleia."
							actionTitle="Publicar viagem"
							onAction={() =>
								tabNavigation.navigate('DriverPublish')
							}
						/>
					</View>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView
			className="flex-1"
			edges={['left', 'right', 'bottom']}
			style={{ backgroundColor: themeColors.background }}
		>
			<AppHeader />

			<View className="flex-1 px-5">
				<ScreenHeader
					title="As tuas viagens"
					meta={`${mine.length} viagem${mine.length === 1 ? '' : 's'} publicada${mine.length === 1 ? '' : 's'}`}
				/>
				<ScrollView
					className="flex-1 mt-4"
					contentContainerStyle={{ paddingBottom: 48 }}
					showsVerticalScrollIndicator={false}
				>
					{mine.map((ride) => (
						<View key={ride.id} className="mb-4">
							<TripStripCard
								ride={ride}
								onPress={() =>
									navigation.navigate('DriverTrip', {
										rideId: ride.id,
									})
								}
							/>
							<Text
								className="font-sansMedium text-body-xs mt-1.5 ml-1"
								style={{ color: themeColors.secondary }}
							>
								Toca para gerir a viagem e responder aos
								pedidos.
							</Text>
						</View>
					))}
				</ScrollView>
			</View>
		</SafeAreaView>
	);
}
