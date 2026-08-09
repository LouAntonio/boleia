// Acesso a dados mock — camada fina sobre a DB. Funções puras/síncronas
// (latência simulada no hook useMockCall, Fases 3+).
import { useDbStore } from '../db';
import { UID, nowISO } from '../helpers';
import { OtpChallenge, BoleiaUser, Booking, Ride } from '../../types/boleia';

// Código fixo do demo — visível nas próprias telas de login
export const DEMO_OTP = '773214';

export function normalizePhone(raw: string): string {
	return raw.replace(/\s+/g, '');
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

export function findOrCreateByPhone(phone: string): BoleiaUser {
	const existing = findByPhone(phone);
	if (existing) return existing;

	const user: BoleiaUser = {
		id: UID.next('u'),
		firstName: '',
		lastName: '',
		phone: normalizePhone(phone),
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
	return user;
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
