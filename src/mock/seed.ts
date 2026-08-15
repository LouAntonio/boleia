// Dataset de demonstração — dados determinísticos + horários relativos a hoje
import {
	BoleiaUser,
	Booking,
	Ride,
	RouteStop,
	Review,
	InAppNotification,
	WalletTransaction,
	Database,
	SosEvent,
	OtpChallenge,
} from '../types/boleia';
import { nowISO } from './helpers';
import { mockHash } from './repos/authRepo';
import {
	ROUTE_LUANDA_BENGUELA,
	ROUTE_BENGUELA_LUANDA,
	ROUTE_HUAMBO_LUBANGO,
	ROUTE_LUANDA_MALANJE,
} from './locale';

const d = (offsetMin: number) => nowISO(offsetMin);

type RideTemplate = 'lad_bgu' | 'bgu_lad' | 'hbo_hla' | 'lad_mal';

const TEMPLATES: Record<RideTemplate, (departureISO: string) => RouteStop[]> = {
	lad_bgu: ROUTE_LUANDA_BENGUELA,
	bgu_lad: ROUTE_BENGUELA_LUANDA,
	hbo_hla: ROUTE_HUAMBO_LUBANGO,
	lad_mal: ROUTE_LUANDA_MALANJE,
};

// duração total estimada (min) com todas as paragens
const TRAVEL_MIN: Record<RideTemplate, number> = {
	lad_bgu: 440,
	bgu_lad: 440,
	hbo_hla: 330,
	lad_mal: 390,
};

export function seedDatabase(): Database {
	// ---- Utilizadores (3 contas demo — senha "senha" para todas)
	const users: BoleiaUser[] = [
		{
			id: 'u_me_001',
			firstName: 'Lourenço',
			lastName: 'António',
			phone: '930673691',
			password: mockHash('senha'),
			avatar: null,
			bio: 'Viajo entre Luanda e a costa para negócios e família.',
			rating: 4.8,
			ratingsCount: 12,
			kyc: {
				id: 'kyc_lourenco',
				userId: 'u_me_001',
				fullName: 'Lourenço de Sousa António',
				biNumber: '003456789LA045',
				selfies: [],
				biFrontUri: null,
				biBackUri: null,
				licensePhotoUri: null,
				licenseNumber: 'L-103456',
				licenseExpiry: '2028-04-30',
				status: 'verificado',
				rejectionReason: null,
				submissionDate: d(-400 * 1440),
				verifiedAt: d(-390 * 1440),
			},
			vehicle: {
				id: 'veh_lourenco',
				ownerId: 'u_me_001',
				make: 'Toyota',
				model: 'Corolla Cross',
				color: 'Preta',
				plate: 'LD-88-11-CU',
				seats: 5,
				photos: [],
				status: 'verificado',
				verifiedAt: d(-380 * 1440),
			},
			emergencyContact: { name: 'Marta António', phone: '923000111' },
			wallet: 45000,
			createdAt: d(-500 * 1440),
		},
		{
			id: 'u_002',
			firstName: 'Ariclene',
			lastName: 'Queta',
			phone: '923151445',
			password: mockHash('senha'),
			avatar: null,
			bio: 'Operadora interprovincial — rota Luanda/Benguela há 6 anos.',
			rating: 4.9,
			ratingsCount: 87,
			kyc: {
				id: 'kyc_ariclene',
				userId: 'u_002',
				fullName: 'Ariclene dos Santos Queta',
				biNumber: '004567890LA033',
				selfies: [],
				biFrontUri: null,
				biBackUri: null,
				licensePhotoUri: null,
				licenseNumber: 'L-087654',
				licenseExpiry: '2027-11-15',
				status: 'verificado',
				rejectionReason: null,
				submissionDate: d(-300 * 1440),
				verifiedAt: d(-290 * 1440),
			},
			vehicle: {
				id: 'veh_ariclene',
				ownerId: 'u_002',
				make: 'Toyota',
				model: 'Hiace',
				color: 'Branca',
				plate: 'LG-12-35-BT',
				seats: 12,
				photos: [],
				status: 'verificado',
				verifiedAt: d(-285 * 1440),
			},
			emergencyContact: { name: 'Lena Queta', phone: '922000222' },
			wallet: 123400,
			createdAt: d(-340 * 1440),
		},
		{
			id: 'u_003',
			firstName: 'Fernando',
			lastName: 'Macana',
			phone: '925550473',
			password: mockHash('senha'),
			avatar: null,
			bio: 'Pacato e pontual. Luanda→Lobito às quintas.',
			rating: 4.7,
			ratingsCount: 63,
			kyc: {
				id: 'kyc_fernando',
				userId: 'u_003',
				fullName: 'Fernando Domingos Macana',
				biNumber: '005678901LA021',
				selfies: [],
				biFrontUri: null,
				biBackUri: null,
				licensePhotoUri: null,
				licenseNumber: 'L-099211',
				licenseExpiry: '2029-02-10',
				status: 'verificado',
				rejectionReason: null,
				submissionDate: d(-200 * 1440),
				verifiedAt: d(-195 * 1440),
			},
			vehicle: {
				id: 'veh_fernando',
				ownerId: 'u_003',
				make: 'Mitsubishi',
				model: 'L200',
				color: 'Vermelha',
				plate: 'LB-09-45-PL',
				seats: 6,
				photos: [],
				status: 'verificado',
				verifiedAt: d(-190 * 1440),
			},
			emergencyContact: null,
			wallet: 67800,
			createdAt: d(-220 * 1440),
		},
	];

	// ---- Viagens (Rides)
	const mkRide = (
		id: string,
		driverId: string,
		routeName: string,
		departure: string,
		seatsTotal: number,
		taken: number,
		price: number,
		status: Ride['status'],
		template: RideTemplate,
		stopsIncludeAll: boolean,
		vinculos: string[] = [],
	): Ride => {
		const stops = TEMPLATES[template](departure);
		const origin = stops[0];
		const destination = stops[stops.length - 1];
		// estimativa de chegada: duração da rota (± 45min sem paragens)
		const travelMin = stopsIncludeAll
			? TRAVEL_MIN[template]
			: TRAVEL_MIN[template] - 45;
		const arrival = new Date(
			Date.parse(departure) + travelMin * 60000,
		).toISOString();
		return {
			id,
			driverId,
			routeName,
			origin,
			stops: stops.slice(1, -1),
			destination,
			departure,
			arrival,
			seatsTotal,
			seatsTaken: taken,
			pricePerSeat: price,
			status,
			vinculos,
			createdAt: nowISO(-60),
		};
	};

	const amanha = new Date();
	amanha.setDate(amanha.getDate() + 1);
	amanha.setHours(6, 0, 0, 0);
	const amanha07 = new Date();
	amanha07.setDate(amanha07.getDate() + 1);
	amanha07.setHours(7, 0, 0, 0);
	const depois = new Date();
	depois.setDate(depois.getDate() + 2);
	depois.setHours(6, 30, 0, 0);

	const amanha0730 = new Date();
	amanha0730.setDate(amanha0730.getDate() + 1);
	amanha0730.setHours(7, 30, 0, 0);

	const amanha0815 = new Date();
	amanha0815.setDate(amanha0815.getDate() + 1);
	amanha0815.setHours(8, 15, 0, 0);

	const rides: Ride[] = [
		mkRide(
			'ride_paulo_amanha',
			'u_002',
			'Luanda → Benguela',
			amanha.toISOString(),
			12,
			5,
			15000,
			'programada',
			'lad_bgu',
			true,
		),
		mkRide(
			'ride_joana_amanha',
			'u_me_001',
			'Benguela → Luanda',
			amanha07.toISOString(),
			5,
			2,
			18000,
			'programada',
			'bgu_lad',
			true,
		),
		mkRide(
			'ride_paulo_depois',
			'u_003',
			'Luanda → Benguela',
			depois.toISOString(),
			12,
			0,
			14000,
			'programada',
			'lad_bgu',
			true,
		),
		mkRide(
			'ride_bruno_curso',
			'u_003',
			'Luanda → Lobito',
			nowISO(-150),
			6,
			3,
			17000,
			'em_curso',
			'lad_bgu',
			false,
			['0', '1'],
		),
		mkRide(
			'ride_hist_1',
			'u_002',
			'Luanda → Benguela',
			d(-3 * 1440).slice(0, 10) + 'T06:00:00.000Z',
			12,
			12,
			15000,
			'concluida',
			'lad_bgu',
			true,
		),
		mkRide(
			'ride_hist_2',
			'u_003',
			'Benguela → Luanda',
			d(-5 * 1440).slice(0, 10) + 'T07:00:00.000Z',
			5,
			5,
			18000,
			'concluida',
			'bgu_lad',
			true,
		),
		mkRide(
			'ride_maria_lubango',
			'u_003',
			'Huambo → Lubango',
			amanha0730.toISOString(),
			6,
			2,
			12000,
			'programada',
			'hbo_hla',
			true,
		),
		mkRide(
			'ride_pedro_malanje',
			'u_002',
			'Luanda → Malanje',
			amanha0815.toISOString(),
			12,
			3,
			16000,
			'programada',
			'lad_mal',
			true,
		),
		// Viagens intermunicipais (dentro de Luanda) — demo da pesquisa local
		{
			id: 'ride_local_1',
			driverId: 'u_me_001',
			routeName: 'Talatona → Cacuaco',
			origin: {
				localityId: 'lad_talatona',
				name: 'Talatona',
				time: '07:30',
				km: 0,
			},
			stops: [
				{
					localityId: 'lad_maianga',
					name: 'Maianga',
					time: '08:05',
					km: 14,
				},
			],
			destination: {
				localityId: 'lad_cacuaco',
				name: 'Cacuaco',
				time: '08:40',
				km: 28,
			},
			departure: amanha0730.toISOString(),
			arrival: new Date(amanha0730.getTime() + 70 * 60000).toISOString(),
			seatsTotal: 5,
			seatsTaken: 2,
			pricePerSeat: 2500,
			status: 'programada',
			vinculos: [],
			createdAt: nowISO(-60),
		},
		{
			id: 'ride_local_2',
			driverId: 'u_002',
			routeName: 'Maianga → Viana',
			origin: {
				localityId: 'lad_maianga',
				name: 'Maianga',
				time: '08:15',
				km: 0,
			},
			stops: [
				{
					localityId: 'lad_cazenga',
					name: 'Cazenga',
					time: '08:30',
					km: 6,
				},
			],
			destination: {
				localityId: 'lad_viana',
				name: 'Viana',
				time: '09:00',
				km: 18,
			},
			departure: amanha0815.toISOString(),
			arrival: new Date(amanha0815.getTime() + 45 * 60000).toISOString(),
			seatsTotal: 5,
			seatsTaken: 1,
			pricePerSeat: 2000,
			status: 'programada',
			vinculos: [],
			createdAt: nowISO(-60),
		},
	];

	// ---- Reservas
	const bookings: Booking[] = [
		{
			id: 'bk_me_concluida',
			rideId: 'ride_hist_1',
			passengerId: 'u_me_001',
			seats: 1,
			amount: 15000,
			paymentMethod: 'carteira',
			pickStopIndex: 0,
			dropStopIndex: 2,
			status: 'concluida',
			reason: null,
			createdAt: d(-8 * 1440),
			updatedAt: d(-3 * 1440),
		},
		{
			id: 'bk_me_confirmada',
			rideId: 'ride_paulo_amanha',
			passengerId: 'u_me_001',
			seats: 2,
			amount: 30000,
			paymentMethod: 'carteira',
			pickStopIndex: 0,
			dropStopIndex: 3,
			status: 'confirmada',
			reason: null,
			createdAt: d(-10 * 1440),
			updatedAt: d(-9 * 1440),
		},
		{
			id: 'bk_filipe_viagem',
			rideId: 'ride_paulo_amanha',
			passengerId: 'u_003',
			seats: 1,
			amount: 15000,
			paymentMethod: 'dinheiro',
			pickStopIndex: 0,
			dropStopIndex: 2,
			status: 'confirmada',
			reason: null,
			createdAt: d(-6 * 1440),
			updatedAt: d(-6 * 1440),
		},
	];

	// ---- Avaliações bilaterais
	const reviews: Review[] = [
		{
			id: 'rev_1',
			byUserId: 'u_me_001',
			toUserId: 'u_002',
			rideId: 'ride_hist_1',
			rating: 5,
			comment: 'Paragens certas, viagem sem sustos.',
			createdAt: d(-3 * 1440),
		},
		{
			id: 'rev_2',
			byUserId: 'u_002',
			toUserId: 'u_me_001',
			rideId: 'ride_hist_1',
			rating: 5,
			comment: 'Presente no ponto de embarque, sem confusão.',
			createdAt: d(-3 * 1440),
		},
	];

	// ---- Carteira
	const transactions: WalletTransaction[] = [
		{
			id: 'tx_1',
			userId: 'u_me_001',
			kind: 'credito',
			amount: 50000,
			reference: 'Depósito em multicaixa',
			bookingId: null,
			createdAt: d(-15 * 1440),
		},
		{
			id: 'tx_2',
			userId: 'u_me_001',
			kind: 'debito',
			amount: 30000,
			reference: 'Reserva Luanda → Benguela (2 lugares)',
			bookingId: 'bk_me_confirmada',
			createdAt: d(-9 * 1440),
		},
		{
			id: 'tx_3',
			userId: 'u_me_001',
			kind: 'debito',
			amount: 15000,
			reference: 'Reserva Luanda → Porto Amboim',
			bookingId: 'bk_me_concluida',
			createdAt: d(-8 * 1440),
		},
		{
			id: 'tx_4',
			userId: 'u_002',
			kind: 'credito',
			amount: 100000,
			reference: 'Pagamento de reservas concluídas',
			bookingId: null,
			createdAt: d(-2 * 1440),
		},
	];

	// ---- Notificações in-app
	const notifications: InAppNotification[] = [
		{
			id: 'nt_1',
			userId: 'u_me_001',
			kind: 'ride',
			title: 'Viagem confirmada',
			message:
				'Ariclene Queta confirmou a tua reserva Luanda → Benguela (2 lugares).',
			data: { rideId: 'ride_hist_1' },
			read: false,
			createdAt: d(-9 * 1440),
		},
		{
			id: 'nt_2',
			userId: 'u_me_001',
			kind: 'system',
			title: 'Bem-vindo à Boleia',
			message:
				'Preenche o teu perfil e fica pronto para viajar entre províncias.',
			data: null,
			read: true,
			createdAt: d(-60 * 1440),
		},
	];

	const otp: OtpChallenge[] = [];
	const sos: SosEvent[] = [];

	return {
		users,
		rides,
		bookings,
		reviews,
		transactions,
		notifications,
		otp,
		sos,
		version: 1,
	};
}

export type { Database } from '../types/boleia';
