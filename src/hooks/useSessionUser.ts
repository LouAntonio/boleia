import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../store/appStore';
import { fetchSession, type ApiUser } from '../lib/api';
import { initials } from '../lib/format';

/**
 * Identificador do utilizador da sessão.
 *
 * Antes devolvia `u_me_001` quando não havia sessão, um id do mock. Com a app
 * ligada ao backend, um id inventado faria a app mostrar e editar dados de
 * outra pessoa; por isso devolve `null` e quem chama decide o que fazer.
 */
export function useSessionUserId(): string | null {
	return useAppStore((s) => s.sessionUserId);
}

/**
 * O utilizador autenticado, lido do backend.
 *
 * Não é preciso devolver `undefined`: a sessão é carregada no arranque e o
 * `signIn` do store guarda o `userId` que o backend devolveu. A query
 * revalida por cima para manter o nome e a foto actualizados.
 */
export function useSessionUser(): ApiUser | null {
	const userId = useSessionUserId();
	return (
		useQuery({
			queryKey: ['session', userId],
			queryFn: fetchSession,
			enabled: !!userId,
			staleTime: 5 * 60 * 1000,
		}).data?.user ?? null
	);
}

/**
 * Iniciais para o avatar, a partir do utilizador da sessão.
 *
 * `ApiUser` traz `name` e `surname` separados, ao contrário do `BoleiaUser` do
 * mock, por isso as iniciais são compostas aqui e não no componente.
 */
export function useSessionInitials(): string {
	const user = useSessionUser();
	if (!user) return '?';
	const first = (user.name ?? '').trim();
	const last = (user.surname ?? '').trim();
	if (!first && !last) return '?';
	return initials(first || '?', last || '?');
}
