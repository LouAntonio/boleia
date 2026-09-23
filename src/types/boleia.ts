// Domínio Boleia — mobilidade partilhada interprovincial (demo mock)

// Estados de negócio (PT-AO, ASCII p/ persistência segura)
export type RideStatus = 'programada' | 'em_curso' | 'concluida' | 'cancelada';

export type BookingStatus =
	| 'pedido'
	| 'confirmada'
	| 'em_viagem'
	| 'concluida'
	| 'recusada'
	| 'cancelada'
	| 'expirada';

export type KycStatus =
	'nao_submetido' | 'pendente' | 'verificado' | 'recusado';

export type Role = 'passenger' | 'driver';

export type Locality = {
	id: string;
	province: string;
	municipality: string;
	name: string;
};

export type RouteStop = {
	localityId: string;
	name: string;
	time: string; // HH:MM
	km: number; // distância acumulada à origem
};

export type Ride = {
	id: string;
	driverId: string;
	routeName: string;
	origin: RouteStop;
	stops: RouteStop[]; // paragens intermédias
	destination: RouteStop;
	departure: string; // ISO (WAT, UTC+1)
	arrival: string; // ISO
	seatsTotal: number;
	seatsTaken: number;
	pricePerSeat: number; // kwanzas
	status: RideStatus;
	vinculos: string[]; // segmento da pista já percorrido (mock live)
	createdAt: string;
};

export type Booking = {
	id: string;
	rideId: string;
	passengerId: string;
	seats: number;
	amount: number;
	paymentMethod: PaymentKind;
	pickStopIndex: number;
	dropStopIndex: number;
	status: BookingStatus;
	reason: string | null; // motivo de recusa/cancelamento/expiração
	createdAt: string;
	updatedAt: string;
};

export type KYC = {
	id: string;
	userId: string;
	fullName: string;
	biNumber: string; // bilhete de identidade
	selfies: string[]; // 3 selfies de rosto
	biFrontUri: string | null; // BI — frente
	biBackUri: string | null; // BI — verso
	licensePhotoUri: string | null; // carta de condução
	licenseNumber: string | null;
	licenseExpiry: string | null; // yyyy-mm-dd
	status: KycStatus;
	rejectionReason: string | null;
	submissionDate: string | null;
	verifiedAt: string | null;
};

export type Vehicle = {
	id: string;
	ownerId: string;
	make: string;
	model: string;
	color: string;
	plate: string; // matrícula AG-00-00-AG
	seats: number; // lotação total (motorista + lugares)
	photos: string[]; // mínimo 3 fotos da viatura
	status: KycStatus;
	verifiedAt: string | null;
};

export type BoleiaUser = {
	id: string;
	firstName: string;
	lastName: string;
	phone: string; // 9XX XXX XXX
	password: string; // hash mock (não usar em produção)
	avatar: string | null;
	bio: string;
	rating: number | null;
	ratingsCount: number;
	kyc: KYC | null;
	vehicle: Vehicle | null;
	emergencyContact: { name: string; phone: string } | null;
	wallet: number; // carteira Boleia (Kz)
	createdAt: string;
};

export type ProfileStatus = 'novo' | 'pendente_kyc' | 'verificado';

export type OtpChallenge = {
	id: string;
	phone: string;
	code: string; // 6 dígitos (demo: constante 773214)
	expiresAt: string;
	verified: boolean;
	createdAt: string;
};

export type PaymentKind = 'carteira' | 'dinheiro' | 'multicaixa';

export type Review = {
	id: string;
	byUserId: string;
	toUserId: string;
	rideId: string;
	rating: 1 | 2 | 3 | 4 | 5;
	comment: string;
	createdAt: string;
};

export type WalletTransaction = {
	id: string;
	userId: string;
	kind: 'credito' | 'debito';
	amount: number;
	reference: string;
	bookingId: string | null;
	createdAt: string;
};

export type InAppNotification = {
	id: string;
	userId: string;
	kind: 'ride' | 'booking' | 'payment' | 'system';
	title: string;
	message: string;
	data: Record<string, string> | null;
	read: boolean;
	createdAt: string;
};

export type SosEvent = {
	id: string;
	rideId: string;
	fromUserId: string;
	message: string;
	status: 'ativa' | 'assistida';
	createdAt: string;
	resolvedAt: string | null;
};

export type Database = {
	users: BoleiaUser[];
	rides: Ride[];
	bookings: Booking[];
	reviews: Review[];
	transactions: WalletTransaction[];
	notifications: InAppNotification[];
	otp: OtpChallenge[];
	sos: SosEvent[];
	version: number;
};
