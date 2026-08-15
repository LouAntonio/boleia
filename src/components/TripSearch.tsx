import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../types/navigation';
import LocalityPicker from './LocalityPicker';
import TripStripCard from './TripStripCard';
import BoleiaButton from './BoleiaButton';
import { searchRides, nextDays, RideMode } from '../mock/repos/rideRepo';
import { Ride } from '../types/boleia';
import { localityById } from '../mock/locale';

export default function TripSearch() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'Main'>
		>();
	const { themeColors } = useThemeColors();

	const [mode, setMode] = useState<RideMode>('interprovincial');
	const [from, setFrom] = useState('');
	const [to, setTo] = useState('');
	const [date, setDate] = useState('');
	const [results, setResults] = useState<Ride[] | null>(null);
	const days = nextDays(4);

	const province = (id: string) => localityById(id).province;
	const validPair = (m: RideMode, f: string, t: string) => {
		if (!f || !t) return true;
		return m === 'intermunicipal'
			? province(f) === province(t)
			: province(f) !== province(t);
	};

	const originFilter = (l: { id: string; province: string }) => {
		if (!to) return true;
		return mode === 'intermunicipal'
			? l.province === province(to)
			: l.province !== province(to);
	};
	const destFilter = (l: { id: string; province: string }) => {
		if (!from) return true;
		return mode === 'intermunicipal'
			? l.province === province(from)
			: l.province !== province(from);
	};

	const changeMode = (m: RideMode) => {
		setMode(m);
		if (!validPair(m, from, to)) {
			setFrom('');
			setTo('');
			setResults(null);
		}
	};

	const selectFrom = (id: string) => {
		setFrom(id);
		if (to && !validPair(mode, id, to)) setTo('');
	};

	const selectTo = (id: string) => {
		setTo(id);
		if (from && !validPair(mode, from, id)) setFrom('');
	};

	const search = () => {
		setResults(
			searchRides({
				from: from ? localityById(from).municipality : undefined,
				to: to ? localityById(to).municipality : undefined,
				date: date || undefined,
				mode,
			}),
		);
	};

	const fieldRow = (kind: 'from' | 'to', label: string, value: string) => (
		<LocalityPicker
			variant="row"
			label={label}
			dotColor={
				kind === 'from' ? themeColors.primary : themeColors.laterite
			}
			value={value}
			onChange={kind === 'from' ? selectFrom : selectTo}
			exclude={kind === 'from' ? to : from}
			filter={kind === 'from' ? originFilter : destFilter}
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
							A tua próxima boleia
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
								},
								{
									mode: 'interprovincial',
									label: 'Interprovincial',
								},
							] as { mode: RideMode; label: string }[]
						).map((opt) => {
							const active = mode === opt.mode;
							return (
								<Pressable
									key={opt.mode}
									onPress={() => changeMode(opt.mode)}
									className="flex-1 rounded-full py-2 items-center"
									style={{
										backgroundColor: active
											? themeColors.text
											: 'transparent',
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
					{fieldRow('from', 'De onde sais', from)}
					<View
						className="ml-[5px] h-3"
						style={{
							borderLeftWidth: 2,
							borderStyle: 'dashed',
							borderLeftColor: themeColors.border,
						}}
					/>
					{fieldRow('to', 'Para onde vais', to)}
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

				<View className="px-4 pt-3">
					<Text
						className="font-mono text-[10px] uppercase tracking-[2px]"
						style={{ color: themeColors.laterite }}
					>
						Dia
					</Text>
					<View className="flex-row flex-wrap mt-1.5">
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
										{new Date(d).toLocaleDateString(
											'pt-PT',
											{
												weekday: 'short',
												day: 'numeric',
											},
										)}
									</Text>
								</Pressable>
							);
						})}
					</View>
				</View>

				<View className="p-4">
					<BoleiaButton
						title="Procurar viagens"
						onPress={search}
						disabled={!from || !to}
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
								Sem viagens a bater certo nesta rota e data.
								Experimenta{' '}
								{mode === 'intermunicipal'
									? 'outro par de municípios da mesma província'
									: 'outra rota entre províncias'}{' '}
								ou outro dia.
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
