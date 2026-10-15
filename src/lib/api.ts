import axios from 'axios';
import { API_URL } from '@env';
import { useAppStore } from '../store/appStore';
import { queryClient } from './queryClient';
import { navigationRef } from './navigationRef';
import { authClient } from './auth-client';
import { sessionCookieHeader } from './auth-cookie';

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
}

const client = axios.create({
	baseURL: API_URL,
	timeout: API_TIMEOUT_MS,
	headers: { 'Content-Type': 'application/json' },
});

/*
 * A sessão é transportada por cookie, e o React Native não tem cookie jar.
 *
 * O `expoClient` guarda os cookies da sessão em SecureStore e reenvia-os nas
 * chamadas do `authClient`; este interceptor faz o mesmo pelas chamadas do
 * axios, que é o REST inteiro da app. O valor vem do mesmo sítio — o
 * `auth-cookie.ts` — que alimenta o WebSocket, e é por isso que o token deixou
 * de ser uma chave deste ficheiro: deixou de haver dois sítios onde a sessão
 * podia estar, e divergirem sem dar por isso.
 */
client.interceptors.request.use(async (config) => {
	const cookie = await sessionCookieHeader();
	if (cookie) {
		config.headers.Cookie = cookie;
	}
	return config;
});

/**
 * Terminar a sessão depois de um 401.
 *
 * A versão anterior limitava-se a apagar o token e a chamar `signOut()`, e
 * só o `ProfileScreen` é que navega depois de um `signOut()`. Um 401 em
 * qualquer outro sítio — sessão expirada, revogada noutro dispositivo —
 * deixava a pessoa dentro do `BoleiaMainNavigator` com `authenticated: false`
 * e `sessionUserId: null`: ecrãs a mostrar `0` e `—`, nenhuma query nova a
 * correr (`enabled: !!sessionUserId`), e a única forma de sair passando pelo
 * botão do perfil. Agrava porque `signOut()` repõe `currentRole:
 * 'passenger'`, pelo que o papel escolhido desaparecia em silêncio.
 *
 * Três passos, e os três importam:
 *
 * 1. **navegar** — a app precisa de sair da árvore de autenticação, não
 *    apenas de saber que não há sessão. `navigationRef` pode não estar pronto
 *    (no Splash, antes do `NavigationContainer`), e nesse caso não há ecrã
 *    para mostrar: o Splash resolve pelo seu caminho.
 * 2. **limpar a cache** — as queries antigas de quem saiu podem ficar no
 *    ecrã quando outro utilizador entrar no mesmo aparelho.
 * 3. **terminar a sessão** — o `authClient` é o dono dela; este ficheiro
 *    limpa o estado local e avisa-o.
 */
function endSessionAfter401(): void {
	useAppStore.getState().resetAfterLogout();
	queryClient.clear();
	void authClient.signOut().catch(() => {});

	if (navigationRef.isReady()) {
		navigationRef.reset({
			index: 0,
			routes: [{ name: 'Auth', params: { screen: 'Login' } }],
		});
	}
}

client.interceptors.response.use(
	(response) => response,
	(error: unknown) => {
		if (axios.isAxiosError(error) && error.response?.status === 401) {
			endSessionAfter401();
		}
		return Promise.reject(error);
	},
);

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

// ---------- Perfil ----------

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
	/**
	 * Distância acumulada desde a origem, em km. Fica a 0 enquanto ninguém a
	 * calcular, e é por isso que a app não a mostra nesse caso.
	 */
	distanceKm: number;
	/**
	 * Coordenadas da província-sede da paragem, quando a conhece.
	 *
	 * São as coordenadas da província, não do município: `Locality` não tem
	 * `latitude`/`longitude`. Dá para estimar a dimensão do percurso, não para
	 * localizar a paragem ao metro.
	 */
	provinceCoordinates: { latitude: number; longitude: number } | null;
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

/**
 * Avança a corrida para uma paragem do percurso.
 *
 * Este endpoint **não** devolve a corrida: o servidor responde só com o id e o
 * índice gravado. Estava tipado como `ApiRide`, e quem confiasse nisso
 * receberia um objecto sem `stops` nem `status` — que é o suficiente para uma
 * estrada desenhada a partir de `undefined`.
 */
export interface RideProgressResult {
	id: string;
	progressIndex: number;
}

export async function setRideProgress(
	id: string,
	progressIndex: number,
): Promise<RideProgressResult> {
	const { data } = await client.patch<RideProgressResult>(
		`/api/rides/${id}/progress`,
		{ progressIndex },
	);
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

/**
 * Desregista o token de push.
 *
 * O token vai na query string e não no corpo: um `DELETE` com corpo é
 * descartado por alguns proxies e CDNs, e a desregisto é justamente a operação
 * que mais suffers quando é perdida em silêncio.
 */
export async function unregisterPushDevice(token: string): Promise<void> {
	await client.delete('/api/push/devices/current', {
		params: { token },
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
/**
 * Os campos que o Cloudinary assina, e que têm de viajar no pedido.
 *
 * O backend assina cinco parâmetros (`cloudinary.service.ts`, `toSign`):
 * `timestamp`, `public_id`, `transformation`, `eager` e `allowed_formats`. O
 * Cloudinary recalcula a assinatura **sobre o que recebe**; um parâmetro que
 * foi assinado e não vai no pedido faz a assinatura não bater e o upload ser
 * recusado. Não há erro explicativo do lado do Cloudinary — é um 400.
 *
 * Era aqui que o KYC e o registo de viaturas morriam: o `eager` e o
 * `allowed_formats` ficavam de fora, em qualquer das duas apps. A assinatura
 * é montada a partir desta lista para que acrescentar um parâmetro no servidor
 * não volte a passar despercebido aqui.
 */
const SIGNED_UPLOAD_FIELDS = [
	'timestamp',
	'public_id',
	'transformation',
	'eager',
	'allowed_formats',
] as const;

/** Metade do FormData que é a assinatura, derivada do objecto que o backend mandou. */
function appendSignedParams(form: FormData, signature: UploadSignature): void {
	// `public_id` e `allowed_formats` têm sublinhado no protocolo do Cloudinary;
	// o objecto da API usa camelCase.
	for (const field of SIGNED_UPLOAD_FIELDS) {
		const value =
			field === 'public_id'
				? signature.publicId
				: field === 'allowed_formats'
					? signature.allowedFormats
					: signature[field];
		if (value !== undefined && value !== null && value !== '') {
			form.append(field, String(value));
		}
	}
}

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
	form.append('signature', signature.signature);
	appendSignedParams(form, signature);

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

/**
 * A sessão não se consulta aqui.
 *
 * `checkSession` e `fetchSession` saíram: faziam `GET /api/auth/get-session` à
 * mão para saber o que o `authClient` já sabe. O `Splash` usava-as para
 * distinguir "o servidor disse que não há sessão" de "o servidor não respondeu"
 * — distinção que passou a ser um `getSession()` com `catch`.
 *
 * `ApiSession` também não tem `token`: o token deixou de ser uma coisa que a app
 * guarda. Vive no cookie que o `expoClient` trata, e é de lá que sai o valor que
 * o gateway do WebSocket exige (ver `auth-cookie.ts`).
 */
