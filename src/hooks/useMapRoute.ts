import { useState } from 'react';
import { getRoute } from '../services/map';
import type { MapboxRoute } from '../types/api';

export function useMapRoute() {
	const [route, setRoute] = useState<MapboxRoute | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchRoute = async (
		origin: [number, number],
		destination: [number, number],
	) => {
		setIsLoading(true);
		setError(null);
		setRoute(null);

		try {
			const result = await getRoute(origin, destination);
			if (result) {
				setRoute(result);
			} else {
				setError('Rota não encontrada');
			}
		} catch {
			setError('Erro ao buscar rota');
		} finally {
			setIsLoading(false);
		}
	};

	const clearRoute = () => {
		setRoute(null);
		setError(null);
	};

	return { route, isLoading, error, fetchRoute, clearRoute };
}
