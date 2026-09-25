import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
	BoleiaMainStackParamList,
	PassengerTabsParamList,
} from '../../types/navigation';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useSessionUserId } from '../../hooks/useSessionUser';
import { useDbStore } from '../../mock/db';
import { rideMode, RideMode } from '../../mock/repos/rideRepo';
import TripListingCard from '../../components/TripListingCard';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import GroupLabel from '../../components/GroupLabel';

// Montra de todas as viagens ativas ainda não iniciadas — sem depender da
// pesquisa. Filtros e ordenação são client-side; cada cartão leva ao detalhe.
type ModeFilter = 'all' | RideMode;
type Sort = 'soon' | 'cheap';

function dayLabel(iso: string): string {
	const d = new Date(iso);
	const now = new Date();
	const startOf = (x: Date) =>
		new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
	const diff = Math.round((startOf(d) - startOf(now)) / 86400000);
	if (diff <= 0) return 'Hoje';
	if (diff === 1) return 'Amanhã';
	const label = d.toLocaleDateString('pt-PT', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
	});
	return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function ExploreScreen() {
	const { themeColors } = useThemeColors();
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'Main'>
		>();
	const tabNavigation =
		useNavigation<BottomTabNavigationProp<PassengerTabsParamList>>();
	const rides = useDbStore((s) => s.db.rides);
	const bookings = useDbStore((s) => s.db.bookings);
	const sessionUserId = useSessionUserId();
	const [modeFilter, setModeFilter] = useState<ModeFilter>('all');
	const [sort, setSort] = useState<Sort>('soon');

	const reservedIds = useMemo(
		() =>
			new Set(
				bookings
					.filter(
						(b) =>
							b.passengerId === sessionUserId &&
							b.status !== 'cancelada',
					)
					.map((b) => b.rideId),
			),
		[bookings, sessionUserId],
	);

	const upcoming = useMemo(
		() =>
			rides
				.filter(
					(r) =>
						r.status === 'programada' &&
						r.seatsTaken < r.seatsTotal &&
						Date.parse(r.departure) > Date.now() &&
						(modeFilter === 'all' || rideMode(r) === modeFilter),
				)
				.sort((a, b) =>
					sort === 'cheap'
						? a.pricePerSeat - b.pricePerSeat
						: Date.parse(a.departure) - Date.parse(b.departure),
				)
				.map((ride) => ({
					ride,
					reserved: reservedIds.has(ride.id),
				})),
		[rides, reservedIds, modeFilter, sort],
	);

	const groups = useMemo(() => {
		const map = new Map<string, typeof upcoming>();
		for (const x of upcoming) {
			const label = dayLabel(x.ride.departure);
			const list = map.get(label) ?? [];
			list.push(x);
			map.set(label, list);
		}
		return [...map.entries()];
	}, [upcoming]);

	const chip = (label: string, active: boolean, onPress: () => void) => (
		<Pressable
			key={label}
			onPress={onPress}
			className="rounded-full px-3 py-1.5 mr-2"
			style={{
				backgroundColor: active
					? themeColors.text
					: themeColors.background,
			}}
		>
			<Text
				className="font-sansMedium text-body-xs"
				style={{
					color: active ? themeColors.card : themeColors.secondary,
				}}
			>
				{label}
			</Text>
		</Pressable>
	);

	return (
		<SafeAreaView
			className="flex-1 px-5"
			style={{ backgroundColor: themeColors.background }}
		>
			<ScreenHeader
				title="Viagens a bater certo"
				meta={
					upcoming.length > 0
						? `${upcoming.length} embarque${upcoming.length === 1 ? '' : 's'} a seguir`
						: null
				}
			/>

			<View className="flex-row mt-4 mb-2">
				{chip('Todas', modeFilter === 'all', () =>
					setModeFilter('all'),
				)}
				{chip('Interprovincial', modeFilter === 'interprovincial', () =>
					setModeFilter('interprovincial'),
				)}
				{chip('Intermunicipal', modeFilter === 'intermunicipal', () =>
					setModeFilter('intermunicipal'),
				)}
			</View>
			<View className="flex-row items-center mb-1">
				<Text
					className="font-sansMedium text-body-xs mr-2"
					style={{ color: themeColors.secondary }}
				>
					Ordenar
				</Text>
				{(
					[
						{ key: 'soon', label: 'Mais cedo' },
						{ key: 'cheap', label: 'Mais barato' },
					] as const
				).map((opt) => (
					<Pressable key={opt.key} onPress={() => setSort(opt.key)}>
						<Text
							className="font-sansBold text-body-xs mr-3"
							style={{
								color:
									sort === opt.key
										? themeColors.laterite
										: themeColors.secondary,
							}}
						>
							{opt.label}
						</Text>
					</Pressable>
				))}
			</View>

			{upcoming.length === 0 ? (
				<View className="flex-1 justify-center pb-10">
					<EmptyState
						icon="compass-outline"
						title="Sem viagens ativas por agora"
						copy="Quando alguém publicar uma viagem, aparece aqui. Usa a pesquisa na Home para afinar a tua rota."
						actionTitle="Pesquisar na Home"
						onAction={() => tabNavigation.navigate('PassengerHome')}
					/>
				</View>
			) : (
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ paddingBottom: 40 }}
				>
					{groups.map(([day, items]) => (
						<View key={day}>
							<View className="flex-row items-center mt-4 mb-3">
								<View className="flex-1">
									<GroupLabel>{day}</GroupLabel>
								</View>
								<Text
									className="font-sansMedium text-body-xs ml-3"
									style={{ color: themeColors.secondary }}
								>
									{items.length}
								</Text>
							</View>
							{items.map(({ ride, reserved }) => (
								<View key={ride.id} className="mb-4">
									<TripListingCard
										ride={ride}
										reserved={reserved}
										onPress={() =>
											navigation.navigate('RideDetail', {
												rideId: ride.id,
											})
										}
									/>
								</View>
							))}
						</View>
					))}
				</ScrollView>
			)}
		</SafeAreaView>
	);
}
