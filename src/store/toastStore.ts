import { create } from 'zustand';

interface ToastPayload {
	id: number;
	message: string;
}

interface ToastState {
	toast: ToastPayload | null;
	show: (message: string, duration?: number) => void;
	hide: () => void;
}

let hideTimer: ReturnType<typeof setTimeout> | null = null;

function clearTimer(): void {
	if (!hideTimer) return;
	clearTimeout(hideTimer);
	hideTimer = null;
}

/**
 * Um toast de cada vez, com temporizador gerido fora do React.
 *
 * O timer vive no módulo para que uma navegação — por exemplo do registo para
 * a confirmação do código — não o cancele nem deixe o toast preso.
 */
export const useToastStore = create<ToastState>((set) => ({
	toast: null,

	show: (message, duration = 4000) => {
		clearTimer();
		const id = Date.now();
		set({ toast: { id, message } });
		hideTimer = setTimeout(() => {
			set({ toast: null });
			hideTimer = null;
		}, duration);
	},

	hide: () => {
		clearTimer();
		set({ toast: null });
	},
}));
