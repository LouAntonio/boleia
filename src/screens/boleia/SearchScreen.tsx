import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import LocalityPicker from '../../components/LocalityPicker';
import SectionTitle from '../../components/SectionTitle';
import TripStripCard from '../../components/TripStripCard';
import BoleiaButton from '../../components/BoleiaButton';
import { searchRides, nextDays } from '../../mock/repos/rideRepo';
import { Ride } from '../../types/boleia';
import { localityById } from '../../mock/locale';

export default function SearchScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'Main'>
		>();
	const { themeColors } = useThemeColors();
	const [from, setFrom] = useState('');
	const [to, setTo] = useState('');
	const [date, setDate] = useState('');
	const [results, setResults] = useState<Ride[]>(() => searchRides({}));
	const days = nextDays(4);

	const search = () => {
		setResults(
			searchRides({
				from: from ? localityById(from).municipality : undefined,
				to: to ? localityById(to).municipality : undefined,
				date: date || undefined,
			}),
		);
	};

	return (
		<SafeAreaView
			className="flex-1 px-5"
			style={{ backgroundColor: themeColors.background }}
		>
			<Text
				className="font-display text-[22px] mb-4 mt-2"
				style={{ color: themeColors.text }}
			>
				Pesquisar boleias
			</Text>

			<Text
				className="font-sansMedium text-[12px] uppercase tracking-wider mb-1.5"
				style={{ color: themeColors.laterite }}
			>
				Partida
			</Text>
			<LocalityPicker value={from} onChange={setFrom} exclude={to} />
			<Text
				className="font-sansMedium text-[12px] uppercase tracking-wider mb-1.5 mt-3"
				style={{ color: themeColors.laterite }}
			>
				Destino
			</Text>
			<LocalityPicker value={to} onChange={setTo} exclude={from} />

			<Text
				className="font-sansMedium text-[12px] uppercase tracking-wider mb-1.5 mt-4"
				style={{ color: themeColors.laterite }}
			>
				Dia
			</Text>
			<View className="flex-row flex-wrap">
				{days.map((d) => {
					const active = d === date;
					return (
						<Pressable
							key={d}
							onPress={() => setDate(active ? '' : d)}
							className="rounded-full px-3 py-1.5 border mr-2 mb-2"
							style={{
								borderColor: active
									? themeColors.text
									: themeColors.border,
								backgroundColor: active
									? themeColors.text
									: themeColors.card,
							}}
						>
							<Text
								className="font-sansMedium text-[12px]"
								style={{
									color: active
										? themeColors.card
										: themeColors.secondary,
								}}
							>
								{new Date(d).toLocaleDateString('pt-PT', {
									weekday: 'short',
									day: 'numeric',
								})}
							</Text>
						</Pressable>
					);
				})}
			</View>

			<View className="mt-4 mb-5">
				<BoleiaButton title="Pesquisar" onPress={search} />
			</View>

			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				<SectionTitle>
					{`${results.length} viagem${results.length === 1 ? '' : 'ens'}`}
				</SectionTitle>
				{results.length === 0 ? (
					<Text
						className="font-sans text-[13px]"
						style={{ color: themeColors.secondary }}
					>
						Sem viagens a bater certo. Experimenta outra data ou
						rota.
					</Text>
				) : (
					results.map((ride) => (
						<View key={ride.id} className="mb-4">
							<TripStripCard
								ride={ride}
								onPress={() =>
									navigation.navigate('RideDetail', {
										rideId: ride.id,
									})
								}
							/>
						</View>
					))
				)}
			</ScrollView>
		</SafeAreaView>
	);
}
