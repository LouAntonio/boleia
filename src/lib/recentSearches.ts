import AsyncStorage from '@react-native-async-storage/async-storage';

/** Tipo de pesquisa, decidido pelo utilizador e não pelo servidor. */
export type SearchMode = 'intermunicipal' | 'interprovincial';

/**
 * Pesquisas recentes — conveniência 100% local (AsyncStorage), sem backend.
 * Guarda as últimas 5 pesquisas para os cartões "Recentes" na Home.
 *
 * `provinceId` é o UUID da província, `from`/`to` são UUIDs de localidades e
 * `fromProvince`/`toProvince` são UUIDs de províncias — porque são esses os
 * identificadores que `GET /api/rides` filtra.
 *
 * **Os dois pares existem os dois, e não um campo reaproveitado.** No modo
 * intermunicipal `fromProvince`/`toProvince` ficam vazios; no interprovincial
 * é `from`/`to` que ficam. Guardar províncias em `from` faria uma recente
 * interprovincial ser reposta como uma pesquisa de município, com ids que o
 * backend recusa.
 */
export type RecentSearch = {
	mode: SearchMode;
	provinceId: string;
	from: string;
	to: string;
	fromProvince: string;
	toProvince: string;
	dateFrom: string;
	dateTo: string;
};

const KEY = 'boleia.recentSearches';
const MAX = 5;

/**
 * Uma pesquisa só vale se tiver os dois lados que o seu modo pede.
 *
 * As gravadas antes deste campo existir não têm províncias, por isso uma
 * recente interprovincial antiga não tem como ser reposta: `from`/`to` estão
 * vazios e `fromProvince`/`toProvince` não existem. Descartá-la é melhor do
 * que repor um formulário vazio e uma pesquisa que devolve tudo — a pessoa
 * carregava na recente e via rotas que nunca escolheu.
 */
function isComplete(entry: Partial<RecentSearch>): boolean {
	if (entry.mode === 'interprovincial') {
		return !!entry.fromProvince && !!entry.toProvince;
	}
	return !!entry.from && !!entry.to;
}

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
			.filter((entry): entry is RecentSearch => {
				if (!entry || typeof entry !== 'object') return false;
				const candidate = entry as Partial<RecentSearch>;
				return (
					typeof candidate.from === 'string' &&
					typeof candidate.to === 'string' &&
					typeof candidate.dateFrom === 'string' &&
					typeof candidate.dateTo === 'string' &&
					isComplete(candidate)
				);
			})
			.map((entry) => ({
				...entry,
				provinceId: entry.provinceId ?? '',
				fromProvince: entry.fromProvince ?? '',
				toProvince: entry.toProvince ?? '',
			}))
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
		a.fromProvince === b.fromProvince &&
		a.toProvince === b.toProvince &&
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
