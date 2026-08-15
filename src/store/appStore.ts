import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Role } from '../types/boleia';

type AppState = {
	currentRole: Role;
	onboardingSeen: boolean;
	authenticated: boolean; // sessão iniciada (tel + senha)
	setRole: (role: Role) => void;
	toggleRole: () => void;
	completeOnboarding: () => void;
	signIn: () => void;
	signOut: () => void;
};

export const useAppStore = create<AppState>()(
	persist(
		(set) => ({
			currentRole: 'passenger',
			onboardingSeen: false,
			authenticated: false,
			setRole: (role) => set({ currentRole: role }),
			toggleRole: () =>
				set((s) => ({
					currentRole:
						s.currentRole === 'passenger' ? 'driver' : 'passenger',
				})),
			completeOnboarding: () => set({ onboardingSeen: true }),
			signIn: () => set({ authenticated: true }),
			signOut: () =>
				set({ authenticated: false, currentRole: 'passenger' }),
		}),
		{
			name: 'boleia-app',
			storage: createJSONStorage(() => AsyncStorage),
		},
	),
);
