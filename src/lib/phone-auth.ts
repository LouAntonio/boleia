/**
 * Os endpoints de telefone do Boleia.
 *
 * Não são rotas stock do better-auth: vêm de um plugin do backend
 * (`back/src/auth/phone-auth.ts`, id `boleia-phone-auth`), e por isso não têm
 * métodos gerados no `authClient`. É o que justifica este ficheiro existir, e
 * é o mesmo que faz o mesmo ficheiro no site (`boleia-web/src/lib/phone-auth.ts`).
 *
 * **Porque `$fetch` e não um client plugin com `$InferServerPlugin`,** que é o
 * caminho que a documentação sugere para endpoints customizados: o proxy do
 * cliente é dinâmico (`better-auth/dist/client/proxy.mjs:30` reconstrói o path
 * a partir da cadeia de propriedades), logo em runtime nada é preciso do
 * servidor. O `$InferServerPlugin` serviria só para os tipos — e esses teriam de
 * ser escritos à mão contra o `Endpoint` do `better-call`, duplicando os schemas
 * zod do backend. Uma segunda fonte de verdade para estes formatos de pedido é
 * pior do que os tipos ficarem aqui, ao lado dos tipos de entrada.
 *
 * O axios ficou com o REST da app; a autenticação vem pelo `authClient`, que é
 * quem sabe tratar a sessão em cookie no React Native. O `AuthRequestError`
 * traduz o `{ data, error }` do `better-fetch` para a forma de axios que o
 * `apiErrorMessage` (e os seis ecrãs que o usam) já sabe ler.
 */
import { authClient } from './auth-client';
import type { ApiUser } from './api';

export type OtpPurpose = 'signup' | 'reset';

export interface StatusResponse {
	status: boolean;
	/**
	 * Cópia temporária do OTP, só quando o backend tem
	 * `OTP_PREVIEW_IN_RESPONSE` ligado. Com WAME a funcionar este campo não vem
	 * e a app mantém o comportamento normal.
	 */
	otp?: string;
}

export interface SignUpInput {
	phone: string;
	password: string;
	name: string;
	surname?: string;
	email?: string;
	termsAccepted: boolean;
	marketingAccepted?: boolean;
}

export interface OtpVerified {
	status?: boolean;
	token?: string;
	expiresAt?: string;
}

/**
 * Erro do cliente do better-auth, com a forma que o `apiErrorMessage` já lê.
 *
 * O `better-fetch` devolve `{ data, error }` e não faz `throw`; o axios faz
 * `throw` e traz `response.data.message`. Esta classe é a costura entre as duas,
 * para que os ecrãs de auth não tenham de saber de que cliente veio a falha.
 */
export class AuthRequestError extends Error {
	readonly response: {
		status?: number;
		data: { message?: string; code?: string };
	};

	constructor(message: string, status?: number, code?: string) {
		super(message);
		this.name = 'AuthRequestError';
		this.response = { status, data: { message, code } };
	}
}

/** Lê `{ error, data }` do `better-fetch` e transforma em excepção. */
function toRequestError(
	result: { data: unknown; error: unknown },
	fallback: string,
): AuthRequestError | null {
	if (!result.error) return null;

	const err = result.error as {
		message?: unknown;
		status?: unknown;
		statusCode?: unknown;
		code?: unknown;
		body?: { message?: unknown; code?: unknown };
	};

	const message =
		(typeof err?.message === 'string' && err.message) ||
		(typeof err?.body?.message === 'string' && err.body.message) ||
		fallback;
	const status =
		(typeof err?.status === 'number' && err.status) ||
		(typeof err?.statusCode === 'number' && err.statusCode) ||
		undefined;
	const code =
		(typeof err?.code === 'string' && err.code) ||
		(typeof err?.body?.code === 'string' && err.body.code) ||
		undefined;

	return new AuthRequestError(message, status, code);
}

/**
 * `POST /api/auth/phone/sign-in`
 *
 * Não guarda o token: o `expoClient` guarda a sessão, em cookie, no
 * SecureStore. O `set-auth-token` continua a vir no header porque o plugin
 * `bearer` do servidor o escreve para clientes sem cookies — é de onde o
 * `auth-cookie.ts` tira o valor de que o gateway do WebSocket precisa.
 */
export async function signInPhone(
	phone: string,
	password: string,
): Promise<{ user: ApiUser }> {
	const result = await authClient.$fetch('/phone/sign-in', {
		method: 'POST',
		body: { phone, password },
	});
	const error = toRequestError(
		result,
		'Número de telefone ou senha inválidos.',
	);
	if (error) throw error;

	return {
		user:
			(result.data as { user?: ApiUser } | null)?.user ?? ({} as ApiUser),
	};
}

/** Regista a conta. Não abre sessão: segue-se a confirmação por OTP. */
export async function signUp(input: SignUpInput): Promise<StatusResponse> {
	const result = await authClient.$fetch('/phone/sign-up', {
		method: 'POST',
		body: input,
	});
	const error = toRequestError(result, 'Não foi possível criar a conta.');
	if (error) throw error;
	return (result.data ?? { status: true }) as StatusResponse;
}

export async function sendOtp(
	phone: string,
	purpose: OtpPurpose,
): Promise<StatusResponse> {
	const result = await authClient.$fetch('/phone/otp/send', {
		method: 'POST',
		body: { phone, purpose },
	});
	const error = toRequestError(result, 'Não foi possível enviar o código.');
	if (error) throw error;
	return (result.data ?? { status: true }) as StatusResponse;
}

/**
 * `POST /api/auth/phone/otp/verify`
 *
 * Com `purpose: 'reset'` devolve um `token` de recuperação válido só para a
 * chamada seguinte a `/reset-password` — e por isso viaja no `param` da rota em
 * vez de ir para o SecureStore.
 */
export async function verifyOtpCode(
	phone: string,
	purpose: OtpPurpose,
	code: string,
): Promise<OtpVerified> {
	const result = await authClient.$fetch('/phone/otp/verify', {
		method: 'POST',
		body: { phone, purpose, code },
	});
	const error = toRequestError(result, 'Código inválido ou expirado.');
	if (error) throw error;
	return (result.data ?? {}) as OtpVerified;
}

export async function resetPassword(
	token: string,
	newPassword: string,
): Promise<StatusResponse> {
	const result = await authClient.$fetch('/reset-password', {
		method: 'POST',
		body: { token, newPassword },
	});
	const error = toRequestError(result, 'Não foi possível redefinir a senha.');
	if (error) throw error;
	return (result.data ?? { status: true }) as StatusResponse;
}
