import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { getSetCookie } from '@better-auth/expo/client';
import { useQueryClient } from '@tanstack/react-query';
import { navigationRef } from '../lib/navigationRef';
import { authClient, sessionUserFrom } from '../lib/auth-client';
import { COOKIE_KEY, cookieStorage } from '../lib/cookie-storage';

/**
 * Recebe o deep link do link mágico e transforma-o em sessão.
 *
 * ## Porque é que precisa de existir
 *
 * O link mágico nasce com o `callbackURL` convertido em deep link
 * (`boleia:///…`). Quem abre o link no browser cai no servidor, que valida
 * o token e responde 302 — e o plugin `expo()` do servidor faz o gesto que
 * interessa: como o redirect não é http(s), anexa o `Set-Cookie` da sessão
 * ao `location` como `?cookie=…`, porque **um deep link não tem cookie
 * jar**. Depois disso a app é aberta por cima com algo como
 *
 * ```
 * boleia:///…?cookie=better-auth.session_token%3D…%3B+Max-Age%3D…
 * ```
 *
 * A sessão não chega por magia: alguém tem de tirar o `cookie` da URL e
 * escrevê-lo no SecureStore sob a mesma chave que o `expoClient` lê.
 * `getSetCookie` é a conversão (header → JSON com expiração) e
 * `cookieStorage` o armazenamento — ambos de `@better-auth/expo/client`, o
 * mesmo esquema de repartição de valores largos do cliente. Depois
 * `authClient.getSession()` revalida com o cookie novo e actualiza o átomo
 * do `useSession`, que é o que os ecrãs lêem.
 *
 * ## Erro
 *
 * Sem `cookie=` na URL é verify falhado (token gasto ou expirado) — não se
 * navega, e quem está no ecrã de login fica lá. Um link consumido duas
 * vezes (recarregar de novo) também não manda `cookie`: nada acontece. O
 * `lastUrl` guarda o último link processado para o iOS, que entrega o
 * mesmo evento duas vezes, não repetir o reset de navegação.
 */
export function useMagicLinkResume() {
	const lastUrl = useRef<string | null>(null);
	const store = useQueryClient();

	useEffect(() => {
		if (Platform.OS === 'web') return;

		let cancelled = false;

		const resume = async (deepLink: string) => {
			if (deepLink === lastUrl.current) return;
			lastUrl.current = deepLink;

			const { queryParams } = Linking.parse(deepLink);
			const raw = queryParams?.cookie;
			if (typeof raw !== 'string' || raw.length === 0) return;

			try {
				const previous = await cookieStorage.getItemAsync(COOKIE_KEY);
				await cookieStorage.setItemAsync(
					COOKIE_KEY,
					getSetCookie(raw, previous ?? undefined),
				);
			} catch {
				return; // cookie ilegível: sem sessão não há onde navegar.
			}

			const { data } = await authClient.getSession();
			if (cancelled) return;

			if (data?.user) {
				store.invalidateQueries();
				// O mesmo critério do login por telefone: sem nome, há
				// um passo de perfil primeiro.
				if (sessionUserFrom(data.user).name) {
					navigationRef.reset({
						index: 0,
						routes: [{ name: 'App', params: { screen: 'Main' } }],
					});
				} else {
					navigationRef.reset({
						index: 0,
						routes: [
							{
								name: 'Auth',
								params: {
									screen: 'ProfileSetup',
									params: { userId: data.user.id as string },
								},
							},
						],
					});
				}
			}
		};

		const onUrl = ({ url }: { url: string }) => {
			void resume(url);
		};

		const subscription = Linking.addEventListener('url', onUrl);
		// A app aberta de fresco por um clique no email: o evento 'url' não
		// dispara, mas a URL inicial carrega o mesmo `cookie`.
		void Linking.getInitialURL().then((initial) => {
			if (initial) void resume(initial);
		});

		return () => {
			cancelled = true;
			subscription.remove();
		};
	}, [store]);
}
