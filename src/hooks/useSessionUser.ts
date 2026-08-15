import { useDbStore } from '../mock/db';
import { useAppStore } from '../store/appStore';
import { BoleiaUser } from '../types/boleia';

export const DEFAULT_SESSION_USER_ID = 'u_me_001';

export function useSessionUserId(): string {
	return useAppStore((s) => s.sessionUserId) ?? DEFAULT_SESSION_USER_ID;
}

export function useSessionUser(): BoleiaUser | undefined {
	const sessionUserId = useSessionUserId();
	return useDbStore((s) => s.db.users.find((u) => u.id === sessionUserId));
}
