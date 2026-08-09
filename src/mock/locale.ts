// Locale Angola — localidades, províncias, rotas-tipo do demo
import { Locality, RouteStop } from '../types/boleia';
import { toAscii } from './helpers';

export const LOCALITIES: Locality[] = [
	// Província de Luanda
	{
		id: 'lad_talatona',
		province: 'Luanda',
		municipality: 'Talatona',
		name: 'Talatona',
		lat: -8.9389,
		lng: 13.1676,
		isMajor: true,
	},
	{
		id: 'lad_viana',
		province: 'Luanda',
		municipality: 'Viana',
		name: 'Viana',
		lat: -8.8991,
		lng: 13.3623,
		isMajor: false,
	},
	{
		id: 'lad_cazenga',
		province: 'Luanda',
		municipality: 'Cazenga',
		name: 'Cazenga',
		lat: -8.8033,
		lng: 13.2496,
		isMajor: false,
	},
	{
		id: 'lad_cacuaco',
		province: 'Luanda',
		municipality: 'Cacuaco',
		name: 'Cacuaco',
		lat: -8.7733,
		lng: 13.3844,
		isMajor: false,
	},
	{
		id: 'lad_maianga',
		province: 'Luanda',
		municipality: 'Maianga',
		name: 'Maianga',
		lat: -8.8232,
		lng: 13.2424,
		isMajor: true,
	},
	// Bengo
	{
		id: 'bgo_caxito',
		province: 'Bengo',
		municipality: 'Caxito',
		name: 'Caxito',
		lat: -8.5786,
		lng: 13.6644,
		isMajor: true,
	},
	// Cuanza Sul
	{
		id: 'csu_porto_amboim',
		province: 'Cuanza Sul',
		municipality: 'Porto Amboim',
		name: 'Porto Amboim',
		lat: -10.7319,
		lng: 13.7572,
		isMajor: true,
	},
	{
		id: 'csu_sumbe',
		province: 'Cuanza Sul',
		municipality: 'Sumbe',
		name: 'Sumbe',
		lat: -11.2032,
		lng: 13.8437,
		isMajor: true,
	},
	{
		id: 'csu_gabela',
		province: 'Cuanza Sul',
		municipality: 'Gabela',
		name: 'Gabela',
		lat: -10.8514,
		lng: 14.3799,
		isMajor: false,
	},
	// Benguela
	{
		id: 'bgu_benguela',
		province: 'Benguela',
		municipality: 'Benguela',
		name: 'Benguela',
		lat: -12.5763,
		lng: 13.403,
		isMajor: true,
	},
	{
		id: 'bgu_lobito',
		province: 'Benguela',
		municipality: 'Lobito',
		name: 'Lobito',
		lat: -12.363,
		lng: 13.5276,
		isMajor: true,
	},
	{
		id: 'bgu_catumbela',
		province: 'Benguela',
		municipality: 'Catumbela',
		name: 'Catumbela',
		lat: -12.4299,
		lng: 13.5411,
		isMajor: false,
	},
	// Huambo
	{
		id: 'hbo_huambo',
		province: 'Huambo',
		municipality: 'Huambo',
		name: 'Huambo',
		lat: -12.7665,
		lng: 15.7391,
		isMajor: true,
	},
	// Huíla
	{
		id: 'hla_lubango',
		province: 'Huíla',
		municipality: 'Lubango',
		name: 'Lubango',
		lat: -14.9172,
		lng: 13.4925,
		isMajor: true,
	},
	// Namibe
	{
		id: 'hna_moçâmedes',
		province: 'Namibe',
		municipality: 'Moçâmedes',
		name: 'Moçâmedes',
		lat: -15.1924,
		lng: 12.1487,
		isMajor: true,
	},
	// Zaire
	{
		id: 'zai_soyo',
		province: 'Zaire',
		municipality: 'Soyo',
		name: 'Soyo',
		lat: -6.139,
		lng: 12.3797,
		isMajor: true,
	},
	{
		id: 'zai_mbaza_congo',
		province: 'Zaire',
		municipality: 'Mbanza Congo',
		name: 'Mbanza Congo',
		lat: -6.267,
		lng: 14.2403,
		isMajor: true,
	},
	// Malanje
	{
		id: 'mal_malanje',
		province: 'Malanje',
		municipality: 'Malanje',
		name: 'Malanje',
		lat: -9.5383,
		lng: 16.3512,
		isMajor: true,
	},
	// Cuanza Norte
	{
		id: 'cno_ndalatando',
		province: 'Cuanza Norte',
		municipality: "N'dalatando",
		name: "N'dalatando",
		lat: -9.2981,
		lng: 14.9164,
		isMajor: true,
	},
	// Lunda Norte
	{
		id: 'lno_dundo',
		province: 'Lunda Norte',
		municipality: 'Dundo',
		name: 'Dundo',
		lat: -7.3799,
		lng: 20.8324,
		isMajor: true,
	},
	// Lunda Sul
	{
		id: 'lsu_saurimo',
		province: 'Lunda Sul',
		municipality: 'Saurimo',
		name: 'Saurimo',
		lat: -9.6607,
		lng: 20.3915,
		isMajor: true,
	},
	// Bié
	{
		id: 'bie_cuito',
		province: 'Bié',
		municipality: 'Cuito',
		name: 'Cuito',
		lat: -12.3848,
		lng: 16.9447,
		isMajor: true,
	},
	// Uíge
	{
		id: 'uig_uige',
		province: 'Uíge',
		municipality: 'Uíge',
		name: 'Uíge',
		lat: -7.6087,
		lng: 15.0587,
		isMajor: true,
	},
	// Cabinda
	{
		id: 'cab_cabinda',
		province: 'Cabinda',
		municipality: 'Cabinda',
		name: 'Cabinda',
		lat: -5.5595,
		lng: 12.1912,
		isMajor: true,
	},
	// Moxico
	{
		id: 'mox_luena',
		province: 'Moxico',
		municipality: 'Luena',
		name: 'Luena',
		lat: -11.786,
		lng: 19.907,
		isMajor: true,
	},
	// Cuando Cubango
	{
		id: 'cub_menongue',
		province: 'Cuando Cubango',
		municipality: 'Menongue',
		name: 'Menongue',
		lat: -14.6586,
		lng: 17.6905,
		isMajor: true,
	},
];

export const municipalities: string[] = [
	'Talatona',
	'Viana',
	'Cazenga',
	'Porto Amboim',
	'Sumbe',
	'Benguela',
	'Lobito',
	'Catumbela',
	'Cabinda',
	'Soyo',
	'Caxito',
	'Cuito',
	'Dundo',
	'Huambo',
	'Lubango',
	'Luena',
	'Malanje',
	'Moçâmedes',
	'Mbanza Congo',
	'Menongue',
	'Ndalatando',
	'Saurimo',
	'Uíge',
	'Gabela',
];

// localidades "majors" — paragens/centros usados nas pickers
export const MAJOR_LOCALITIES: Locality[] = LOCALITIES.filter((l) => l.isMajor);

export function localityById(id: string): Locality {
	return LOCALITIES.find((l) => l.id === id) ?? LOCALITIES[0];
}

export function searchLocalities(query: string, limit = 8): Locality[] {
	const q = toAscii(query.trim());
	if (!q) return [];
	const matches = LOCALITIES.filter(
		(l) =>
			toAscii(l.name).includes(q) ||
			toAscii(l.municipality).includes(q) ||
			toAscii(l.province).includes(q),
	);
	return matches.slice(0, limit);
}

export const ROUTE_LUANDA_BENGUELA = (departureISO: string): RouteStop[] => {
	const [h, m] = ['06', '00'];
	const base = new Date(departureISO);
	base.setHours(Number(h), Number(m), 0, 0);
	const at = (minutes: number) => {
		const t = new Date(base.getTime() + minutes * 60000);
		return `${String(t.getHours()).padStart(2, '0')}:${String(
			t.getMinutes(),
		).padStart(2, '0')}`;
	};
	return [
		{ localityId: 'lad_talatona', name: 'Talatona', time: at(0), km: 0 },
		{ localityId: 'lad_viana', name: 'Viana', time: at(25), km: 20 },
		{
			localityId: 'csu_porto_amboim',
			name: 'Porto Amboim',
			time: at(195),
			km: 270,
		},
		{ localityId: 'csu_sumbe', name: 'Sumbe', time: at(255), km: 345 },
	];
};

export const ROUTE_BENGUELA_LUANDA = (departureISO: string): RouteStop[] => {
	const base = new Date(departureISO);
	base.setHours(7, 0, 0, 0);
	const at = (minutes: number) => {
		const t = new Date(base.getTime() + minutes * 60000);
		return `${String(t.getHours()).padStart(2, '0')}:${String(
			t.getMinutes(),
		).padStart(2, '0')}`;
	};
	return [
		{ localityId: 'bgu_benguela', name: 'Benguela', time: at(0), km: 0 },
		{ localityId: 'csu_sumbe', name: 'Sumbe', time: at(115), km: 135 },
		{
			localityId: 'csu_porto_amboim',
			name: 'Porto Amboim',
			time: at(175),
			km: 210,
		},
		{ localityId: 'lad_viana', name: 'Viana', time: at(400), km: 460 },
	];
};
