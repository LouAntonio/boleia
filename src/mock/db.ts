// Base de dados mock — zustand persist em AsyncStorage, semeadura na 1ª execução
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '../types/boleia';
import { seedDatabase } from './seed';

export const DB_VERSION = 2;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

type DbState = {
	db: Database;
	ready: boolean; // hidratação concluída
	setReady: () => void;
	// mutação imutável + persistida; dispara subscrições (mock de tempo real)
	mutate: (fn: (db: Database) => void) => void;
	reset: () => void;
};

export const useDbStore = create<DbState>()(
	persist(
		(set) => ({
			db: seedDatabase(),
			ready: false,
			setReady: () => set({ ready: true }),
			mutate: (fn) =>
				set((s) => {
					const next = clone(s.db);
					fn(next);
					return { db: next };
				}),
			reset: () => set({ db: seedDatabase() }),
		}),
		{
			name: 'boleia-db',
			version: DB_VERSION,
			storage: createJSONStorage(() => AsyncStorage),
			partialize: (s) => ({ db: s.db }),
			migrate: (persisted, version) => {
				if (version < DB_VERSION) {
					return { db: seedDatabase() };
				}
				return persisted as { db: Database };
			},
			onRehydrateStorage: () => (state) => {
				state?.setReady();
			},
		},
	),
);
