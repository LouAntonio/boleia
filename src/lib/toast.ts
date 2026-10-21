import { useToastStore } from '../store/toastStore';

/** Mostra uma mensagem passageira no topo do ecrã. */
export function showToast(message: string, duration = 4000): void {
	useToastStore.getState().show(message, duration);
}

/**
 * Toast com o OTP devolvido temporariamente pelo backend.
 *
 * Sem `otp` não mostra nada: o fluxo normal já diz, no ecrã seguinte, que o
 * código foi enviado por WhatsApp. O tempo é longo porque o código tem de dar
 * para ler e escrever.
 */
export function showOtpToast(otp: string | undefined): void {
	if (!otp) return;
	showToast(`Código de verificação: ${otp}`, 15_000);
}
