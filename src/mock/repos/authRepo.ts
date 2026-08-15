// Acesso a dados mock — camada fina sobre a DB. Funções puras/síncronas
// (latência simulada nos ecrãs de auth, Fases 3+).
import { useDbStore } from '../db';
import { UID, nowISO } from '../helpers';
import { OtpChallenge, BoleiaUser, Booking, Ride } from '../../types/boleia';

// Código fixo do demo — visível nas próprias telas de recuperação
export const DEMO_OTP = '773214';

export function normalizePhone(raw: string): string {
	return raw.replace(/\s+/g, '');
}

// Hash "mock" síncrono (djb2 → base36). Apenas para não guardar senhas em
// claro no AsyncStorage da demo — não é criptografia e não deve ir a produção.
// eslint-disable-next-line no-bitwise
export function mockHash(input: string): string {
	let hash = 5381;
	const text = input.normalize('NFD');
	for (let i = 0; i < text.length; i++) {
		// eslint-disable-next-line no-bitwise
		hash = (hash * 33) ^ text.charCodeAt(i);
	}
	// eslint-disable-next-line no-bitwise
	return (hash >>> 0).toString(36);
}

// ---- Credenciais -----------------------------------------------------------
export function login(
	phone: string,
	password: string,
):
	| { ok: true; user: BoleiaUser }
	| { ok: false; error: 'inexistente' | 'senha' } {
	const normalized = normalizePhone(phone);
	const user = findByPhone(normalized);
	if (!user) return { ok: false, error: 'inexistente' };
	if (user.password !== mockHash(password)) {
		return { ok: false, error: 'senha' };
	}
	return { ok: true, user };
}

export function registerUser(
	phone: string,
	password: string,
	profile: { firstName?: string; lastName?: string } = {},
): { ok: true; user: BoleiaUser } | { ok: false; error: 'existe' } {
	const normalized = normalizePhone(phone);
	if (findByPhone(normalized)) return { ok: false, error: 'existe' };

	const user: BoleiaUser = {
		id: UID.next('u'),
		firstName: profile.firstName?.trim() ?? '',
		lastName: profile.lastName?.trim() ?? '',
		phone: normalized,
		password: mockHash(password),
		avatar: null,
		bio: '',
		rating: null,
		ratingsCount: 0,
		kyc: null,
		vehicle: null,
		emergencyContact: null,
		wallet: 0,
		createdAt: nowISO(),
	};
	useDbStore.getState().mutate((db) => {
		db.users.push(user);
	});
	return { ok: true, user };
}

export function setPassword(phone: string, password: string): boolean {
	const normalized = normalizePhone(phone);
	const user = findByPhone(normalized);
	if (!user) return false;
	useDbStore.getState().mutate((db) => {
		const found = db.users.find((u) => u.id === user.id);
		if (found) found.password = mockHash(password);
	});
	return true;
}

// ---- OTP -----------------------------------------------------------------
export function requestOtp(phone: string): OtpChallenge {
	const normalized = normalizePhone(phone);
	const challenge: OtpChallenge = {
		id: UID.next('otp'),
		phone: normalized,
		code: DEMO_OTP,
		expiresAt: nowISO(5), // 5 min
		verified: false,
		createdAt: nowISO(),
	};
	useDbStore.getState().mutate((db) => {
		db.otp = db.otp.filter((o) => o.phone !== normalized).concat(challenge);
	});
	return challenge;
}

export function verifyOtp(phone: string, code: string): boolean {
	const { db } = useDbStore.getState();
	const normalized = normalizePhone(phone);
	const challenge = [...db.otp].reverse().find((o) => o.phone === normalized);
	if (!challenge) return false;
	if (Date.parse(challenge.expiresAt) < Date.now()) return false;
	if (challenge.code !== code.trim()) return false;

	useDbStore.getState().mutate((d) => {
		const found = d.otp.find((o) => o.id === challenge.id);
		if (found) found.verified = true;
	});
	return true;
}

// ---- Utilizadores ---------------------------------------------------------
export function findByPhone(phone: string): BoleiaUser | undefined {
	const { db } = useDbStore.getState();
	return db.users.find((u) => u.phone === normalizePhone(phone));
}

export function getById(id: string): BoleiaUser | undefined {
	return useDbStore.getState().db.users.find((u) => u.id === id);
}

export function updateUser(
	id: string,
	patch: Partial<Pick<BoleiaUser, 'firstName' | 'lastName' | 'bio'>>,
): void {
	useDbStore.getState().mutate((db) => {
		const user = db.users.find((u) => u.id === id);
		if (user) Object.assign(user, patch);
	});
}

// ---- Consultas comuns -----------------------------------------------------
export function ridesForDriver(driverId: string): Ride[] {
	return useDbStore
		.getState()
		.db.rides.filter((r) => r.driverId === driverId);
}

export function bookingsForPassenger(passengerId: string): Booking[] {
	return useDbStore
		.getState()
		.db.bookings.filter((b) => b.passengerId === passengerId);
}

export function ridesByIds(ids: string[]): Ride[] {
	const { rides } = useDbStore.getState().db;
	return rides.filter((r) => ids.includes(r.id));
}
