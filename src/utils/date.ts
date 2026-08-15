// Datas — chaves 'yyyy-mm-dd' locais e calendário pt-PT (semana começa 2ª feira)

export const MONTHS_PT = [
	'Janeiro',
	'Fevereiro',
	'Março',
	'Abril',
	'Maio',
	'Junho',
	'Julho',
	'Agosto',
	'Setembro',
	'Outubro',
	'Novembro',
	'Dezembro',
];

export const WEEKDAY_PT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function toDateKey(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export function todayKey(): string {
	return toDateKey(new Date());
}

export function fromDateKey(key: string): Date {
	const [y, m, d] = key.split('-').map(Number);
	return new Date(y, m - 1, d);
}

export function daysInMonth(year: number, month: number): number {
	return new Date(year, month + 1, 0).getDate();
}

// Grelha do mês: 0 = célula vazia, senão o dia. Alinhada a 2ª feira.
export function calendarCells(year: number, month: number): number[] {
	const first = new Date(year, month, 1);
	const offset = (first.getDay() + 6) % 7;
	const cells = Array<number>(offset).fill(0);
	const total = daysInMonth(year, month);
	for (let d = 1; d <= total; d++) cells.push(d);
	while (cells.length % 7 !== 0) cells.push(0);
	return cells;
}

export function fmtDayShort(key: string): string {
	const d = fromDateKey(key);
	return `${d.getDate()} ${MONTHS_PT[d.getMonth()].slice(0, 3).toLowerCase()}`;
}

export function fmtDayLong(key: string): string {
	const d = fromDateKey(key);
	return d.toLocaleDateString('pt-PT', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
	});
}

export function fmtRange(from: string, to: string): string {
	if (!from && !to) return 'Qualquer dia';
	if (!to || from === to) return fmtDayShort(from);
	return `${fmtDayShort(from)} → ${fmtDayShort(to)}`;
}

export function isBefore(a: string, b: string): boolean {
	return a < b;
}
