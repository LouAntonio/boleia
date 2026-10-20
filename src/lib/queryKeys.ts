/**
 * Chaves de query do React Query, num sítio só.
 *
 * A regra do React Query é que a chave **é** a identidade do pedido: duas
 * queries com a mesma chave e `queryFn` diferentes não são duas queries, são
 * uma. A app tinha `queryKey: ['rides']` na Home (com `limit: 3`) e no
 * Explorar (com `limit: 50`). O React Query deduplicava, e quem montasse
 * primeiro decidia o que a outra via — a Home mostrava "Sem viagens ativas"
 * ao lado de uma lista com 50 resultados, ou o Explorar via 3. O mesmo
 * acontecia com `['myRides']` entre o Perfil (limite 100) e o Trips (limite
 * 50), e as contagens "Publicadas / Concluídas" podiam vir da lista errada.
 *
 * Nenhum teste apanha isto: cada ecrã, isoladamente, está correcto. É um
 * bug de composição, e a composição é o que este ficheiro serve para
 * tornar visível.
 *
 * ## `.all` é prefixo de verdade
 *
 * O `invalidateQueries` faz correspondência por prefixo, elemento a
 * elemento. `['myRides']` apanha `['myRides', 'list', {…}]`, mas **não**
 * apanha `['myRides:list', {…}]` — são cadeias diferentes. Por isso todo o
 * `.all` é o primeiro elemento e o resto da chave são filhos dele. Escrever
 * `myRides:list` como nome de topo quebraria a invalidação em silêncio: a
 * query continua a funcionar e só deixa de se atualizar sozinha.
 */

type QueryParams = Record<string, unknown>;

const child = (
	root: readonly string[],
	name: string,
	params?: QueryParams,
): readonly unknown[] => [
	...root,
	name,
	...(params && Object.keys(params).length > 0 ? [params] : []),
];

export const qk = {
	/** As corridas a partir de agora, para explorar. */
	rides: {
		all: ['rides'] as const,
		/** A pesquisa do Explorar. `limit` e a data fazem parte da chave. */
		search: (params: QueryParams) => child(['rides'], 'search', params),
		/** As três do topo da Home. */
		featured: (limit: number) =>
			child(['rides'], 'featured', { limit }) as readonly unknown[],
	},

	/** As corridas do próprio motorista. */
	myRides: {
		all: ['myRides'] as const,
		list: (params: QueryParams) => child(['myRides'], 'list', params),
	},

	/** As reservas do próprio passageiro. */
	myBookings: {
		all: ['myBookings'] as const,
	},

	/** Os pedidos de lugar de uma corrida, vista pelo motorista. */
	rideBookings: {
		all: ['rideBookings'] as const,
		of: (rideId: string) => ['rideBookings', rideId] as const,
	},

	ride: {
		all: ['ride'] as const,
		of: (rideId: string) => ['ride', rideId] as const,
	},

	notifications: {
		all: ['notifications'] as const,
	},

	vehicles: {
		all: ['vehicles'] as const,
	},

	kyc: {
		all: ['kyc'] as const,
	},

	eligibility: ['eligibility'] as const,
} as const;
