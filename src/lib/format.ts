/**
 * Formatadores puros, partilhados pela app.
 *
 * Vivem fora de `src/mock` de propósito: continuam a ser necessários depois de
 * a app deixar de ter dados simulados, e um formatador não é um mock. Nenhum
 * destes funções toca em estado, rede ou relógio, excepto onde indicado.
 */

import { MONTHS_PT } from '../utils/date';

/** Iniciais para o avatar: "Lourenço António" -> "LA". */
/**
 * Iniciais a partir do nome e do apelido, **sem os inventar**.
 *
 * Antes devolvia `'?'.charAt(0)` para a parte em falta, o que punha um
 * interrogação no avatar de quem tem nome e não tem apelido — muito comum,
 * porque o registo só exige o primeiro nome. Uma interrogação não é uma
 * inicial: é um sinal de erro do sistema numa superfície que ninguém está a
 * ler como mensagem de erro.
 *
 * Sem nome nenhum devolve cadeia vazia, e é o `Avatar` que decide o que
 * desenhar nesse caso. Aqui só se Montgomery, ou a falta dela.
 */
export function initials(firstName: string, lastName: string): string {
	return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase().trim();
}

/**
 * Nome completo com o apelido a faltar quando não há.
 *
 * O backend guarda `surname` opcional; juntar os dois com `+` e cair no
 * `null` é o tipo de coisa que se reescreve mal três vezes no mesmo ecrã.
 */
export function fullName(firstName: string, lastName?: string | null): string {
	return [firstName.trim(), (lastName ?? '').trim()]
		.filter(Boolean)
		.join(' ');
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

/**
 * Angola é UTC+1 fixo, o ano inteiro. Não há horário de Verão.
 *
 * O backend já devolve as horas de paragem em WAT (`RideStop.timeLabel`,
 * formatado com `timeZone: 'Africa/Luanda'`). O cliente usava `getHours()`,
 * que é a hora **do dispositivo** — o mesmo itinerário mostrava a origem às
 * 06:00 e uma paragem às 07:20, quando a pessoa via 07:00 e 08:20.
 *
 * `slice(11, 16)` sobre a string ISO é pior ainda: devolve UTC a sério. Era o
 * que o painel do motorista fazia, e o erro não dependia do fuso do
 * telemóvel — estava sempre lá, uma hora fora.
 */
const WAT_OFFSET_MINUTES = 60;

/** A mesma data, deslocada para WAT. */
function inWat(iso: string): Date {
	const d = new Date(Date.parse(iso));
	if (Number.isNaN(d.getTime())) return d;
	return new Date(d.getTime() + WAT_OFFSET_MINUTES * 60 * 1000);
}

/** "08:30", em WAT. */
export function hhmm(iso: string): string {
	const d = inWat(iso);
	if (Number.isNaN(d.getTime())) return '';
	return `${String(d.getUTCHours()).padStart(2, '0')}:${String(
		d.getUTCMinutes(),
	).padStart(2, '0')}`;
}

/** "2026-03-12" em WAT, a partir de um ISO UTC. */
export function ymd(iso: string): string {
	const d = inWat(iso);
	if (Number.isNaN(d.getTime())) return '';
	return d.toISOString().slice(0, 10);
}

/** Data em WAT. O resto dos formatadores de data trabalha sobre WAT. */
export function dateOf(iso: string): Date {
	return inWat(iso);
}

/*
 * Nomes de data em português, escritos à mão de propósito.
 *
 * `toLocaleDateString('pt-PT', ...)` depende do ICU que o runtime traz. No
 * Hermes sem ICU completo (builds Android normais) o pedido é ignorado e sai
 * "Mar 12" ou "12 Mar" em inglês — dentro de um produto em PT-AO, ao lado de
 * "Talatona". Derivar de `MONTHS_PT` não depende do dispositivo e não
 * reintroduz a dependência de locale que vinha a dar outputs diferentes entre
 * iOS e Android.
 *
 * A tabela é a de `utils/date.ts`, que é a canónica do projecto. `WEEKDAY_PT`
 * de lá são iniciais de uma letra e não servem para texto corrido, por isso os
 * dias da semana completos ficam aqui.
 */
const PT_WEEKDAYS_SHORT = [
	'dom',
	'seg',
	'ter',
	'qua',
	'qui',
	'sex',
	'sáb',
] as const;

/** "12 mar" — o formato usado nos cartões de viagem. Espera uma data em WAT. */
export function fmtDayMonth(d: Date): string {
	return `${d.getUTCDate()} ${MONTHS_PT[d.getUTCMonth()].slice(0, 3).toLowerCase()}`;
}

/** "12 de março de 2026" — o formato das datas longas. */
export function fmtDayMonthYear(d: Date): string {
	return `${d.getUTCDate()} de ${MONTHS_PT[d.getUTCMonth()].toLowerCase()} de ${d.getUTCFullYear()}`;
}

/** "sex" — dia da semana abreviado, à segunda-feira. */
export function fmtWeekdayShort(d: Date): string {
	return PT_WEEKDAYS_SHORT[d.getUTCDay()];
}

export function fmtDate(iso: string): string {
	// Em WAT, como o resto: `getFullYear()` num instante UTC perto da meia-noite
	// dava o dia seguinte (ou o anterior) em WAT.
	const d = dateOf(iso);
	return `${fmtDayMonth(d)} ${d.getUTCFullYear()}`;
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

/**
 * Distância de uma paragem para o rótulo da UI.
 *
 * Devolve string vazia quando não há distância conhecida, e é isso que
 * `RouteStrip`/`TripStripCard` tratam como "omitir". O objectivo é nunca
 * escrever "0 km": lido ao lado de uma paragem, diz que a paragem está
 * colada à origem, e quem acredita nisso planeia a viagem errado.
 */
export function fmtKm(km: number | null | undefined): string {
	if (km == null || !Number.isFinite(km) || km <= 0) return '';
	const rounded = Math.round(km);
	return `${rounded} km`;
}

export function durationBetween(fromISO: string, toISO: string): string {
	const from = Date.parse(fromISO);
	const to = Date.parse(toISO);
	if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) {
		return 'Duração a confirmar';
	}
	return fmtDuration(Math.round((to - from) / 60000));
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
