import { authClient } from './auth-client';

/**
 * O token de sessão, para quem não consegue usar cookies.
 *
 * Duas coisas na app não falam pelo `authClient` e precisam de uma credencial
 * por si:
 *
 * - **o axios** (`lib/api.ts`), que faz o REST inteiro da app;
 * - **o gateway `/trips`** (`lib/socket.ts`), que lê `handshake.auth.token`.
 *
 * Esta é a única fonte do valor para as duas. Der a cada uma o seu sítio seria
 * ter duas credenciais a poder divergir, e o sintoma — o WebSocket a falhar em
 * silêncio enquanto o REST funciona — não aparece em nenhum teste.
 *
 * **Porque o valor do cookie serve como Bearer.** O cookie da sessão do
 * better-auth tem a forma `<token>.<assinatura>`. O plugin `bearer` do
 * servidor (`better-auth/dist/plugins/bearer/index.mjs:33-43`) recebe
 * `Authorization: Bearer <valor>` e, se o valor tiver um ponto, usa-o tal e
 * qual e verifica a HMAC; se não tiver, assina-o ele próprio antes de verificar.
 * Ambos os caminhos servem, por isso o valor do cookie vai directo para o
 * `handshake`.
 *
 * **Porque isto atira em vez de devolver `undefined`.** O `socket.ts` só pode
 * falhar em silêncio: um `token` a menos no `auth` produz uma ligação que abre
 * e não recebe eventos, e um `token` a menos no header HTTP produz um 401 em
 * todo o lado. Um erro aqui é visível logo; um `undefined` não é.
 */

/** O nome do cookie de sessão, como o better-auth o grava. */
const SESSION_COOKIE = 'better-auth.session_token';

/**
 * O valor do cookie de sessão, já sem o prefixo `nome=`.
 *
 * Assíncrono porque o `expoClient` usa as APIs assíncronas do SecureStore
 * (mudança da 1.7): `getCookie()` devolve uma promessa.
 */
export async function sessionToken(): Promise<string> {
	const cookie = await authClient.getCookie();
	const value = readCookie(cookie, SESSION_COOKIE);

	if (!value) {
		throw new Error(
			'Sessão não encontrada. A app guardou o cookie com outro nome e não o consegue ler — volta a entrar.',
		);
	}
	return value;
}

/** O mesmo valor, ou `null` — para quando a ausência é uma resposta válida. */
export async function sessionTokenOrNull(): Promise<string | null> {
	const cookie = await authClient.getCookie();
	return readCookie(cookie, SESSION_COOKIE);
}

/** O header `Cookie` completo, para o axios. `null` se não houver sessão. */
export async function sessionCookieHeader(): Promise<string | null> {
	const cookie = await authClient.getCookie();
	return cookie && cookie.length > 0 ? cookie : null;
}

/**
 * O valor de um cookie numa cadeia `a=1; b=2`.
 *
 * `decodeURIComponent` porque o valor do better-auth é assinado e base64url —
 * pode vir com `%` escapado. Se não for um escape válido, devolve o tal e qual
 * em vez de rebentar: um cookie malformado é um problema de sessão, não uma
 * excepção de parsing que deva engolir a app.
 */
function readCookie(
	cookie: string | null | undefined,
	name: string,
): string | null {
	if (!cookie) return null;

	for (const part of cookie.split(';')) {
		const separator = part.indexOf('=');
		if (separator === -1) continue;
		if (part.slice(0, separator).trim() !== name) continue;

		const raw = part.slice(separator + 1).trim();
		if (!raw) return null;
		try {
			return decodeURIComponent(raw);
		} catch {
			return raw;
		}
	}
	return null;
}
