import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Role } from '../types/boleia';

type AppState = {
	currentRole: Role;
	onboardingSeen: boolean;
	profileReady: boolean; // perfil criado após OTP (Fase 1+)
	setRole: (role: Role) => void;
	toggleRole: () => void;
	completeOnboarding: () => void;
	markProfileReady: () => void;
};

export const useAppStore = create<AppState>()(
	persist(
		(set) => ({
			currentRole: 'passenger',
			onboardingSeen: false,
			profileReady: false,
			setRole: (role) => set({ currentRole: role }),
			toggleRole: () =>
				set((s) => ({
					currentRole:
						s.currentRole === 'passenger' ? 'driver' : 'passenger',
				})),
			completeOnboarding: () => set({ onboardingSeen: true }),
			markProfileReady: () => set({ profileReady: true }),
		}),
		{
			name: 'boleia-app',
			storage: createJSONStorage(() => AsyncStorage),
		},
	),
);
