import { authClient, sessionUserFrom } from '../lib/auth-client';
import { initials } from '../lib/format';

/**
 * Identificador do utilizador da sessão.
 *
 * Vem do `authClient`, que é quem tem a sessão. Antes vinha de
 * `appStore.sessionUserId`, que era uma cópia — e duas fontes que podem
 * discordar dão ecrãs vazios dentro da app, sem erro nenhum.
 *
 * `null` sem sessão, nunca um id inventado: um id de recurso que não é desta
 * pessoa faria a app mostrar e editar dados de outra.
 */
export function useSessionUserId(): string | null {
	const { data } = authClient.useSession();
	return data?.user?.id ?? null;
}

/**
 * O utilizador autenticado.
 *
 * Já não há `fetchSession()` a fazer isto à mão. O `useSession()` do
 * `authClient` mantém a sessão em memória e revalida-a sozinho, com o mesmo
 * mecanismo nos restantes ecrãs — o que evita oito ecrãs a disparar cada um o
 * seu pedido ao servidor para saber o mesmo nome.
 */
export function useSessionUser() {
	const { data } = authClient.useSession();
	return data?.user ? sessionUserFrom(data.user) : null;
}

/**
 * Iniciais para o avatar, a partir do utilizador da sessão.
 *
 * O utilizador traz `name` e `surname` separados, por isso as iniciais são
 * compostas aqui e não no componente.
 */
export function useSessionInitials(): string {
	const user = useSessionUser();
	if (!user) return '?';
	const first = (user.name ?? '').trim();
	const last = (user.surname ?? '').trim();
	if (!first && !last) return '?';
	return initials(first || '?', last || '?');
}
