// Locale Angola — 21 províncias, ~306 municípios (lista real) + rotas-tipo do demo
import { Locality, RouteStop } from '../types/boleia';
import { toAscii } from './helpers';

// Coordenadas representativas por província (usadas só para estimar distâncias
// no mock). Municípios não têm coordenadas próprias.
export const PROVINCE_COORDS: Record<string, { lat: number; lng: number }> = {
	// ordem de apresentação
	Luanda: { lat: -8.84, lng: 13.23 },
	'Icolo e Bengo': { lat: -9.1, lng: 13.7 },
	Bengo: { lat: -8.58, lng: 13.66 },
	Benguela: { lat: -12.58, lng: 13.4 },
	Bié: { lat: -12.38, lng: 16.94 },
	Cabinda: { lat: -5.55, lng: 12.19 },
	Cuando: { lat: -15.79, lng: 20.36 },
	Cubango: { lat: -14.66, lng: 17.69 },
	'Cuanza Norte': { lat: -9.3, lng: 14.92 },
	'Cuanza Sul': { lat: -11.2, lng: 13.84 },
	Cunene: { lat: -17.07, lng: 15.73 },
	Huambo: { lat: -12.77, lng: 15.74 },
	Huíla: { lat: -14.92, lng: 13.49 },
	'Lunda Norte': { lat: -7.38, lng: 20.83 },
	'Lunda Sul': { lat: -9.66, lng: 20.39 },
	Malanje: { lat: -9.54, lng: 16.35 },
	Moxico: { lat: -11.79, lng: 19.91 },
	'Moxico Oriental': { lat: -11.9, lng: 22.86 },
	Namibe: { lat: -15.19, lng: 12.15 },
	Uíge: { lat: -7.61, lng: 15.06 },
	Zaire: { lat: -6.27, lng: 14.24 },
};

export const PROVINCES: string[] = Object.keys(PROVINCE_COORDS);

// IDs que fogem ao slug automático (para manter compatibilidade com o seed/rotas)
const ID_OVERRIDES: Record<string, string> = {
	"M'Banza Kongo": 'mbaza_congo',
};

function slug(name: string): string {
	return toAscii(name)
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '');
}

type Mun = [name: string, hint?: string];

const SEED: { code: string; province: string; municipalities: Mun[] }[] = [
	{
		code: 'lad',
		province: 'Luanda',
		municipalities: [
			['Luanda'],
			['Belas'],
			['Cacuaco'],
			['Cazenga'],
			['Kilamba Kiaxi'],
			['Talatona'],
			['Viana'],
			['Samba'],
			['Sambizanga'],
			['Rangel'],
			['Maianga'],
			['Ingombota'],
			['Neves Bendinha'],
			['Ngola Kiluange'],
			['Estalagem'],
			['Kikolo'],
		],
	},
	{
		code: 'ieb',
		province: 'Icolo e Bengo',
		municipalities: [
			['Catete'],
			['Bela Vista'],
			['Bom Jesus'],
			['Cabiri'],
			['Cassoneca'],
			['Caculo Cahango'],
			['Quiminha'],
		],
	},
	{
		code: 'bgo',
		province: 'Bengo',
		municipalities: [
			['Dande', 'sede Caxito'],
			['Ambriz'],
			['Bula Atumba'],
			['Dembos', 'sede Quibaxe'],
			['Nambuangongo'],
			['Pango Aluquém'],
			['Canacassala'],
			['Mabubas'],
			['Ucua'],
			['Barra do Dande'],
		],
	},
	{
		code: 'bgu',
		province: 'Benguela',
		municipalities: [
			['Benguela'],
			['Baía Farta'],
			['Balombo'],
			['Bocoio'],
			['Caimbambo'],
			['Catumbela'],
			['Chongorói'],
			['Cubal'],
			['Ganda'],
			['Lobito'],
			['Dombe Grande'],
			['Casseque'],
			['Egito Praia'],
			['Canjala'],
			['Chicuma'],
			['Capupa'],
			['Catengue'],
			['Chila'],
			['Passe'],
			['Babaera'],
			['Tumbulo'],
		],
	},
	{
		code: 'bie',
		province: 'Bié',
		municipalities: [
			['Cuito'],
			['Andulo'],
			['Camacupa'],
			['Catabola'],
			['Chinguar'],
			['Chitembo'],
			['Cuemba'],
			['Cunhinga'],
			['Nharea'],
			['Calusinga'],
			['Cassumbe'],
			['Chivaulo'],
			['Ringoma'],
			['Umpulo'],
			['Chipeta'],
			['Cunje'],
			['Gamba'],
			['Mutumbo'],
			['Luando'],
			['Sande'],
		],
	},
	{
		code: 'cab',
		province: 'Cabinda',
		municipalities: [['Cabinda'], ['Belize'], ['Buco-Zau'], ['Cacongo']],
	},
	{
		code: 'cua',
		province: 'Cuando',
		municipalities: [
			['Mavinga'],
			['Calai'],
			['Dirico'],
			['Rivungo'],
			['Luengue'],
			['Maué'],
		],
	},
	{
		code: 'cub',
		province: 'Cubango',
		municipalities: [
			['Menongue'],
			['Cuchi'],
			['Cuito Cuanavale'],
			['Caiundo'],
			['Jamba Cueio'],
			['Cuelei'],
			['Cutato'],
		],
	},
	{
		code: 'cno',
		province: 'Cuanza Norte',
		municipalities: [
			['Cazengo', 'sede Ndalatando'],
			['Ambaca', 'sede Camabatela'],
			['Banga'],
			['Bolongongo'],
			['Cambambe', 'sede Dondo'],
			['Golungo Alto'],
			['Gonguembo'],
			['Lucala'],
			['Quiculungo'],
			['Samba Caju'],
			['Massangano'],
			['Canhoca'],
			['Luinga'],
			['Bindo'],
			['Tango'],
			['Quizenga'],
			['São Pedro da Quilemba'],
		],
	},
	{
		code: 'csu',
		province: 'Cuanza Sul',
		municipalities: [
			['Sumbe'],
			['Amboim', 'sede Gabela'],
			['Cassongue'],
			['Cela', 'sede Waku-Kungo'],
			['Conda'],
			['Ebo'],
			['Libolo', 'sede Calulo'],
			['Mussende'],
			['Porto Amboim'],
			['Quibala'],
			['Quilenda'],
			['Seles'],
			['Quissanje'],
			['Capolo'],
			['Botera'],
			['Dumbe'],
			['Atome'],
			['Cunjo'],
			['Pambangala'],
			['Assango'],
			['Kissanga Kasassa'],
			['Gungue'],
			['Ucu Seles'],
			['Quicombo'],
		],
	},
	{
		code: 'cun',
		province: 'Cunene',
		municipalities: [
			['Cuanhama', 'sede Ondjiva'],
			['Cahama'],
			['Curoca'],
			['Cuvelai'],
			['Namacunde'],
			['Ombadja', 'sede Xangongo'],
			['Môngua'],
			['Nehone'],
			['Naulila'],
			['Calueque'],
			['Humbe'],
			['Mucope'],
			['Oshimolo'],
		],
	},
	{
		code: 'hbo',
		province: 'Huambo',
		municipalities: [
			['Huambo'],
			['Bailundo'],
			['Caála'],
			['Catchiungo'],
			['Ecunha'],
			['Londuimbale'],
			['Longonjo'],
			['Mungo'],
			['Tchicala-Tcholohanga'],
			['Tchindjenje'],
			['Ucuma'],
			['Calenga'],
			['Catabola', 'Huambo'],
			['Hengue'],
			['Lepi'],
			['Sambo'],
		],
	},
	{
		code: 'hla',
		province: 'Huíla',
		municipalities: [
			['Lubango'],
			['Caconda'],
			['Cacula'],
			['Caluquembe'],
			['Gambos', 'sede Chiange'],
			['Chibia'],
			['Chicomba'],
			['Chipindo'],
			['Cuvango'],
			['Humpata'],
			['Jamba'],
			['Matala'],
			['Quilengues'],
			['Quipungo'],
			['Arimba'],
			['Hoque'],
			['Huíla-Sede'],
			['Capunda Cavilongo'],
			['Dongo'],
			['Galangue'],
			['Vicungo'],
			['Bambi'],
			['Cutenda'],
			['Negola'],
			['Quê'],
			['Sangueve'],
		],
	},
	{
		code: 'lno',
		province: 'Lunda Norte',
		municipalities: [
			['Chitato', 'sede Dundo'],
			['Cambulo'],
			['Capenda-Camulemba'],
			['Caungula'],
			['Cuango'],
			['Cuilo'],
			['Lóvua'],
			['Lubalo'],
			['Lucapa'],
			['Xá-Muteba'],
			['Canzar'],
			['Cafunfo'],
			['Luremo'],
			['Camissombo'],
			['Capaia'],
			['Iongo'],
			['Lovua-Sede'],
			['Caluango'],
		],
	},
	{
		code: 'lsu',
		province: 'Lunda Sul',
		municipalities: [
			['Saurimo'],
			['Cacolo'],
			['Dala'],
			['Muconda'],
			['Mona-Quimbundo'],
			['Muriege'],
			['Cassai Sul'],
			['Alto Chicapa'],
			['Cucumbi'],
			['Xassengue'],
		],
	},
	{
		code: 'mal',
		province: 'Malanje',
		municipalities: [
			['Malanje'],
			['Cacuso'],
			['Calandula'],
			['Cambundi-Catembo'],
			['Cangandala'],
			['Caombo'],
			['Cuaba Nzogo'],
			['Cunda-dia-Baze'],
			['Luquembo'],
			['Marimba'],
			['Massango'],
			['Mucari'],
			['Quessua'],
			['Quirima'],
			['Lombe'],
			['Quizenga'],
			['Kizagnamar'],
			['Caxinga'],
			['Cateco-Cangola'],
			['Mikixi'],
			['Milando'],
			['Capunda'],
			['Caribo'],
			['Tala Mungongo'],
		],
	},
	{
		code: 'mox',
		province: 'Moxico',
		municipalities: [
			['Moxico', 'sede Luena'],
			['Camanongue'],
			['Léua'],
			['Lucano'],
			['Cameia', 'sede Lumeje-Cameia'],
			['Luau'],
			['Luchazes'],
			['Cangamba'],
			['Cassamba'],
			['Cangumbe'],
			['Muangai'],
			['Tempué'],
		],
	},
	{
		code: 'moxo',
		province: 'Moxico Oriental',
		municipalities: [
			['Cazombo', 'sede Alto Zambeze'],
			['Cavungo'],
			['Luvuei'],
			['Lutembo'],
			['Mussuma'],
			['Sessa'],
		],
	},
	{
		code: 'hna',
		province: 'Namibe',
		municipalities: [
			['Moçâmedes'],
			['Bibala'],
			['Camucuio'],
			['Tômbua'],
			['Virei'],
			['Bentiaba'],
			['Lucira'],
			['Lola'],
			['Iona'],
		],
	},
	{
		code: 'uig',
		province: 'Uíge',
		municipalities: [
			['Uíge'],
			['Alto Cauale'],
			['Ambuíla'],
			['Bembe'],
			['Buengas'],
			['Bungo'],
			['Damba'],
			['Milunga'],
			['Mucaba'],
			['Negage'],
			['Puri'],
			['Quimbele'],
			['Quitexe'],
			['Santa Cruz'],
			['Sanza Pombo'],
			['Songo'],
			['Maquela do Zombo'],
			['Beu'],
			['Cuilo Futa'],
			['Icoca'],
			['Massau'],
			['Macocola'],
			['Macolo'],
			['Caluca'],
			['Quipedro'],
			['Lucunga'],
			['Nsosso'],
			['Cuilo Cambozo'],
			['Kinvuenga'],
			['Caiongo'],
			['Canacassala', 'Uíge'],
		],
	},
	{
		code: 'zai',
		province: 'Zaire',
		municipalities: [
			["M'Banza Kongo"],
			['Soyo'],
			['Nzeto'],
			['Cuimba'],
			['Tomboco'],
			['Noqui'],
			['Pedra do Feitiço'],
			['Kindege'],
			['Mussera'],
		],
	},
];

export const LOCALITIES: Locality[] = SEED.flatMap((p) =>
	p.municipalities.map(([name]) => ({
		id: `${p.code}_${ID_OVERRIDES[name] ?? slug(name)}`,
		province: p.province,
		municipality: name,
		name,
	})),
);

export const municipalities: string[] = LOCALITIES.map((l) => l.municipality);

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

// ---- Rotas-tipo do demo (paragens + tempos relativos à partida)
const routeStops = (
	departureISO: string,
	baseHour: number,
	legs: { id: string; name: string; km: number; min: number }[],
): RouteStop[] => {
	const base = new Date(departureISO);
	base.setHours(baseHour, 0, 0, 0);
	return legs.map((leg) => {
		const t = new Date(base.getTime() + leg.min * 60000);
		return {
			localityId: leg.id,
			name: leg.name,
			time: `${String(t.getHours()).padStart(2, '0')}:${String(
				t.getMinutes(),
			).padStart(2, '0')}`,
			km: leg.km,
		};
	});
};

export const ROUTE_LUANDA_BENGUELA = (departureISO: string): RouteStop[] =>
	routeStops(departureISO, 6, [
		{ id: 'lad_talatona', name: 'Talatona', km: 0, min: 0 },
		{ id: 'lad_viana', name: 'Viana', km: 20, min: 25 },
		{ id: 'csu_porto_amboim', name: 'Porto Amboim', km: 270, min: 195 },
		{ id: 'csu_sumbe', name: 'Sumbe', km: 345, min: 255 },
	]);

export const ROUTE_BENGUELA_LUANDA = (departureISO: string): RouteStop[] =>
	routeStops(departureISO, 7, [
		{ id: 'bgu_benguela', name: 'Benguela', km: 0, min: 0 },
		{ id: 'csu_sumbe', name: 'Sumbe', km: 135, min: 115 },
		{ id: 'csu_porto_amboim', name: 'Porto Amboim', km: 210, min: 175 },
		{ id: 'lad_viana', name: 'Viana', km: 460, min: 400 },
	]);

export const ROUTE_HUAMBO_LUBANGO = (departureISO: string): RouteStop[] =>
	routeStops(departureISO, 6, [
		{ id: 'hbo_huambo', name: 'Huambo', km: 0, min: 0 },
		{ id: 'hbo_caala', name: 'Caála', km: 40, min: 40 },
		{ id: 'hla_matala', name: 'Matala', km: 215, min: 230 },
		{ id: 'hla_lubango', name: 'Lubango', km: 300, min: 330 },
	]);

export const ROUTE_LUANDA_MALANJE = (departureISO: string): RouteStop[] =>
	routeStops(departureISO, 6, [
		{ id: 'lad_talatona', name: 'Talatona', km: 0, min: 0 },
		{ id: 'cno_cazengo', name: 'Cazengo', km: 190, min: 200 },
		{ id: 'mal_cacuso', name: 'Cacuso', km: 300, min: 320 },
		{ id: 'mal_malanje', name: 'Malanje', km: 350, min: 390 },
	]);
