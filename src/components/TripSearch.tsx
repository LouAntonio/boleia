import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../types/navigation';
import LocalityPicker from './LocalityPicker';
import DateRangePicker from './DateRangePicker';
import TripStripCard from './TripStripCard';
import BoleiaButton from './BoleiaButton';
import { searchRides, RideMode } from '../mock/repos/rideRepo';
import { Ride } from '../types/boleia';
import { localityById } from '../mock/locale';

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

	const search = () => {
		const base = {
			dateFrom: dateFrom || undefined,
			dateTo: dateTo || undefined,
			mode,
		};
		setResults(
			mode === 'interprovincial'
				? searchRides({ from, to, ...base })
				: searchRides({
						from: localityById(from).municipality,
						to: localityById(to).municipality,
						...base,
					}),
		);
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

	return (
		<View>
			{/* Bilhete de pesquisa */}
			<View
				className="rounded-3xl border overflow-hidden"
				style={{
					borderColor: themeColors.border,
					backgroundColor: themeColors.card,
				}}
			>
				<View className="px-4 pt-4">
					<View className="flex-row items-center justify-between">
						<Text
							className="font-display text-[19px]"
							style={{ color: themeColors.text }}
						>
							Aonde vamos?
						</Text>
						<Ionicons
							name="navigate-outline"
							size={20}
							color={themeColors.laterite}
						/>
					</View>

					<View className="flex-row rounded-full p-1 border mt-3">
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
									className="flex-1 rounded-full py-2 flex-row items-center justify-center"
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
										className="font-sansMedium text-[12px] ml-1.5"
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
				</View>

				<View
					className="px-4 mt-2 border-t"
					style={{ borderColor: themeColors.border }}
				>
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
					{mode === 'interprovincial' ? (
						<>
							{provRow('from', 'De onde sais', from)}
							{connector}
							{provRow('to', 'Para onde vais', to)}
						</>
					) : (
						<>
							{munRow('from', 'De onde sais', from)}
							{connector}
							{munRow('to', 'Para onde vais', to)}
						</>
					)}
				</View>

				{/* Perfuração do bilhete */}
				<View className="relative">
					<View
						className="absolute -left-3 top-1/2 -mt-3 w-6 h-6 rounded-full"
						style={{ backgroundColor: themeColors.background }}
					/>
					<View
						className="border-t mx-2"
						style={{
							borderColor: themeColors.border,
							borderStyle: 'dashed',
						}}
					/>
					<View
						className="absolute -right-3 top-1/2 -mt-3 w-6 h-6 rounded-full"
						style={{ backgroundColor: themeColors.background }}
					/>
				</View>

				<View className="px-4 pt-1">
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

				<View className="p-4">
					<BoleiaButton
						title="Procurar viagens"
						onPress={search}
						disabled={!canSearch}
					/>
				</View>
			</View>

			{/* Resultados */}
			{results ? (
				<View className="mt-6">
					<Text
						className="font-display text-[18px] mb-3"
						style={{ color: themeColors.text }}
					>
						{`${results.length} viagem${results.length === 1 ? '' : 'ens'} a bater certo`}
					</Text>
					{results.length === 0 ? (
						<View
							className="rounded-2xl border p-4"
							style={{
								borderColor: themeColors.border,
								backgroundColor: themeColors.card,
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
				</View>
			) : null}
		</View>
	);
}
