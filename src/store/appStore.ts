import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Role } from '../types/boleia';

type AppState = {
	currentRole: Role;
	onboardingSeen: boolean;
	authenticated: boolean; // sessão iniciada (tel + senha)
	sessionUserId: string | null; // utilizador da sessão (sessão dinâmica)
	setRole: (role: Role) => void;
	toggleRole: () => void;
	completeOnboarding: () => void;
	signIn: (userId: string) => void;
	signOut: () => void;
};

export const useAppStore = create<AppState>()(
	persist(
		(set) => ({
			currentRole: 'passenger',
			onboardingSeen: false,
			authenticated: false,
			sessionUserId: null,
			setRole: (role) => set({ currentRole: role }),
			toggleRole: () =>
				set((s) => ({
					currentRole:
						s.currentRole === 'passenger' ? 'driver' : 'passenger',
				})),
			completeOnboarding: () => set({ onboardingSeen: true }),
			signIn: (userId) =>
				set({ authenticated: true, sessionUserId: userId }),
			signOut: () =>
				set({
					authenticated: false,
					currentRole: 'passenger',
					sessionUserId: null,
				}),
		}),
		{
			name: 'boleia-app',
			storage: createJSONStorage(() => AsyncStorage),
		},
	),
);
