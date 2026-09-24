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

// ---------- KYC (motorista + passageiro) ----------

export type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface ApiKycState {
	status: KycStatus;
	rejectionReason: string | null;
}

export interface ApiKycMe {
	driver: ApiKycState | null;
	passenger: ApiKycState | null;
}

export interface KycMediaIds {
	biFront: string;
	biBack: string;
	selfies: string[];
	license?: string;
	bodyPhoto?: string;
}

export async function getKycMe(): Promise<ApiKycMe> {
	const { data } = await client.get<ApiKycMe>('/api/kyc/me');
	return data;
}

export async function submitDriverKyc(input: {
	fullName: string;
	biNumber: string;
	licenseNumber?: string;
	licenseExpiry?: string;
	mediaIds: KycMediaIds;
}): Promise<{ id: string; status: KycStatus }> {
	const { data } = await client.put<{ id: string; status: KycStatus }>(
		'/api/kyc/driver',
		input,
	);
	return data;
}

export async function submitPassengerKyc(input: {
	fullName: string;
	biNumber: string;
	mediaIds: KycMediaIds;
}): Promise<{ id: string; status: KycStatus }> {
	const { data } = await client.put<{ id: string; status: KycStatus }>(
		'/api/kyc/passenger',
		input,
	);
	return data;
}

// ---------- Viaturas ----------

export interface ApiVehicle {
	id: string;
	make: string;
	model: string;
	color: string;
	plate: string;
	seats: number;
	status: KycStatus;
	verifiedAt: string | null;
}

export async function listMyVehicles(): Promise<ApiVehicle[]> {
	const { data } = await client.get<ApiVehicle[]>('/api/vehicles/mine');
	return data;
}

export async function createVehicle(input: {
	make: string;
	model: string;
	color: string;
	plate: string;
	seats: number;
	photoIds: string[];
}): Promise<{ id: string; status: KycStatus }> {
	const { data } = await client.post<{ id: string; status: KycStatus }>(
		'/api/vehicles',
		input,
	);
	return data;
}

export async function deleteVehicle(id: string): Promise<{ status: boolean }> {
	const { data } = await client.delete<{ status: boolean }>(
		`/api/vehicles/${id}`,
	);
	return data;
}

// ---------- Provincias / municipios ----------

export interface ApiProvince {
	id: string;
	name: string;
	latitude: number | null;
	longitude: number | null;
}

export interface ApiLocality {
	id: string;
	municipality: string;
	name: string;
}

export async function listProvinces(): Promise<ApiProvince[]> {
	const { data } = await client.get<ApiProvince[]>('/api/locality/provinces');
	return data;
}

export async function listLocalities(
	provinceId: string,
): Promise<ApiLocality[]> {
	const { data } = await client.get<ApiLocality[]>(
		`/api/locality/provinces/${provinceId}/localities`,
	);
	return data;
}

// ---------- Contacto de emergência ----------

export interface ApiEmergencyContact {
	id: string;
	name: string;
	phone: string;
}

export async function getEmergencyContact(): Promise<ApiEmergencyContact | null> {
	const { data } = await client.get<ApiEmergencyContact | null>(
		'/api/emergency-contact',
	);
	return data;
}

export async function saveEmergencyContact(input: {
	name: string;
	phone: string;
}): Promise<ApiEmergencyContact> {
	const { data } = await client.put<ApiEmergencyContact>(
		'/api/emergency-contact',
		input,
	);
	return data;
}

// ---------- Corridas / reservas ----------

export interface ApiRideStop {
	sequence: number;
	kind: string;
	localityId: string | null;
	name: string;
	timeLabel: string;
}

export interface ApiRide {
	id: string;
	driverId: string;
	vehicleId: string | null;
	routeName: string;
	departureAt: string;
	arrivalAt: string;
	seatsTotal: number;
	seatsTaken: number;
	pricePerSeat: number;
	status: string;
	stops?: ApiRideStop[];
	driver?: { id: string; name: string };
	vehicle?: {
		id: string;
		make: string;
		model: string;
		color: string;
		plate: string;
	} | null;
}

export interface ApiBooking {
	id: string;
	rideId?: string;
	passengerId?: string;
	seats: number;
	amount: number;
	paymentMethod: string;
	status: string;
	passenger?: { id: string; name: string };
	ride?: {
		id: string;
		routeName: string;
		departureAt: string;
		status: string;
	};
}

export async function createRide(input: {
	vehicleId: string;
	originLocalityId: string;
	destinationLocalityId: string;
	departureAt: string;
	arrivalAt: string;
	pricePerSeat: number;
	seatsTotal: number;
}): Promise<ApiRide> {
	const { data } = await client.post<ApiRide>('/api/rides', input);
	return data;
}

export async function listRides(query: {
	origin?: string;
	destination?: string;
	date?: string;
}): Promise<ApiRide[]> {
	const { data } = await client.get<ApiRide[]>('/api/rides', {
		params: query,
	});
	return data;
}

export async function getRide(id: string): Promise<ApiRide> {
	const { data } = await client.get<ApiRide>(`/api/rides/${id}`);
	return data;
}

export async function cancelRide(id: string): Promise<ApiRide> {
	const { data } = await client.post<ApiRide>(`/api/rides/${id}/cancel`);
	return data;
}

export async function bookRide(
	rideId: string,
	input: { seats: number; paymentMethod: string },
): Promise<ApiBooking> {
	const { data } = await client.post<ApiBooking>(
		`/api/rides/${rideId}/bookings`,
		input,
	);
	return data;
}

export async function listMyBookings(): Promise<ApiBooking[]> {
	const { data } = await client.get<ApiBooking[]>('/api/rides/bookings/mine');
	return data;
}

export async function listRideBookings(rideId: string): Promise<ApiBooking[]> {
	const { data } = await client.get<ApiBooking[]>(
		`/api/rides/${rideId}/bookings`,
	);
	return data;
}

export async function decideBooking(
	bookingId: string,
	decision: 'CONFIRMED' | 'REJECTED',
): Promise<ApiBooking> {
	const { data } = await client.patch<ApiBooking>(
		`/api/bookings/${bookingId}`,
		{ decision },
	);
	return data;
}

export async function cancelBooking(bookingId: string): Promise<ApiBooking> {
	const { data } = await client.post<ApiBooking>(
		`/api/bookings/${bookingId}/cancel`,
	);
	return data;
}

// ---------- Media (upload real via Cloudinary) ----------

export interface UploadSignature {
	uploadUrl: string;
	cloudName: string;
	apiKey: string;
	timestamp: number;
	signature: string;
	publicId: string;
	resourceType: string;
	transformation: string;
	eager: string;
	allowedFormats: string;
	maxBytes: number;
	mediaId: string;
}

export async function requestUploadSignature(
	ownerType: 'DRIVER_KYC' | 'PASSENGER_KYC' | 'VEHICLE' | 'USER',
): Promise<UploadSignature> {
	const { data } = await client.post<UploadSignature>(
		'/api/cloudinary/signature',
		{ resourceType: 'image', ownerType },
	);
	return data;
}

export async function confirmUpload(publicId: string): Promise<{ id: string }> {
	const { data } = await client.post<{ id: string }>(
		'/api/cloudinary/confirm',
		{ publicId },
	);
	return data;
}

/**
 * Envia uma foto local (expo-image-picker) para o Cloudinary e devolve o
 * id da Media confirmada, pronto a usar em KYC/viatura.
 */
export async function uploadPhoto(
	localUri: string,
	ownerType: 'DRIVER_KYC' | 'PASSENGER_KYC' | 'VEHICLE' | 'USER',
): Promise<string> {
	const signature = await requestUploadSignature(ownerType);
	const form = new FormData();
	form.append('file', {
		uri: localUri,
		name: 'foto.jpg',
		type: 'image/jpeg',
	} as unknown as Blob);
	form.append('api_key', signature.apiKey);
	form.append('timestamp', String(signature.timestamp));
	form.append('signature', signature.signature);
	form.append('public_id', signature.publicId);
	if (signature.transformation) {
		form.append('transformation', signature.transformation);
	}
	const upload = await fetch(signature.uploadUrl, {
		method: 'POST',
		body: form,
	});
	if (!upload.ok) {
		throw new Error('Falha no envio da foto. Tenta de novo.');
	}
	const confirmed = await confirmUpload(signature.publicId);
	return confirmed.id;
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
