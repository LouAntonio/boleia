import { useQueries, useQuery } from '@tanstack/react-query';
import { listLocalities, listProvinces, type ApiLocality } from '../lib/api';
import { qk } from '../lib/queryKeys';

/** As províncias e counties não mudam: o cache pode durar um dia. */
const REFY_TIME = 24 * 60 * 60 * 1000;

export function useProvinces() {
	return useQuery({
		queryKey: qk.localities.provinces,
		queryFn: listProvinces,
		staleTime: REFY_TIME,
		gcTime: REFY_TIME,
	});
}

/** Localidades de uma província. Desactivado sem `provinceId`. */
export function useLocalities(provinceId: string | null | undefined) {
	return useQuery({
		// `''` como chave de provinces-a-ninguém: a query está desactivada
		// abaixo, mas a chave tem de ser um array de strings estáveis — um
		// `undefined` dentro do array tornaria a identidade da query
		// imprevisível.
		queryKey: qk.localities.of(provinceId ?? ''),
		queryFn: () => listLocalities(provinceId as string),
		enabled: !!provinceId,
		staleTime: REFY_TIME,
		gcTime: REFY_TIME,
	});
}

/**
 * Todas as localidades, de todas as províncias.
 *
 * A pesquisa interprovincial precisa de filtrar por município em qualquer
 * província, mas o backend só expõe as localidades por província. Pedimos uma
 * vez por província, em paralelo, e o React Query trata do cache e do
 * deduplicar: abrir o picker outra vez não refaz pedidos.
 */
export function useAllLocalities() {
	const provinces = useProvinces();
	const results = useQueries({
		queries: (provinces.data ?? []).map((province) => ({
			queryKey: qk.localities.of(province.id),
			queryFn: () => listLocalities(province.id),
			staleTime: REFY_TIME,
			gcTime: REFY_TIME,
		})),
	});

	return results.flatMap((result) => result.data ?? []);
}

export function isLoadingLocalities(
	provinces: { isLoading: boolean } | undefined,
	results: { isLoading: boolean }[],
): boolean {
	return !!provinces?.isLoading || results.some((r) => r.isLoading);
}

/** Indexa localidades por id, para mostrar o nome sem refazer a busca. */
export function indexById(items: ApiLocality[]): Map<string, ApiLocality> {
	return new Map(items.map((item) => [item.id, item]));
}
