import * as SecureStore from 'expo-secure-store';
import { storageAdapter } from '@better-auth/expo/client';

/**
 * O amoijo do cookie da sessão, partilhado com o `expoClient`.
 *
 * O `expoClient` (em `auth-client.ts`) guarda o cookie no SecureStore sob
 * `${storagePrefix}_cookie` e embrulha o `SecureStore` num adapter próprio,
 * que reparte valores largos por várias chaves (o SecureStore rejeita
 * strings além de ~1800 bytes). Este ficheiro cria o **mesmo** adapter sobre
 * o **mesmo** prefixo, para que quem escreve a partir de fora do cliente
 * (o listener do deep link do link mágico) escreva no sítio certo — sem
 * inventar um segundo esquema de chaves.
 *
 * **Nada aqui lê o cookie directamente.** Para enviar ao servidor ou ao
 * socket, é `authClient.getCookie()` (ou `sessionCookieHeader`), que interpreta
 * o JSON e devolve a linha `Cookie`. Aqui só se escreve.
 */

/** Tem de ser igual ao `storagePrefix` passado ao `expoClient`. */
export const STORAGE_PREFIX = 'boleia' as const;

/** Chave onde vive o cookie serializado. */
export const COOKIE_KEY = `${STORAGE_PREFIX}_cookie`;

/** O mesmo adapter que o `expoClient` usa por trás. */
export const cookieStorage = storageAdapter(SecureStore);
