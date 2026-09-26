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
	/** Necessário para agrupar as localidades por província no selector. */
	provinceId: string;
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

/** Estados de uma corrida, exactamente como o backend os guarda. */
export type RideStatus =
	'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

/** Estados de uma reserva, exactamente como o backend os guarda. */
export type BookingStatus =
	| 'REQUESTED'
	| 'CONFIRMED'
	| 'IN_PROGRESS'
	| 'COMPLETED'
	| 'REJECTED'
	| 'CANCELLED'
	| 'EXPIRED';

/** Papel de uma paragem no percurso. */
export type RideStopKind = 'ORIGIN' | 'INTERMEDIATE' | 'DESTINATION';

/**
 * Métodos de pagamento aceites pelo backend.
 *
 * A v1 da app só usa `CASH`: `WALLET` e `MULTICAIXA` existem no esquema mas
 * não têm Wallet nem integração Multicaixa, e oferecê-los na UI levaria o
 * utilizador a um pagamento que não conclude.
 */
export type ApiPaymentMethod = 'WALLET' | 'CASH' | 'MULTICAIXA';

export const SUPPORTED_PAYMENT_METHODS: ApiPaymentMethod[] = ['CASH'];

export interface ApiRideStop {
	sequence: number;
	kind: RideStopKind;
	localityId: string | null;
	name: string;
	/** Hora já formatada em WAT pelo backend, para mostrar sem recalcular. */
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
	status: RideStatus;
	/**
	 * Paragem em que a corrida está. O ecrã de acompanhamento usa-o para saber
	 * onde mostrar o marcador, e é atualizado por WebSocket (`ride:progress`).
	 */
	progressIndex: number;
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

/** Paragem de recolha ou destino escolhida pelo passageiro. */
export interface ApiBooking {
	id: string;
	rideId: string;
	passengerId: string;
	seats: number;
	amount: number;
	paymentMethod: ApiPaymentMethod;
	pickStopIndex: number | null;
	dropStopIndex: number | null;
	status: BookingStatus;
	/** Motivo de recusa ou cancelamento. É o que a app mostra ao passageiro. */
	reason: string | null;
	createdAt: string;
	ride?: {
		id: string;
		routeName: string;
		departureAt: string;
		arrivalAt: string;
		status: RideStatus;
	};
}

/** Paragem a publicar, com hora e distância opcionais. */
export interface CreateRideStopInput {
	localityId?: string;
	name?: string;
	time?: string;
	distanceKm?: number;
}

export interface CreateRideInput {
	vehicleId: string;
	originLocalityId: string;
	destinationLocalityId: string;
	departureAt: string;
	arrivalAt: string;
	pricePerSeat: number;
	seatsTotal: number;
	/** Paragens intermédias, por ordem. Opcional. */
	stops?: CreateRideStopInput[];
}

/**
 * Página de resultados da pesquisa.
 *
 * `GET /api/rides` devolve o array puro e põe o total no cabeçalho
 * `X-Total-Count`, por isso o total vem separado da lista.
 */
export interface PagedRides {
	rows: ApiRide[];
	total: number;
}

export interface ListRidesQuery {
	origin?: string;
	destination?: string;
	/** Dia inteiro, em `AAAA-MM-DD`. */
	date?: string;
	dateFrom?: string;
	dateTo?: string;
	page?: number;
	limit?: number;
}

export interface ListMyRidesQuery {
	status?: RideStatus;
	page?: number;
	limit?: number;
}

export interface Paged<T> {
	rows: T[];
	total: number;
	page: number;
	limit: number;
}

export async function createRide(input: CreateRideInput): Promise<ApiRide> {
	const { data } = await client.post<ApiRide>('/api/rides', input);
	return data;
}

export async function listRides(
	query: ListRidesQuery = {},
): Promise<PagedRides> {
	const res = await client.get<ApiRide[]>('/api/rides', {
		params: {
			...query,
			page: query.page === undefined ? undefined : String(query.page),
			limit: query.limit === undefined ? undefined : String(query.limit),
		},
	});
	// Sem este cabeçalho a exposto, o React Native não o deixaria ler, e a
	// app ficava sem forma de saber se havia mais páginas.
	const rawTotal = res.headers['x-total-count'];
	const total = Number(rawTotal ?? 0);
	return {
		rows: res.data,
		total: Number.isFinite(total) ? total : res.data.length,
	};
}

export async function getRide(id: string): Promise<ApiRide> {
	const { data } = await client.get<ApiRide>(`/api/rides/${id}`);
	return data;
}

/** Corridas publicadas pelo utilizador autenticado como motorista. */
export async function listMyRides(
	query: ListMyRidesQuery = {},
): Promise<Paged<ApiRide>> {
	const { data } = await client.get<Paged<ApiRide>>('/api/rides/mine', {
		params: {
			...query,
			page: query.page === undefined ? undefined : String(query.page),
			limit: query.limit === undefined ? undefined : String(query.limit),
		},
	});
	return data;
}

export async function updateRide(
	id: string,
	input: {
		departureAt?: string;
		arrivalAt?: string;
		pricePerSeat?: number;
		seatsTotal?: number;
	},
): Promise<ApiRide> {
	const { data } = await client.patch<ApiRide>(`/api/rides/${id}`, input);
	return data;
}

export async function cancelRide(
	id: string,
	reason?: string,
): Promise<ApiRide> {
	const { data } = await client.post<ApiRide>(`/api/rides/${id}/cancel`, {
		reason,
	});
	return data;
}

/** Inicia a corrida. Só o motorista da corrida pode, e só se estiver agendada. */
export async function startRide(id: string): Promise<ApiRide> {
	const { data } = await client.post<ApiRide>(`/api/rides/${id}/start`);
	return data;
}

/** Termina a corrida e fecha as reservas a bordo. */
export async function finishRide(id: string): Promise<ApiRide> {
	const { data } = await client.post<ApiRide>(`/api/rides/${id}/finish`);
	return data;
}

/** Avança a corrida para uma paragem do percurso. */
export async function setRideProgress(
	id: string,
	progressIndex: number,
): Promise<ApiRide> {
	const { data } = await client.patch<ApiRide>(`/api/rides/${id}/progress`, {
		progressIndex,
	});
	return data;
}

export interface CreateBookingInput {
	seats: number;
	paymentMethod: ApiPaymentMethod;
	/** Índice da paragem de recolha dentro do percurso. */
	pickStopIndex?: number;
	/** Índice da paragem de destino dentro do percurso. */
	dropStopIndex?: number;
}

export async function bookRide(
	rideId: string,
	input: CreateBookingInput,
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

/** Reservas de uma corrida, para o motorista decidir. */
export async function listRideBookings(rideId: string): Promise<ApiBooking[]> {
	const { data } = await client.get<ApiBooking[]>(
		`/api/rides/${rideId}/bookings`,
	);
	return data;
}

/** O motorista aceita ou recusa uma reserva. A recusa exige motivo. */
export async function decideBooking(
	bookingId: string,
	decision: 'CONFIRMED' | 'REJECTED',
	reason?: string,
): Promise<ApiBooking> {
	const { data } = await client.patch<ApiBooking>(
		`/api/bookings/${bookingId}`,
		{ decision, reason },
	);
	return data;
}

export async function cancelBooking(
	bookingId: string,
	reason?: string,
): Promise<ApiBooking> {
	const { data } = await client.post<ApiBooking>(
		`/api/bookings/${bookingId}/cancel`,
		{ reason },
	);
	return data;
}

// ---------- Notificações ----------

export interface ApiNotification {
	id: string;
	type: 'RIDE' | 'BOOKING' | 'PAYMENT' | 'SYSTEM' | 'PROMOTION';
	title: string;
	message: string;
	data: Record<string, unknown> | null;
	read: boolean;
	readAt: string | null;
	channel: 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';
	createdAt: string;
}

export interface NotificationList {
	rows: ApiNotification[];
	total: number;
	page: number;
	limit: number;
	unread: number;
}

export async function listNotifications(
	query: { page?: number; limit?: number } = {},
): Promise<NotificationList> {
	const { data } = await client.get<NotificationList>('/api/notifications', {
		params: query,
	});
	return data;
}

export async function getUnreadNotificationCount(): Promise<{
	unread: number;
}> {
	const { data } = await client.get<{ unread: number }>(
		'/api/notifications/unread-count',
	);
	return data;
}

export async function markNotificationRead(
	id: string,
	read = true,
): Promise<void> {
	// O endpoint é um update genérico: o estado vem no corpo, não na rota.
	await client.patch(`/api/notifications/${id}`, { read });
}

export async function markAllNotificationsRead(): Promise<void> {
	await client.patch('/api/notifications/read-all');
}

// ---------- Push ----------

/**
 * Regista o token de push deste dispositivo.
 *
 * O token pertence à instalação, não à conta: reenviá-lo a cada arranque
 * reinscreve o mesmo dispositivo, que é o comportamento pretendido.
 */
export async function registerPushDevice(input: {
	token: string;
	platform: 'ios' | 'android';
}): Promise<void> {
	await client.post('/api/push/devices', input);
}

export async function unregisterPushDevice(token: string): Promise<void> {
	await client.request({
		method: 'DELETE',
		url: '/api/push/devices/current',
		data: { token },
	});
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
