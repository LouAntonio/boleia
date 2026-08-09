// Avaliações — leitura e registo (bilateral após viagem concluída)
import { useDbStore } from '../db';
import { UID, nowISO } from '../helpers';
import { Review } from '../../types/boleia';

export function reviewsFor(userId: string): Review[] {
	return useDbStore
		.getState()
		.db.reviews.filter((r) => r.toUserId === userId)
		.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function submittedReview(
	byUserId: string,
	rideId: string,
): Review | undefined {
	return useDbStore
		.getState()
		.db.reviews.find((r) => r.byUserId === byUserId && r.rideId === rideId);
}

export function writeReview(input: {
	byUserId: string;
	toUserId: string;
	rideId: string;
	rating: 1 | 2 | 3 | 4 | 5;
	comment: string;
}): void {
	if (input.comment.trim().length < 3) return;
	const existing = submittedReview(input.byUserId, input.rideId);
	if (existing) return;

	useDbStore.getState().mutate((db) => {
		db.reviews.unshift({
			id: UID.next('rev'),
			byUserId: input.byUserId,
			toUserId: input.toUserId,
			rideId: input.rideId,
			rating: input.rating,
			comment: input.comment.trim(),
			createdAt: nowISO(),
		});

		const target = db.users.find((u) => u.id === input.toUserId);
		if (target) {
			const total =
				(target.rating ?? 0) * target.ratingsCount + input.rating;
			target.ratingsCount += 1;
			target.rating = Math.round((total / target.ratingsCount) * 10) / 10;
		}
	});
}
