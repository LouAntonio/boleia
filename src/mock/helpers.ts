// Utilidades do layer mock — latência simulada, ids, formatação
export const UID = {
	next(prefix: string): string {
		return `${prefix}_${Date.now().toString(36)}_${Math.random()
			.toString(36)
			.slice(2, 8)}`;
	},
};

export function delay(ms = 350): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pick<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

export function initials(firstName: string, lastName: string): string {
	return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// Moeda: 1234567 -> "1 234 567 Kz"
export function fmtKz(value: number): string {
	const int = Math.round(value);
	const grouped = int.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
	return `${grouped} Kz`;
}

export function nowISO(offsetMinutes = 0): string {
	return new Date(Date.now() + offsetMinutes * 60000).toISOString();
}

export function minutesOffset(iso: string): number {
	return Math.floor((Date.parse(iso) - Date.now()) / 60000);
}

// "08:30"
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

// Distância de Haversine (km) entre coordenadas
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

export function toAscii(text: string): string {
	return text
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase();
}

export function sleepMinutesUntil(iso: string): number {
	const diff = Math.floor((Date.parse(iso) - Date.now()) / 60000);
	return Math.max(0, diff);
}

// 265 minutos -> "4h25"
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
