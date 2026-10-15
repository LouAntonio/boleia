import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
	BoleiaMainStackParamList,
	PassengerTabsParamList,
} from '../../types/navigation';
import { qk } from '../../lib/queryKeys';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useSessionUserId } from '../../hooks/useSessionUser';
import { listMyBookings, listRides } from '../../lib/api';
import { fmtDayMonth, fmtWeekdayShort } from '../../lib/format';
import { toRide } from '../../lib/rideMapper';
import TripListingCard from '../../components/TripListingCard';
import ScreenHeader from '../../components/ScreenHeader';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import GroupLabel from '../../components/GroupLabel';

// Montra de todas as viagens ativas ainda não iniciadas — sem depender da
// pesquisa. A listagem e a ordenação vêm do backend; aqui só se decide se
// mostro mais caras primeiro.
type Sort = 'soon' | 'cheap';

function dayLabel(iso: string): string {
	const d = new Date(iso);
	const now = new Date();
	const startOf = (x: Date) =>
		new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
	const diff = Math.round((startOf(d) - startOf(now)) / 86400000);
	if (diff <= 0) return 'Hoje';
	if (diff === 1) return 'Amanhã';
	// "Sex, 12 mar" — escrito à mão porque o ICU do Hermes não garante PT.
	const label = `${fmtWeekdayShort(d)}, ${fmtDayMonth(d)}`;
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
	const sessionUserId = useSessionUserId();
	const [sort, setSort] = useState<Sort>('soon');

	// O backend já devolve só corridas agendadas, com lugares livres e dentro da
	// janela de pesquisa, ordenadas por partida.
	const { data: page, isLoading } = useQuery({
		queryKey: qk.rides.search({ limit: 50 }),
		queryFn: () => listRides({ limit: 50 }),
	});

	const { data: myBookings } = useQuery({
		queryKey: qk.myBookings.all,
		queryFn: listMyBookings,
		enabled: !!sessionUserId,
	});

	const reservedIds = useMemo(
		() =>
			new Set(
				(myBookings ?? [])
					.filter((b) => b.status !== 'CANCELLED')
					.map((b) => b.rideId),
			),
		[myBookings],
	);

	const upcoming = useMemo(() => {
		const rows = (page?.rows ?? []).map(toRide);
		return (
			sort === 'cheap'
				? [...rows].sort((a, b) => a.pricePerSeat - b.pricePerSeat)
				: rows
		).map((ride) => ({
			ride,
			reserved: reservedIds.has(ride.id),
		}));
	}, [page, sort, reservedIds]);

	/**
	 * Filtros que o backend sustenta.
	 *
	 * Antes havia um chip "Interprovincial / Intermunicipal", que dependia de
	 * comparar as províncias das paragens — informação que o payload da corrida
	 * não traz. Um filtro que depende de dados que não temos é um filtro que
	 * mente, por isso ficou só o que dá para saber: se ainda há lugares e se a
	 * rota tem paragens pelo caminho.
	 */
	const [onlyWithSeats, setOnlyWithSeats] = useState(true);
	const [onlyDirect, setOnlyDirect] = useState(false);

	const filtered = useMemo(
		() =>
			upcoming.filter((x) => {
				if (onlyWithSeats && x.ride.seatsTaken >= x.ride.seatsTotal) {
					return false;
				}
				if (onlyDirect && x.ride.stops.length > 0) {
					return false;
				}
				return true;
			}),
		[upcoming, onlyWithSeats, onlyDirect],
	);

	const grouped = useMemo(() => {
		const map = new Map<string, typeof filtered>();
		for (const x of filtered) {
			const label = dayLabel(x.ride.departure);
			const list = map.get(label) ?? [];
			list.push(x);
			map.set(label, list);
		}
		return [...map.entries()];
	}, [filtered]);

	const chip = (label: string, active: boolean, onPress: () => void) => (
		<Pressable
			key={label}
			onPress={onPress}
			className="rounded-full px-3 py-1.5 mr-2 min-h-[32px] justify-center"
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
			<AppHeader />

			<ScreenHeader
				title="Viagens a bater certo"
				meta={
					upcoming.length > 0
						? `${upcoming.length} embarque${upcoming.length === 1 ? '' : 's'} a seguir`
						: null
				}
			/>

			<View className="flex-row mt-4 mb-2">
				{chip('Com lugares', onlyWithSeats, () =>
					setOnlyWithSeats((v) => !v),
				)}
				{chip('Direto, sem paragens', onlyDirect, () =>
					setOnlyDirect((v) => !v),
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
										? themeColors.primary
										: themeColors.secondary,
							}}
						>
							{opt.label}
						</Text>
					</Pressable>
				))}
			</View>

			{isLoading ? (
				<View className="flex-1 justify-center pb-10">
					<Text
						className="font-sans text-body-small text-center"
						style={{ color: themeColors.secondary }}
					>
						A procurar viagens…
					</Text>
				</View>
			) : filtered.length === 0 ? (
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
					{grouped.map(([day, items]) => (
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
