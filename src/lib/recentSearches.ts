import AsyncStorage from '@react-native-async-storage/async-storage';

/** Tipo de pesquisa, decidido pelo utilizador e não pelo servidor. */
export type SearchMode = 'intermunicipal' | 'interprovincial';

/**
 * Pesquisas recentes — conveniência 100% local (AsyncStorage), sem backend.
 * Guarda as últimas 5 pesquisas para os cartões "Recentes" na Home.
 *
 * Os valores são **códigos**, não UUIDs: `province` é o código da província que
 * restringe os municípios, `from`/`to` são códigos de município
 * (`huambo.catabola`) e `fromProvince`/`toProvince` são códigos de província
 * (`cuanza-norte`). São esses os identificadores que `GET /api/rides` aceita.
 *
 * **Os dois pares existem os dois, e não um campo reaproveitado.** No modo
 * intermunicipal `fromProvince`/`toProvince` ficam vazios; no interprovincial
 * é `from`/`to` que ficam. Guardar províncias em `from` faria uma recente
 * interprovincial ser reposta como uma pesquisa de município, com códigos que
 * o backend procura no espaço errado.
 */
export type RecentSearch = {
	mode: SearchMode;
	province: string;
	from: string;
	to: string;
	fromProvince: string;
	toProvince: string;
	dateFrom: string;
	dateTo: string;
};

/*
 * A chave leva `v2` de propósito.
 *
 * As pesquisas gravadas antes disto guardavam UUIDs. A lista local deixou de
 * os conhecer, e repor uma recente antiga mandaria UUIDs que o backend ainda
 * aceita — a pesquisa funcionaria, mas o formulário mostrava códigos vazios e
 * os campos pareciam por preencher. Perder cinco recentes locais é melhor do
 * que repor um formulário em branco.
 */
const KEY = 'boleia.recentSearches.v2';
const MAX = 5;

/**
 * Uma pesquisa só vale se tiver os dois lados que o seu modo pede.
 *
 * As gravadas antes do campo das províncias existir não têm províncias, por
 * isso uma recente interprovincial antiga não tem como ser reposta: `from`/`to`
 * estão vazios e `fromProvince`/`toProvince` não existem. Descartá-la é melhor
 * do que repor um formulário vazio e uma pesquisa que devolve tudo — a pessoa
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
				province: entry.province ?? '',
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
		a.province === b.province &&
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
