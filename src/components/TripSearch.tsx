import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../types/navigation';
import LocalityPicker from './LocalityPicker';
import DateRangePicker from './DateRangePicker';
import TripListingCard from './TripListingCard';
import BoleiaButton from './BoleiaButton';
import Eyebrow from './Eyebrow';
import { searchRides, RideMode } from '../mock/repos/rideRepo';
import { Ride } from '../types/boleia';
import { localityById, LOCALITIES } from '../mock/locale';
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

	const [mode, setMode] = useState<RideMode>('interprovincial');
	const [province, setProvince] = useState('');
	const [from, setFrom] = useState('');
	const [to, setTo] = useState('');
	const [dateFrom, setDateFrom] = useState('');
	const [dateTo, setDateTo] = useState('');
	const [results, setResults] = useState<Ride[] | null>(null);
	const [recents, setRecents] = useState<RecentSearch[]>([]);
	useEffect(() => {
		loadRecentSearches()
			.then(setRecents)
			.catch(() => undefined);
	}, []);

	const changeMode = (m: RideMode) => {
		if (m === mode) return;
		setMode(m);
		setProvince('');
		setFrom('');
		setTo('');
		setResults(null);
	};

	const selectProvince = (p: string) => {
		setProvince(p);
		setFrom('');
		setTo('');
		setResults(null);
	};

	const selectFrom = (v: string) => {
		setFrom(v);
		setResults(null);
	};

	const selectTo = (v: string) => {
		setTo(v);
		setResults(null);
	};

	const swapEnds = () => {
		const f = from;
		setFrom(to);
		setTo(f);
		setResults(null);
	};

	type SearchParams = {
		mode: RideMode;
		province: string;
		from: string;
		to: string;
		dateFrom: string;
		dateTo: string;
	};

	const runSearch = (p: SearchParams): Ride[] => {
		const base = {
			dateFrom: p.dateFrom || undefined,
			dateTo: p.dateTo || undefined,
			mode: p.mode,
		};
		return p.mode === 'interprovincial'
			? searchRides({ from: p.from, to: p.to, ...base })
			: searchRides({
					from: localityById(p.from).municipality,
					to: localityById(p.to).municipality,
					...base,
				});
	};

	const search = () => {
		const params = { mode, province, from, to, dateFrom, dateTo };
		setResults(runSearch(params));
		saveRecentSearch(params)
			.then(setRecents)
			.catch(() => undefined);
	};

	const applyRecent = (r: RecentSearch) => {
		setMode(r.mode);
		setProvince(r.province);
		setFrom(r.from);
		setTo(r.to);
		setDateFrom(r.dateFrom);
		setDateTo(r.dateTo);
		setResults(runSearch(r));
	};

	const placeName = (value: string, m: RideMode): string => {
		if (!value) return '—';
		if (m === 'intermunicipal') {
			return (
				LOCALITIES.find((l) => l.id === value)?.municipality ?? value
			);
		}
		return value;
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

	const canSearch =
		mode === 'interprovincial'
			? !!from && !!to
			: !!province && !!from && !!to;

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

	const provRow = (kind: 'from' | 'to', label: string, value: string) => (
		<LocalityPicker
			variant="row"
			scope="province"
			label={label}
			dotColor={
				kind === 'from' ? themeColors.primary : themeColors.laterite
			}
			value={value}
			onChange={kind === 'from' ? selectFrom : selectTo}
			exclude={kind === 'from' ? to : from}
		/>
	);

	const munRow = (kind: 'from' | 'to', label: string, value: string) => (
		<LocalityPicker
			variant="row"
			scope="municipality"
			label={label}
			dotColor={
				kind === 'from' ? themeColors.primary : themeColors.laterite
			}
			value={value}
			onChange={kind === 'from' ? selectFrom : selectTo}
			exclude={kind === 'from' ? to : from}
			filter={(l) => l.province === province}
		/>
	);

	const fromRow =
		mode === 'interprovincial'
			? provRow('from', 'De onde sais', from)
			: munRow('from', 'De onde sais', from);
	const toRow =
		mode === 'interprovincial'
			? provRow('to', 'Para onde vais', to)
			: munRow('to', 'Para onde vais', to);

	return (
		<View>
			<View
				className="rounded-3xl overflow-hidden p-5"
				style={{
					backgroundColor: themeColors.card,
					shadowColor: '#000',
					shadowOpacity: 0.1,
					shadowOffset: { width: 0, height: 6 },
					shadowRadius: 16,
					elevation: 4,
				}}
			>
				<View className="flex-row items-center justify-between">
					<View className="flex-1 mr-3">
						<Text
							className="font-display text-[24px] leading-7"
							style={{ color: themeColors.text }}
						>
							Aonde vamos?
						</Text>
						<Text
							className="font-sans text-[13px] mt-0.5"
							style={{ color: themeColors.secondary }}
						>
							Escolhe a rota e o dia — nós tratamos do resto.
						</Text>
					</View>
					<View
						className="w-11 h-11 rounded-full items-center justify-center"
						style={{ backgroundColor: themeColors.background }}
					>
						<Ionicons
							name="navigate"
							size={20}
							color={themeColors.laterite}
						/>
					</View>
				</View>

				<View
					className="flex-row rounded-full p-1 mt-4"
					style={{ backgroundColor: themeColors.background }}
				>
					{(
						[
							{
								mode: 'intermunicipal',
								label: 'Intermunicipal',
								icon: 'navigate',
							},
							{
								mode: 'interprovincial',
								label: 'Interprovincial',
								icon: 'map',
							},
						] as {
							mode: RideMode;
							label: string;
							icon: 'navigate' | 'map';
						}[]
					).map((opt) => {
						const active = mode === opt.mode;
						return (
							<Pressable
								key={opt.mode}
								onPress={() => changeMode(opt.mode)}
								className="flex-1 rounded-full py-2.5 flex-row items-center justify-center"
								style={{
									backgroundColor: active
										? themeColors.text
										: 'transparent',
								}}
							>
								<Ionicons
									name={opt.icon}
									size={14}
									color={
										active
											? themeColors.card
											: themeColors.secondary
									}
								/>
								<Text
									className="font-sansBold text-[12px] ml-1.5"
									style={{
										color: active
											? themeColors.card
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
							<LocalityPicker
								variant="row"
								scope="province"
								label="Província"
								dotColor={themeColors.primary}
								value={province}
								onChange={selectProvince}
							/>
							{connector}
						</>
					) : null}
					{fromRow}
					<View className="flex-row items-center">
						<View className="flex-1">{connector}</View>
						<Pressable
							onPress={swapEnds}
							disabled={!from && !to}
							className="w-9 h-9 rounded-full items-center justify-center my-0.5"
							style={{
								backgroundColor: themeColors.background,
								opacity: !from && !to ? 0.4 : 1,
							}}
						>
							<Ionicons
								name="swap-vertical"
								size={18}
								color={themeColors.laterite}
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
						title="Procurar viagens"
						onPress={search}
						disabled={!canSearch}
					/>
				</View>
			</View>

			{/* Recentes */}
			{!results && recents.length > 0 ? (
				<View className="mt-5">
					<Eyebrow>Recentes</Eyebrow>
					<View className="mt-3">
						{recents.map((r) => (
							<Pressable
								key={`${r.mode}|${r.from}|${r.to}|${r.dateFrom}|${r.dateTo}`}
								onPress={() => applyRecent(r)}
								className="rounded-2xl px-4 py-3 mb-2 flex-row items-center"
								style={({ pressed }) => ({
									backgroundColor: themeColors.background,
									opacity: pressed ? 0.8 : 1,
								})}
							>
								<View className="flex-1">
									<Text
										numberOfLines={1}
										className="font-sansBold text-[14px]"
										style={{ color: themeColors.text }}
									>
										{placeName(r.from, r.mode)} →{' '}
										{placeName(r.to, r.mode)}
									</Text>
									<Text
										className="font-mono text-[10px] mt-0.5"
										style={{
											color: themeColors.secondary,
										}}
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
				</View>
			) : null}

			{/* Resultados */}
			{results ? (
				<View className="mt-6">
					<Text
						className="font-display text-[20px] mb-4"
						style={{ color: themeColors.text }}
					>
						{`${results.length} viagem${results.length === 1 ? '' : 'ens'} a bater certo`}
					</Text>
					{results.length === 0 ? (
						<View
							className="rounded-3xl p-5"
							style={{
								backgroundColor: themeColors.background,
							}}
						>
							<Text
								className="font-sans text-[13px] leading-5"
								style={{ color: themeColors.secondary }}
							>
								Sem viagens a bater certo nesta rota.
								Experimenta{' '}
								{mode === 'intermunicipal'
									? 'outros municípios da mesma província'
									: 'outra rota entre províncias'}{' '}
								ou outro intervalo de dias.
							</Text>
						</View>
					) : (
						results.map((ride) => (
							<View key={ride.id} className="mb-4">
								<TripListingCard
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
				</View>
			) : null}
		</View>
	);
}
