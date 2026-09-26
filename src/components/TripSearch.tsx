import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../types/navigation';
import LocalityPicker from './LocalityPicker';
import DateRangePicker from './DateRangePicker';
import TripListingCard from './TripListingCard';
import BoleiaButton from './BoleiaButton';
import Card from './Card';
import { listRides, apiErrorMessage, type ApiRide } from '../lib/api';
import { toRide } from '../lib/rideMapper';
import { useAllLocalities, useProvinces } from '../hooks/useLocalities';
import {
	loadRecentSearches,
	saveRecentSearch,
	RecentSearch,
} from '../lib/recentSearches';

export default function TripSearch() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'Main'>
		>();
	const { themeColors } = useThemeColors();

	const [mode, setMode] = useState<'intermunicipal' | 'interprovincial'>(
		'interprovincial',
	);
	const [provinceId, setProvinceId] = useState('');
	const [from, setFrom] = useState('');
	const [to, setTo] = useState('');
	const [dateFrom, setDateFrom] = useState('');
	const [dateTo, setDateTo] = useState('');
	const [results, setResults] = useState<ApiRide[] | null>(null);
	const [total, setTotal] = useState(0);
	const [searching, setSearching] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [recents, setRecents] = useState<RecentSearch[]>([]);

	const provinces = useProvinces();
	const localities = useAllLocalities();

	useEffect(() => {
		loadRecentSearches()
			.then(setRecents)
			.catch(() => undefined);
	}, []);

	const localityName = useCallback(
		(id: string): string => {
			if (!id) return '—';
			const found = localities.find((l) => l.id === id);
			return found ? found.municipality : '—';
		},
		[localities],
	);

	const changeMode = (m: 'intermunicipal' | 'interprovincial') => {
		if (m === mode) return;
		setMode(m);
		setProvinceId('');
		setFrom('');
		setTo('');
		setResults(null);
		setError(null);
	};

	const selectProvince = (id: string) => {
		setProvinceId(id);
		setFrom('');
		setTo('');
		setResults(null);
		setError(null);
	};

	const selectFrom = (v: string) => {
		setFrom(v);
		setResults(null);
		setError(null);
	};

	const selectTo = (v: string) => {
		setTo(v);
		setResults(null);
		setError(null);
	};

	const swapEnds = () => {
		const f = from;
		setFrom(to);
		setTo(f);
		setResults(null);
		setError(null);
	};

	/**
	 * Pesquisa no backend.
	 *
	 * O filtro é sempre por localidade, nos dois modos: `GET /api/rides`
	 * compara o `localityId` da paragem de origem e de destino. O modo só muda
	 * se a picker de origem fica restringida a uma província, que é a diferença
	 * real entre uma viagem intermunicipal e uma interprovincial.
	 */
	const runSearch = useCallback(
		async (p: {
			provinceId: string;
			from: string;
			to: string;
			dateFrom: string;
			dateTo: string;
		}) => {
			setSearching(true);
			setError(null);
			try {
				const res = await listRides({
					origin: p.from,
					destination: p.to,
					dateFrom: p.dateFrom || undefined,
					dateTo: p.dateTo || undefined,
				});
				setResults(res.rows);
				setTotal(res.total);
			} catch (err) {
				setResults(null);
				setError(
					apiErrorMessage(err, 'Não foi possível procurar viagens.'),
				);
			} finally {
				setSearching(false);
			}
		},
		[],
	);

	const search = () => {
		void runSearch({ provinceId, from, to, dateFrom, dateTo });
		saveRecentSearch({ mode, provinceId, from, to, dateFrom, dateTo })
			.then(setRecents)
			.catch(() => undefined);
	};

	const applyRecent = (r: RecentSearch) => {
		setMode(r.mode);
		setProvinceId(r.provinceId ?? '');
		setFrom(r.from);
		setTo(r.to);
		setDateFrom(r.dateFrom);
		setDateTo(r.dateTo);
		void runSearch({
			provinceId: r.provinceId ?? '',
			from: r.from,
			to: r.to,
			dateFrom: r.dateFrom,
			dateTo: r.dateTo,
		});
	};

	const placeName = (
		value: string,
		m: 'intermunicipal' | 'interprovincial',
	) => {
		if (!value) return '—';
		if (m === 'intermunicipal') {
			return localityName(value);
		}
		return localityName(value);
	};

	const recentDateLabel = (r: RecentSearch): string => {
		if (!r.dateFrom) return 'Qualquer dia';
		const fmt = (iso: string) =>
			new Date(`${iso}T00:00:00`).toLocaleDateString('pt-PT', {
				day: 'numeric',
				month: 'short',
			});
		return r.dateTo && r.dateTo !== r.dateFrom
			? `${fmt(r.dateFrom)} → ${fmt(r.dateTo)}`
			: fmt(r.dateFrom);
	};

	const canSearch = !!from && !!to && !searching;

	const connector = (
		<View
			className="ml-[5px] h-3"
			style={{
				borderLeftWidth: 2,
				borderStyle: 'dashed',
				borderLeftColor: themeColors.border,
			}}
		/>
	);

	const munRow = (kind: 'from' | 'to', label: string, value: string) => (
		<LocalityPicker
			variant="row"
			label={label}
			dotColor={kind === 'from' ? themeColors.text : themeColors.primary}
			value={value}
			onChange={kind === 'from' ? selectFrom : selectTo}
			exclude={kind === 'from' ? to : from}
			// No modo intermunicipal só faz sentido escolher dentro da província
			// escolhida, senão a pesquisa devolveria rotas que a UI promete não ter.
			restrictToProvinceId={mode === 'intermunicipal' ? provinceId : null}
		/>
	);

	// Nos dois modos a escolha é por município; o modo intermunicipal apenas
	// restringe a picker a uma província.
	const fromRow = munRow('from', 'De onde sais', from);
	const toRow = munRow('to', 'Para onde vais', to);

	return (
		<View>
			<Card>
				<View className="flex-row items-center justify-between">
					<View className="flex-1 mr-3">
						<Text
							className="font-sansExtraBold text-title-secondary"
							style={{ color: themeColors.text }}
						>
							Aonde vamos?
						</Text>
						<Text
							className="font-sans text-body-small mt-1"
							style={{ color: themeColors.secondary }}
						>
							Escolhe a rota e o dia — nós tratamos do resto.
						</Text>
					</View>
					<View
						className="w-11 h-11 rounded-full items-center justify-center"
						style={{ backgroundColor: themeColors.accentWeak }}
					>
						<Ionicons
							name="navigate"
							size={20}
							color={themeColors.primary}
						/>
					</View>
				</View>

				<View
					className="flex-row rounded-full p-1 mt-4"
					style={{ backgroundColor: themeColors.background }}
				>
					{[
						{
							mode: 'intermunicipal' as const,
							label: 'Intermunicipal',
							icon: 'navigate' as const,
						},
						{
							mode: 'interprovincial' as const,
							label: 'Interprovincial',
							icon: 'map' as const,
						},
					].map((opt) => {
						const active = mode === opt.mode;
						return (
							<Pressable
								key={opt.mode}
								onPress={() => changeMode(opt.mode)}
								className="flex-1 rounded-full min-h-[44px] flex-row items-center justify-center"
								style={{
									backgroundColor: active
										? themeColors.primary
										: 'transparent',
								}}
							>
								<Ionicons
									name={opt.icon}
									size={14}
									color={
										active
											? themeColors.onPrimary
											: themeColors.secondary
									}
								/>
								<Text
									className="font-sansBold text-body-small ml-1.5"
									style={{
										color: active
											? themeColors.onPrimary
											: themeColors.secondary,
									}}
								>
									{opt.label}
								</Text>
							</Pressable>
						);
					})}
				</View>

				<View className="mt-4">
					{mode === 'intermunicipal' ? (
						<>
							<View className="flex-row items-center py-3">
								<View className="w-6 items-center">
									<View
										className="w-3 h-3 rounded-full"
										style={{
											backgroundColor:
												themeColors.primary,
										}}
									/>
								</View>
								<View className="flex-1 ml-3">
									<Text
										className="font-sansMedium text-body-xs"
										style={{ color: themeColors.secondary }}
									>
										Província
									</Text>
									<ScrollView
										horizontal
										showsHorizontalScrollIndicator={false}
										className="mt-1"
									>
										{(provinces.data ?? []).map((p) => {
											const active = provinceId === p.id;
											return (
												<Pressable
													key={p.id}
													onPress={() =>
														selectProvince(
															active ? '' : p.id,
														)
													}
													className="rounded-full px-3 py-1 border mr-2 min-h-[32px] justify-center"
													style={{
														borderColor: active
															? themeColors.primary
															: themeColors.border,
														backgroundColor: active
															? themeColors.primary
															: themeColors.card,
													}}
												>
													<Text
														className="font-sansMedium text-body-xs"
														style={{
															color: active
																? themeColors.onPrimary
																: themeColors.secondary,
														}}
													>
														{p.name}
													</Text>
												</Pressable>
											);
										})}
									</ScrollView>
								</View>
							</View>
							{connector}
						</>
					) : null}
					{fromRow}
					<View className="flex-row items-center">
						<View className="flex-1">{connector}</View>
						<Pressable
							onPress={swapEnds}
							disabled={!from && !to}
							className="w-11 h-11 rounded-full items-center justify-center"
							style={{
								backgroundColor: themeColors.background,
								opacity: !from && !to ? 0.4 : 1,
							}}
						>
							<Ionicons
								name="swap-vertical"
								size={18}
								color={themeColors.primary}
							/>
						</Pressable>
					</View>
					{toRow}
				</View>

				<View className="mt-4">
					<DateRangePicker
						valueFrom={dateFrom}
						valueTo={dateTo}
						onChange={(f, t) => {
							setDateFrom(f);
							setDateTo(t);
							setResults(null);
						}}
					/>
				</View>

				<View className="mt-5">
					<BoleiaButton
						title={searching ? 'A procurar…' : 'Procurar viagens'}
						onPress={search}
						disabled={!canSearch}
					/>
				</View>
			</Card>

			{/* Recentes */}
			{!results && recents.length > 0 ? (
				<View className="mt-6">
					<Text
						className="font-sansMedium text-title-tertiary mb-2"
						style={{ color: themeColors.text }}
					>
						Recentes
					</Text>
					{recents.map((r) => (
						<Pressable
							key={`${r.mode}|${r.from}|${r.to}|${r.dateFrom}|${r.dateTo}`}
							onPress={() => applyRecent(r)}
							className="rounded-xl px-4 py-3 mb-2 flex-row items-center min-h-[44px]"
							style={({ pressed }) => ({
								backgroundColor: themeColors.card,
								opacity: pressed ? 0.8 : 1,
								borderWidth: 1,
								borderColor: themeColors.border,
							})}
						>
							<View className="flex-1">
								<Text
									numberOfLines={1}
									className="font-sansBold text-label-small"
									style={{ color: themeColors.text }}
								>
									{placeName(r.from, r.mode)} →{' '}
									{placeName(r.to, r.mode)}
								</Text>
								<Text
									className="font-sans text-body-xs mt-0.5"
									style={{ color: themeColors.secondary }}
								>
									{r.mode === 'interprovincial'
										? 'Interprovincial'
										: 'Intermunicipal'}{' '}
									· {recentDateLabel(r)}
								</Text>
							</View>
							<Ionicons
								name="chevron-forward"
								size={18}
								color={themeColors.secondary}
							/>
						</Pressable>
					))}
				</View>
			) : null}

			{/* Erro */}
			{error ? (
				<View className="mt-6">
					<Card>
						<Text
							className="font-sans text-body-small"
							style={{ color: themeColors.secondary }}
						>
							{error}
						</Text>
					</Card>
				</View>
			) : null}

			{/* Resultados */}
			{results ? (
				<View className="mt-6">
					<Text
						className="font-sansMedium text-title-tertiary mb-3"
						style={{ color: themeColors.text }}
					>
						{`${total} viagem${total === 1 ? '' : 'ens'} a bater certo`}
					</Text>
					{results.length === 0 ? (
						<Card>
							<Text
								className="font-sans text-body-small"
								style={{ color: themeColors.secondary }}
							>
								Sem viagens a bater certo nesta rota.
								Experimenta{' '}
								{mode === 'intermunicipal'
									? 'outros municípios da mesma província'
									: 'outra rota entre províncias'}{' '}
								ou outro intervalo de dias.
							</Text>
						</Card>
					) : (
						results.map((ride) => (
							<View key={ride.id} className="mb-3">
								<TripListingCard
									ride={toRide(ride)}
									onPress={() =>
										navigation.navigate('RideDetail', {
											rideId: ride.id,
										})
									}
								/>
							</View>
						))
					)}
				</View>
			) : null}
		</View>
	);
}
