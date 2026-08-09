export type UserRole =
	| 'CLIENT'
	| 'DRIVER'
	| 'SUPER_ADMIN'
	| 'OPERATIONS'
	| 'SUPPORT'
	| 'VALIDATOR'
	| 'FINANCE'
	| 'FLEET_MANAGER';

export type UserStatus = 'ACTIVE' | 'BANNED';

export type VehicleType = 'MOTO' | 'CARRO';

export type ServiceType = 'RIDE' | 'DELIVERY';

export type TripStatus =
	| 'REQUESTED'
	| 'ACCEPTED'
	| 'PICKUP_IN_PROGRESS'
	| 'STARTED'
	| 'COMPLETED'
	| 'CANCELLED'
	| 'NEEDS_REVIEW';

export type PaymentMethod = 'CASH' | 'MCX_EXPRESS' | 'UNITEL_MONEY';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type AddressLabel = 'HOME' | 'WORK' | 'OTHER';

export interface ApiResponse<T = unknown> {
	success: boolean;
	msg: string;
	data?: T;
}

export interface Coords {
	lat: number;
	lng: number;
}

export interface UserAddress {
	id: string;
	label: AddressLabel;
	customLabel?: string | null;
	address: string;
	reference?: string | null;
	lat: number;
	lng: number;
	createdAt: string;
	updatedAt: string;
}

export interface UserProfile {
	id: string;
	name: string;
	surname: string;
	phoneNumber: string;
	email?: string | null;
	emailVerified: boolean;
	phoneNumberVerified: boolean;
	image?: string | null;
	role: UserRole;
	status: UserStatus;
	hasPassword: boolean;
	accounts?: { providerId: string }[];
	emergencyContactName?: string | null;
	emergencyContactPhone?: string | null;
	deviceId?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface AuthTokens {
	accessToken: string;
	refreshToken: string;
	user: UserProfile;
}

export interface MapboxFeature {
	id: string;
	place_name: string;
	center: [number, number];
	text: string;
	address?: string;
}

export interface MapboxRoute {
	distance: number;
	duration: number;
	geometry: { coordinates: [number, number][] };
}
