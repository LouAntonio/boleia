import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useAppStore } from '../store/appStore';
import { connectSocket, disconnectSocket } from '../lib/socket';
import { registerPushDevice, unregisterPushDevice } from '../lib/api';

/**
 * Regista o dispositivo para push e mantém a ligação ao gateway `/trips`.
 *
 * Só corre com sessão iniciada: registar o token antes de haver utilizador
 * associaria o dispositivo a ninguém, e o backend exige autenticação. Ao
 * terminar a sessão a ligação é fechada e o token desregistado, para as
 * notificações deixarem de chegar a quem já saiu da conta neste aparelho.
 */
export function usePushRegistration(): void {
	const authenticated = useAppStore((s) => s.authenticated);

	useEffect(() => {
		if (!authenticated) {
			disconnectSocket();
			return;
		}

		void registerDeviceForPush()
			.catch(() => {
				// Um push que não regista não pode impedir a app de abrir.
			})
			.then(() => connectSocket());

		return () => {
			// Ao terminar a sessão, o token é desregistado para as notificações
			// deixarem de chegar a quem já saiu da conta neste aparelho. É
			// assíncrono e não é esperado: a app fecha-se na mesma.
			void currentPushToken()
				.then((token) =>
					token ? unregisterPushDevice(token) : undefined,
				)
				.catch(() => undefined);
			disconnectSocket();
		};
	}, [authenticated]);
}

/** O token de push deste dispositivo, se já houver um registado. */
async function currentPushToken(): Promise<string | null> {
	if (!Device.isDevice) {
		return null;
	}
	const existing = await Notifications.getPermissionsAsync();
	if (existing.status !== 'granted') {
		return null;
	}
	const { data } = await Notifications.getExpoPushTokenAsync();
	return data ?? null;
}

/**
 * Regista o token de push deste dispositivo no backend.
 *
 * Vive fora do hook porque há dois momentos em que faz sentido chamar: ao
 * arrancar com sessão iniciada, e quando o utilizador aceita a permissão num
 * ecrã. Se só estivesse no efeito, pedir a permissão depois de a app ter
 * arrancado deixaria o token por registar.
 */
export async function registerDeviceForPush(): Promise<void> {
	// Em simulador o push não existe, e o Expo devolve um token que não entrega
	// nada. Registá-lo só enche a base de dispositivos inúteis.
	if (!Device.isDevice) {
		return;
	}
	const existing = await Notifications.getPermissionsAsync();
	if (existing.status !== 'granted') {
		return;
	}
	const { data } = await Notifications.getExpoPushTokenAsync();
	if (!data) {
		return;
	}
	await registerPushDevice({
		token: data,
		platform: Platform.OS === 'ios' ? 'ios' : 'android',
	});
}

/** Pede permissão de notificações. Deve ser chamado a partir de um ecrã. */
export async function requestPushPermission(): Promise<boolean> {
	if (!Device.isDevice) {
		return false;
	}
	const current = await Notifications.getPermissionsAsync();
	if (current.status === 'granted') {
		return true;
	}
	const asked = await Notifications.requestPermissionsAsync();
	return asked.status === 'granted';
}

/** Cria o canal Android. Sem isto, as notificações Android não aparecem. */
export async function ensureAndroidChannel(): Promise<void> {
	if (Platform.OS === 'android') {
		await Notifications.setNotificationChannelAsync('boleia', {
			name: 'Boleia',
			importance: Notifications.AndroidImportance.HIGH,
			vibrationPattern: [0, 250, 250, 250],
			lightColor: '#0071EB',
		});
	}
}
