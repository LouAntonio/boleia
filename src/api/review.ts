import { api } from '../lib/api';

export interface CreateReviewPayload {
	tripId: string;
	fromUserId: string;
	toUserId: string;
	rating: number;
	comment?: string;
}

export async function createReview(
	payload: CreateReviewPayload,
): Promise<void> {
	await api.post('/reviews', payload);
}
