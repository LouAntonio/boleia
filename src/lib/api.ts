import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@env';
import { useAppStore } from '../store/appStore';

export const AUTH_TOKEN_KEY = 'boleia.authToken';

const API_TIMEOUT_MS = 15000;

export interface ApiUser {
	id: string;
	name: string | null;
	surname: string | null;
	email: string;
	phone?: string | null;
	image?: string | null;
	bio?: string | null;
	createdAt?: string;
}

export interface ApiSession {
	user: ApiUser;
	token: string | null;
}

export type OtpPurpose = 'signup' | 'reset';

const client = axios.create({
	baseURL: API_URL,
	timeout: API_TIMEOUT_MS,
	headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(async (config) => {
	const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

async function captureToken(headers: Record<string, unknown>): Promise<void> {
	const token = headers['set-auth-token'];
	if (typeof token === 'string' && token.length > 0) {
		await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
	}
}

client.interceptors.response.use(
	async (response) => {
		// A sessão criada/renovada devolve o token Bearer no header
		// `set-auth-token` (plugin bearer do better-auth, sem cookies no RN).
		await captureToken(response.headers as Record<string, unknown>);
		return response;
	},
	async (error) => {
		if (axios.isAxiosError(error) && error.response?.status === 401) {
			await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
			useAppStore.getState().signOut();
		}
		return Promise.reject(error);
	},
);

export async function clearAuthToken(): Promise<void> {
	await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}

export function apiErrorMessage(error: unknown, fallback: string): string {
	if (axios.isAxiosError(error)) {
		const data = error.response?.data as { message?: string } | undefined;
		if (data?.message) {
			return data.message;
		}
		if (error.code === 'ECONNABORTED') {
			return 'O servidor demorou a responder. Tenta de novo.';
		}
		if (!error.response) {
			return 'Sem ligação ao servidor. Verifica a tua internet.';
		}
	}
	return fallback;
}

export async function sendOtp(
	phone: string,
	purpose: OtpPurpose,
): Promise<{ status: boolean }> {
	const { data } = await client.post<{ status: boolean }>(
		'/api/auth/phone/otp/send',
		{ phone, purpose },
	);
	return data;
}

export async function verifyOtpCode(
	phone: string,
	purpose: OtpPurpose,
	code: string,
): Promise<{ status?: boolean; token?: string; expiresAt?: string }> {
	const { data } = await client.post<{
		status?: boolean;
		token?: string;
		expiresAt?: string;
	}>('/api/auth/phone/otp/verify', { phone, purpose, code });
	return data;
}

export interface SignUpInput {
	phone: string;
	password: string;
	name: string;
	surname?: string;
	email?: string;
	termsAccepted: boolean;
	marketingAccepted?: boolean;
}

export async function signUp(input: SignUpInput): Promise<{ status: boolean }> {
	const { data } = await client.post<{ status: boolean }>(
		'/api/auth/phone/sign-up',
		input,
	);
	return data;
}

export async function signIn(
	phone: string,
	password: string,
): Promise<ApiSession> {
	const res = await client.post<{ user: ApiUser }>(
		'/api/auth/phone/sign-in',
		{ phone, password },
	);
	const token = (res.headers['set-auth-token'] as string | undefined) ?? null;
	if (token) {
		await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
	}
	return { user: res.data.user, token };
}

export async function resetPassword(
	token: string,
	newPassword: string,
): Promise<{ status: boolean }> {
	const { data } = await client.post<{ status: boolean }>(
		'/api/auth/reset-password',
		{ token, newPassword },
	);
	return data;
}

export async function updateProfile(input: {
	name?: string;
	surname?: string;
	bio?: string;
}): Promise<ApiUser> {
	const { data } = await client.patch<ApiUser>('/api/account/profile', input);
	return data;
}

export async function fetchSession(): Promise<ApiSession | null> {
	try {
		const res = await client.get<{
			user?: ApiUser;
			session?: { id: string };
		}>('/api/auth/get-session');
		if (!res.data.user || !res.data.session) {
			return null;
		}
		return { user: res.data.user, token: null };
	} catch {
		return null;
	}
}
