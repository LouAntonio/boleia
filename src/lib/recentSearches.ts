import AsyncStorage from '@react-native-async-storage/async-storage';

/** Tipo de pesquisa, decidido pelo utilizador e não pelo servidor. */
export type SearchMode = 'intermunicipal' | 'interprovincial';

/**
 * Pesquisas recentes — conveniência 100% local (AsyncStorage), sem backend.
 * Guarda as últimas 5 pesquisas para os cartões "Recentes" na Home.
 *
 * `provinceId` é o UUID da província e `from`/`to` são UUIDs de localidades,
 * porque são os identificadores que `GET /api/rides` filtra.
 */
export type RecentSearch = {
	mode: SearchMode;
	provinceId: string;
	from: string;
	to: string;
	dateFrom: string;
	dateTo: string;
};

const KEY = 'boleia.recentSearches';
const MAX = 5;

export async function loadRecentSearches(): Promise<RecentSearch[]> {
	try {
		const raw = await AsyncStorage.getItem(KEY);
		if (!raw) return [];
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		// Pesquisas gravadas antes dos identificadores reais usavam o nome da
		// província em `province`. Descartá-las é melhor do que tentar adivinhar
		// o UUID: uma pesquisa que devolve rotas erradas é pior do que nenhuma.
		return parsed
			.filter(
				(entry): entry is RecentSearch =>
					!!entry &&
					typeof entry === 'object' &&
					typeof (entry as RecentSearch).from === 'string' &&
					typeof (entry as RecentSearch).to === 'string',
			)
			.map((entry) => ({ ...entry, provinceId: entry.provinceId ?? '' }))
			.slice(0, MAX);
	} catch {
		return [];
	}
}

export async function saveRecentSearch(
	entry: RecentSearch,
): Promise<RecentSearch[]> {
	const same = (a: RecentSearch, b: RecentSearch) =>
		a.mode === b.mode &&
		a.provinceId === b.provinceId &&
		a.from === b.from &&
		a.to === b.to &&
		a.dateFrom === b.dateFrom &&
		a.dateTo === b.dateTo;
	const next = [
		entry,
		...(await loadRecentSearches()).filter((r) => !same(r, entry)),
	].slice(0, MAX);
	try {
		await AsyncStorage.setItem(KEY, JSON.stringify(next));
	} catch {
		// ignora — recentes são conveniência local
	}
	return next;
}
