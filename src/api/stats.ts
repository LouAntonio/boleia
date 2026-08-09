import { api } from '../lib/api';

export interface ProfileStats {
	totalTrips: number;
	totalDistanceKm: number;
	totalDurationMin: number;
	totalSpent: number;
}

export async function fetchProfileStats(): Promise<{ stats: ProfileStats }> {
	const { data } = await api.get('/users/me/stats');
	return data as { stats: ProfileStats };
}
