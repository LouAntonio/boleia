// Dataset de demonstração — dados determinísticos + horários relativos a hoje
import {
	BoleiaUser,
	Booking,
	Ride,
	Review,
	InAppNotification,
	WalletTransaction,
	Database,
	SosEvent,
	OtpChallenge,
} from '../types/boleia';
import { nowISO } from './helpers';
import { ROUTE_LUANDA_BENGUELA, ROUTE_BENGUELA_LUANDA } from './locale';

const d = (offsetMin: number) => nowISO(offsetMin);

export function seedDatabase(): Database {
	// ---- Utilizadores
	const users: BoleiaUser[] = [
		{
			id: 'u_me_001',
			firstName: 'Nelson',
			lastName: 'Cardoso',
			phone: '923456789',
			avatar: null,
			bio: 'Viajo para o interior aos fins de semana.',
			rating: 4.8,
			ratingsCount: 12,
			kyc: null,
			vehicle: null,
			emergencyContact: { name: 'Marta Cardoso', phone: '923000111' },
			wallet: 45000,
			createdAt: d(-60 * 1440),
		},
		{
			id: 'u_pax_filipe',
			firstName: 'Filipe',
			lastName: 'Sebastião',
			phone: '926111222',
			avatar: null,
			bio: 'Comerciante em Porto Amboim.',
			rating: 4.6,
			ratingsCount: 7,
			kyc: null,
			vehicle: null,
			emergencyContact: null,
			wallet: 12000,
			createdAt: d(-120 * 1440),
		},
		{
			id: 'u_drv_paulo',
			firstName: 'Paulo',
			lastName: 'Vaz',
			phone: '922555001',
			avatar: null,
			bio: 'Operador interprovincial — rota Luanda/Benguela há 6 anos.',
			rating: 4.9,
			ratingsCount: 87,
			kyc: {
				id: 'kyc_paulo',
				userId: 'u_drv_paulo',
				fullName: 'Paulo Mário Vaz',
				biNumber: '003456789LA045',
				biPhotoUri: null,
				licenseNumber: 'L-103456',
				licenseExpiry: '2028-04-30',
				status: 'verificado',
				rejectionReason: null,
				submissionDate: d(-400 * 1440),
				verifiedAt: d(-390 * 1440),
			},
			vehicle: {
				id: 'veh_paulo',
				ownerId: 'u_drv_paulo',
				make: 'Toyota',
				model: 'Hiace',
				color: 'Branca',
				plate: 'LG-12-35-BT',
				seats: 12,
				photoUri: null,
				status: 'verificado',
				verifiedAt: d(-380 * 1440),
			},
			emergencyContact: { name: 'Lena Vaz', phone: '922000222' },
			wallet: 123400,
			createdAt: d(-500 * 1440),
		},
		{
			id: 'u_drv_joana',
			firstName: 'Joana',
			lastName: 'Sita',
			phone: '924555002',
			avatar: null,
			bio: 'Correspondências a tempo e horas. Benguela–Sumbe.',
			rating: 4.7,
			ratingsCount: 63,
			kyc: {
				id: 'kyc_joana',
				userId: 'u_drv_joana',
				fullName: 'Joana Domingos Sita',
				biNumber: '004567890LA033',
				biPhotoUri: null,
				licenseNumber: 'L-087654',
				licenseExpiry: '2027-11-15',
				status: 'verificado',
				rejectionReason: null,
				submissionDate: d(-300 * 1440),
				verifiedAt: d(-290 * 1440),
			},
			vehicle: {
				id: 'veh_joana',
				ownerId: 'u_drv_joana',
				make: 'Toyota',
				model: 'Corolla Cross',
				color: 'Preta',
				plate: 'LD-88-11-CU',
				seats: 5,
				photoUri: null,
				status: 'verificado',
				verifiedAt: d(-285 * 1440),
			},
			emergencyContact: null,
			wallet: 67800,
			createdAt: d(-340 * 1440),
		},
		{
			id: 'u_drv_bruno',
			firstName: 'Bruno',
			lastName: 'Chipenda',
			phone: '925555003',
			avatar: null,
			bio: 'Pacato e pontual. Luanda→Lobito às quintas.',
			rating: 5.0,
			ratingsCount: 41,
			kyc: {
				id: 'kyc_bruno',
				userId: 'u_drv_bruno',
				fullName: 'Bruno Ribeiro Chipenda',
				biNumber: '005678901LA021',
				biPhotoUri: null,
				licenseNumber: 'L-099211',
				licenseExpiry: '2029-02-10',
				status: 'verificado',
				rejectionReason: null,
				submissionDate: d(-200 * 1440),
				verifiedAt: d(-195 * 1440),
			},
			vehicle: {
				id: 'veh_bruno',
				ownerId: 'u_drv_bruno',
				make: 'Mitsubishi',
				model: 'L200',
				color: 'Vermelha',
				plate: 'LB-09-45-PL',
				seats: 6,
				photoUri: null,
				status: 'verificado',
				verifiedAt: d(-190 * 1440),
			},
			emergencyContact: null,
			wallet: 21000,
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
		template: 'lad_bgu' | 'bgu_lad',
		stopsIncludeAll: boolean,
		vinculos: string[] = [],
	): Ride => {
		const stops =
			template === 'lad_bgu'
				? ROUTE_LUANDA_BENGUELA(departure)
				: ROUTE_BENGUELA_LUANDA(departure);
		const origin = stops[0];
		const destination = stops[stops.length - 1];
		// estimativa de chegada: 480km (~60km/h com paragens)
		const travelMin = stopsIncludeAll ? 440 : 395;
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

	const rides: Ride[] = [
		mkRide(
			'ride_paulo_amanha',
			'u_drv_paulo',
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
			'u_drv_joana',
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
			'u_drv_paulo',
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
			'u_drv_bruno',
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
			'u_drv_paulo',
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
			'u_drv_joana',
			'Benguela → Luanda',
			d(-5 * 1440).slice(0, 10) + 'T07:00:00.000Z',
			5,
			5,
			18000,
			'concluida',
			'bgu_lad',
			true,
		),
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
			passengerId: 'u_pax_filipe',
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
			toUserId: 'u_drv_paulo',
			rideId: 'ride_hist_1',
			rating: 5,
			comment: 'Paragens certas, viagem sem sustos.',
			createdAt: d(-3 * 1440),
		},
		{
			id: 'rev_2',
			byUserId: 'u_drv_paulo',
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
			userId: 'u_drv_paulo',
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
				'Paulo Vaz confirmou a tua reserva Luanda → Benguela (2 lugares).',
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
