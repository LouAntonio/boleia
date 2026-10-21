import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../types/navigation';
import LocalityPicker from './LocalityPicker';
import ProvincePicker from './ProvincePicker';
import DateRangePicker from './DateRangePicker';
import TripListingCard from './TripListingCard';
import BoleiaButton from './BoleiaButton';
import Card from './Card';
import { listRides, apiErrorMessage, type ApiRide } from '../lib/api';
import { toRide } from '../lib/rideMapper';
import { fmtDayMonth } from '../lib/format';
import {
	MUNICIPALITY_BY_CODE,
	PROVINCES,
	PROVINCE_BY_CODE,
} from '../lib/locations';
import {
	loadRecentSearches,
	saveRecentSearch,
	RecentSearch,
	SearchMode,
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
	/** Código da província que restringe os municípios (modo intermunicipal). */
	const [province, setProvince] = useState('');
	const [from, setFrom] = useState('');
	const [to, setTo] = useState('');
	/**
	 * As províncias de origem e de destino, usadas **só** no modo
	 * interprovincial.
	 *
	 * São estado à parte de propósito, e não a reinterpretação de `from`/`to`:
	 * um código de província e um de município vivem em espaços diferentes e
	 * guardar os dois no mesmo campo obriga a lembrar a cada linha qual dos dois
	 * está lá. Trocar de modo limpa os quatro.
	 */
	const [fromProvince, setFromProvince] = useState('');
	const [toProvince, setToProvince] = useState('');
	const [dateFrom, setDateFrom] = useState('');
	const [dateTo, setDateTo] = useState('');
	const [results, setResults] = useState<ApiRide[] | null>(null);
	const [total, setTotal] = useState(0);
	const [searching, setSearching] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [recents, setRecents] = useState<RecentSearch[]>([]);

	useEffect(() => {
		loadRecentSearches()
			.then(setRecents)
			.catch(() => undefined);
	}, []);

	/*
	 * Os nomes saem da lista local (`lib/locations.ts`). Antes vinham de dois
	 * pedidos à API — as províncias e as 306 localidades — só para escrever
	 * "Luanda → Benguela" numa pesquisa recente.
	 */
	const localityName = useCallback((code: string): string => {
		if (!code) return '—';
		return MUNICIPALITY_BY_CODE.get(code)?.name ?? '—';
	}, []);

	const provinceName = useCallback((code: string): string => {
		if (!code) return '—';
		return PROVINCE_BY_CODE.get(code)?.name ?? '—';
	}, []);

	const changeMode = (m: 'intermunicipal' | 'interprovincial') => {
		if (m === mode) return;
		setMode(m);
		setProvince('');
		setFrom('');
		setTo('');
		setFromProvince('');
		setToProvince('');
		setResults(null);
		setError(null);
	};

	const selectProvince = (code: string) => {
		setProvince(code);
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
		/*
		 * Troca o par que está no ecrã, não "o par de municípios" às cegas.
		 *
		 * Num ecrã interprovincial o que está à vista são as duas províncias;
		 * trocar os municípios que ninguém vê não faria nada visível, e a
		 * pessoa carregava no botão para nada.
		 */
		if (inter) {
			const f = fromProvince;
			setFromProvince(toProvince);
			setToProvince(f);
		} else {
			const f = from;
			setFrom(to);
			setTo(f);
		}
		setResults(null);
		setError(null);
	};

	/**
	 * Pesquisa no backend.
	 *
	 * Os dois modos filtram coisas diferentes, e o backend trata município e
	 * província como predicados independentes sobre a mesma paragem:
	 *
	 * - **intermunicipal** manda `origin`/`destination` (códigos de município) e
	 *   a `province` só restringe o que se pode escolher;
	 * - **interprovincial** manda `originProvinceId`/`destinationProvinceId`
	 *   (códigos de província) e deixa os municípios a null.
	 *
	 * Mandar os dois ao mesmo tempo obrigaria a que a paragem estivesse na
	 * província **e** fosse aquele município — que é a intersecção, não a
	 * união. Por isso cada modo manda só o seu conjunto.
	 */
	const runSearch = useCallback(
		async (p: {
			province: string;
			from: string;
			to: string;
			fromProvince: string;
			toProvince: string;
			mode: 'intermunicipal' | 'interprovincial';
			dateFrom: string;
			dateTo: string;
		}) => {
			setSearching(true);
			setError(null);
			try {
				const inter = p.mode === 'interprovincial';
				const res = await listRides({
					scope: inter ? 'INTERPROVINCIAL' : 'INTERMUNICIPAL',
					origin: inter ? undefined : p.from || undefined,
					destination: inter ? undefined : p.to || undefined,
					originProvinceId: inter
						? p.fromProvince || undefined
						: undefined,
					destinationProvinceId: inter
						? p.toProvince || undefined
						: undefined,
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
		void runSearch({
			province,
			from,
			to,
			fromProvince,
			toProvince,
			mode,
			dateFrom,
			dateTo,
		});
		saveRecentSearch({
			mode,
			province,
			from,
			to,
			fromProvince,
			toProvince,
			dateFrom,
			dateTo,
		})
			.then(setRecents)
			.catch(() => undefined);
	};

	/**
	 * Repõe uma pesquisa guardada.
	 *
	 * Cada modo restaura o seu par e limpa o outro: uma recente intermunicipal
	 * não deve deixar duas províncias escolhidas da pesquisa anterior, e vice-
	 * versa. `loadRecentSearches` já descarta as que não têm os dois lados que
	 * o seu modo pede, por isso aqui os campos certos estão sempre preenchidos.
	 */
	const applyRecent = (r: RecentSearch) => {
		const inter = r.mode === 'interprovincial';
		setMode(r.mode);
		setProvince(r.province ?? '');
		setFrom(inter ? '' : r.from);
		setTo(inter ? '' : r.to);
		setFromProvince(inter ? r.fromProvince : '');
		setToProvince(inter ? r.toProvince : '');
		setDateFrom(r.dateFrom);
		setDateTo(r.dateTo);
		void runSearch({
			province: r.province ?? '',
			from: inter ? '' : r.from,
			to: inter ? '' : r.to,
			fromProvince: inter ? r.fromProvince : '',
			toProvince: inter ? r.toProvince : '',
			mode: r.mode,
			dateFrom: r.dateFrom,
			dateTo: r.dateTo,
		});
	};

	/**
	 * O nome de um dos lados de uma pesquisa guardada, no vocabulário do modo
	 * dela.
	 *
	 * Interprovincial resolve províncias, intermunicipal resolve municípios —
	 * os dois espaços de códigos não se misturam. Fora do modo certo o código
	 * não estaria sequer preenchido.
	 */
	const placeName = (code: string, searchMode: SearchMode): string => {
		if (!code) return '—';
		return searchMode === 'interprovincial'
			? provinceName(code)
			: localityName(code);
	};

	const recentDateLabel = (r: RecentSearch): string => {
		if (!r.dateFrom) return 'Qualquer dia';
		const fmt = (iso: string) => fmtDayMonth(new Date(`${iso}T00:00:00`));
		return r.dateTo && r.dateTo !== r.dateFrom
			? `${fmt(r.dateFrom)} → ${fmt(r.dateTo)}`
			: fmt(r.dateFrom);
	};

	const inter = mode === 'interprovincial';
	// O botão só acende com o que este modo pede. Um único predicado para os
	// dois modos, senão o botão fica cinzento por um campo que nem existe no
	// ecrã à frente da pessoa.
	const canSearch =
		(inter ? !!(fromProvince && toProvince) : !!(from && to)) && !searching;

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
			restrictToProvince={mode === 'intermunicipal' ? province : null}
		/>
	);

	/*
	 * Cada modo tem o seu par de linhas, e são de instrumentos diferentes.
	 *
	 * **Interprovincial**: origem e destino são províncias. É a diferença real
	 * entre Luanda → Benguela e Talatona → Viana, e o backend filtra por
	 * `originProvinceId`/`destinationProvinceId`.
	 *
	 * **Intermunicipal**: origem e destino são municípios, com apicker de
	 * origem restringida à província escolhida — porque o modo promete uma rota
	 * dentro da província, e sem a restrição devolveria Luanda → Benguela com
	 * o rótulo de "intermunicipal".
	 *
	 * Os dois `swapEnds`([from,to], [fromProvince,toProvince]) continuam a fazer
	 * sentido porque ambos os pares são uma origem e um destino.
	 */
	const provRow = (
		kind: 'from' | 'to',
		label: string,
		value: string,
		exclude: string,
	) => (
		<ProvincePicker
			label={label}
			value={value}
			onChange={
				kind === 'from'
					? (v) => {
							setFromProvince(v);
							setResults(null);
							setError(null);
						}
					: (v) => {
							setToProvince(v);
							setResults(null);
							setError(null);
						}
			}
			exclude={exclude}
			dotColor={kind === 'from' ? themeColors.text : themeColors.primary}
		/>
	);

	const fromRow = inter
		? provRow('from', 'De onde sais', fromProvince, toProvince)
		: munRow('from', 'De onde sais', from);
	const toRow = inter
		? provRow('to', 'Para onde vais', toProvince, fromProvince)
		: munRow('to', 'Para onde vais', to);

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
									{/*
									 * Chips em quebra de linha, e não numa
									 * linha horizontal com scroll: os 21
									 * nomes cabem em duas ou três linhas, e
									 * uma linha horizontal esconderia metade
									 * das províncias sem que nada indicasse
									 * que há mais. É o mesmo desenho do
									 * `ProvincePicker`.
									 */}
									<View className="flex-row flex-wrap gap-2 mt-1">
										{PROVINCES.map((p) => {
											const active = province === p.code;
											return (
												<Pressable
													key={p.code}
													onPress={() =>
														selectProvince(
															active
																? ''
																: p.code,
														)
													}
													hitSlop={6}
													accessibilityRole="button"
													accessibilityState={{
														selected: active,
													}}
													className="rounded-full px-3 py-1 border justify-center"
													style={{
														minHeight: 32,
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
									</View>
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
							disabled={
								inter
									? !fromProvince && !toProvince
									: !from && !to
							}
							className="w-11 h-11 rounded-full items-center justify-center"
							style={{
								backgroundColor: themeColors.background,
								opacity: (
									inter
										? !fromProvince && !toProvince
										: !from && !to
								)
									? 0.4
									: 1,
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

					{/*
					 * Porquê o botão está cinzento.
					 *
					 * Um botão desactivado sem explicação obriga a pessoa a
					 * procurar o que falta sozinha — e o que falta é diferente
					 * conforme o modo: no interprovincial são duas províncias, no
					 * intermunicipal dois municípios. O texto diz exactamente
					 * isso, em vez de um genérico "escolhe a origem e o destino"
					 * que no modo errado nem sequer nomeia os campos.
					 */}
					{!canSearch && !searching ? (
						<Text
							className="font-sans text-body-xs mt-2 text-center"
							style={{ color: themeColors.secondary }}
						>
							{inter
								? fromProvince && !toProvince
									? 'Escolhe a província de destino.'
									: 'Escolhe a província de origem e a de destino.'
								: 'Escolhe o município de origem e o de destino.'}
						</Text>
					) : null}
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
							key={`${r.mode}|${r.fromProvince}|${r.from}|${r.toProvince}|${r.to}|${r.dateFrom}|${r.dateTo}`}
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
									{placeName(
										r.mode === 'interprovincial'
											? r.fromProvince
											: r.from,
										r.mode,
									)}{' '}
									→{' '}
									{placeName(
										r.mode === 'interprovincial'
											? r.toProvince
											: r.to,
										r.mode,
									)}
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
