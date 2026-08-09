import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeStore = {
	theme: ThemeMode;

	setTheme: (theme: ThemeMode) => void;
};

export const useThemeStore = create<ThemeStore>()(
	persist(
		(set) => ({
			theme: 'system',

			setTheme: (theme) => set({ theme }),
		}),
		{
			name: 'theme-storage',
			storage: {
				getItem: async (name) => {
					const value = await AsyncStorage.getItem(name);
					return value ? JSON.parse(value) : null;
				},
				setItem: async (name, value) => {
					await AsyncStorage.setItem(name, JSON.stringify(value));
				},
				removeItem: async (name) => {
					await AsyncStorage.removeItem(name);
				},
			},
		},
	),
);
