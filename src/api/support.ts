import { api } from '../lib/api';

export interface ContactMessagePayload {
	name: string;
	email?: string;
	phone?: string;
	message: string;
}

export async function sendContactMessage(
	payload: ContactMessagePayload,
): Promise<void> {
	await api.post('/support/contact', payload);
}
