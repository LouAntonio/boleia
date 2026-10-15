import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Role } from '../types/boleia';

type AppState = {
	currentRole: Role;
	onboardingSeen: boolean;
	setRole: (role: Role) => void;
	toggleRole: () => void;
	completeOnboarding: () => void;
	/**
	 * Repõe o papel escolhido ao sair da sessão.
	 *
	 * Só resta isto do que antes era estado de autenticação. `authenticated` e
	 * `sessionUserId` saíram porque a sessão vive num cookie, gerido pelo
	 * `authClient` — que é a única fonte, e sabe responder sem rede. Duplicá-los
	 * aqui dava dois estados que podiam discordar, e o sintoma era a pessoa dentro
	 * do `BoleiaMainNavigator` com ecrãs vazios e nenhuma forma de sair sem
	 * passar pelo botão do perfil.
	 *
	 * O reset do papel é o que sobra de útil: quem entra a seguir no mesmo
	 * aparelho não herda o papel de quem saiu.
	 */
	resetAfterLogout: () => void;
};

export const useAppStore = create<AppState>()(
	persist(
		(set) => ({
			currentRole: 'passenger',
			onboardingSeen: false,
			setRole: (role) => set({ currentRole: role }),
			toggleRole: () =>
				set((s) => ({
					currentRole:
						s.currentRole === 'passenger' ? 'driver' : 'passenger',
				})),
			completeOnboarding: () => set({ onboardingSeen: true }),
			resetAfterLogout: () => set({ currentRole: 'passenger' }),
		}),
		{
			name: 'boleia-app',
			storage: createJSONStorage(() => AsyncStorage),
		},
	),
);
