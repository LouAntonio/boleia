import AsyncStorage from '@react-native-async-storage/async-storage';
import { RideMode } from '../mock/repos/rideRepo';

// Pesquisas recentes — conveniência 100% local (AsyncStorage), sem backend.
// Guarda as últimas 5 pesquisas para cartões "Recentes" na Home.
export type RecentSearch = {
	mode: RideMode;
	province: string;
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
		return Array.isArray(parsed) ? parsed.slice(0, MAX) : [];
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
