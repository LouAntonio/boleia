/**
 * Formatadores puros, partilhados pela app.
 *
 * Vivem fora de `src/mock` de propósito: continuam a ser necessários depois de
 * a app deixar de ter dados simulados, e um formatador não é um mock. Nenhum
 * destes funções toca em estado, rede ou relógio, excepto onde indicado.
 */

/** Iniciais para o avatar: "Lourenço António" -> "LA". */
export function initials(firstName: string, lastName: string): string {
	return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/** 1234567 -> "1 234 567 Kz". */
export function fmtKz(value: number): string {
	const int = Math.round(value);
	const grouped = int.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
	return `${grouped} Kz`;
}

/** Input de preço: 10000 -> "10 000" (só dígitos, agrupados por milhar). */
export function formatKzInput(raw: string): string {
	const digits = raw.replace(/\D/g, '').slice(0, 8);
	return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function parseKzInput(raw: string): number {
	return Math.max(0, Number(raw.replace(/\D/g, '')) || 0);
}

/** "08:30" na hora local do dispositivo. */
export function hhmm(iso: string): string {
	const d = new Date(Date.parse(iso));
	return `${String(d.getHours()).padStart(2, '0')}:${String(
		d.getMinutes(),
	).padStart(2, '0')}`;
}

export function fmtDate(iso: string): string {
	const d = new Date(Date.parse(iso));
	return d.toLocaleDateString('pt-PT', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	});
}

/** Minutos de espera até `iso`, para as mensagens de contagem decrescente. */
export function sleepMinutesUntil(iso: string): number {
	const diff = Math.floor((Date.parse(iso) - Date.now()) / 60000);
	return Math.max(0, diff);
}

/** 265 -> "4h25". */
export function fmtDuration(totalMinutes: number): string {
	const m = Math.max(0, totalMinutes);
	const h = Math.floor(m / 60);
	const r = m % 60;
	if (h === 0) return `${r}min`;
	return r === 0 ? `${h}h` : `${h}h${String(r).padStart(2, '0')}`;
}

export function durationBetween(fromISO: string, toISO: string): string {
	return fmtDuration(
		Math.round((Date.parse(toISO) - Date.parse(fromISO)) / 60000),
	);
}

/** Remove acentos e baixa a caixa, para comparar nomes de localidades. */
export function toAscii(text: string): string {
	return text
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase();
}

/** Distância em km entre duas coordenadas (Haversine). */
export function kmBetween(
	lat1: number,
	lng1: number,
	lat2: number,
	lng2: number,
): number {
	const R = 6371;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLng / 2) ** 2;
	return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
