import { api } from '../lib/api';
import type { User } from '../store/authStore';

export async function fetchProfile(): Promise<{ user: User }> {
	const { data } = await api.get('/auth/me');
	return { user: data };
}
