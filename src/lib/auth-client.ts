import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@env';
import type { ApiUser } from './api';

/**
 * Cliente de autenticação oficial do better-auth para React Native.
 *
 * **Porquê o `expoClient` e não o plugin `bearer`.** O React Native não tem um
 * cookie jar: um `fetch` normal não guarda cookies entre pedidos, e menos ainda
 * entre arranques da app. O `expoClient` resolve isso guardando os cookies da
 * sessão em `SecureStore` e reenviando-os em cada pedido do `authClient` — é o
 * caminho oficial para Expo, e é o que torna `useSession()` fiável num ecrã que
 * abre sem rede e volta a ter.
 *
 * `scheme` e `storagePrefix` são o `scheme` do `app.json`, que é o que permite
 * ao Android abrir o deep-link do OAuth de volta para a app.
 *
 * **O WebSocket continua a precisar de um Bearer.** O gateway `/trips`
 * (`back/src/rides/trips.gateway.ts:216-232`) só lê `handshake.auth.token` e não
 * olha para cookies. Daí o `auth-cookie.ts`, que extrai o valor do cookie que o
 * `expoClient` guarda — ver a nota sobre a assinatura lá.
 */
export const authClient = createAuthClient({
	baseURL: API_URL,
	plugins: [
		expoClient({
			scheme: 'boleia',
			storagePrefix: 'boleia',
			storage: SecureStore,
		}),
	],
});

/** O utilizador da sessão no tipo que a app consome. */
export function sessionUserFrom(raw: unknown): ApiUser {
	const data = (raw ?? {}) as Record<string, unknown>;
	return {
		id: String(data.id ?? ''),
		name:
			data.name === null || data.name === undefined
				? null
				: String(data.name),
		surname: (data.surname as string | null) ?? null,
		email: String(data.email ?? ''),
		emailVerified: data.emailVerified === true,
		phone: (data.phone as string | null) ?? null,
		image: (data.image as string | null) ?? null,
		bio: (data.bio as string | null) ?? null,
		createdAt: (data.createdAt as string) ?? undefined,
	};
}
