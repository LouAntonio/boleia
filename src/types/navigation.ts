import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
	Login: undefined;
	Register: undefined;
	ForgotPassword: undefined;
	VerifyToken: { phoneNumber: string };
	ResetPassword: { token: string };
};

export type MainStackParamList = {
	Home: undefined;
	Profile: undefined;
	History: undefined;
	Addresses: undefined;
	PaymentMethods: undefined;
	Promotions: undefined;
	Info: undefined;
	Contact: undefined;
	Settings: undefined;
	TripRequest: {
		serviceType: 'RIDE' | 'DELIVERY';
		pickupLat?: number;
		pickupLng?: number;
		pickupAddress?: string;
		dropoffLat?: number;
		dropoffLng?: number;
		dropoffAddress?: string;
	};
	ActiveTrip: { tripId: string };
	TripDetail: { tripId: string };
};

export type RootStackParamList = {
	Splash: undefined;
	Onboarding: undefined;
	Auth: NavigatorScreenParams<AuthStackParamList>;
	Main: NavigatorScreenParams<MainStackParamList>;
};

// ---------- Árvore Boleia (substitui a anterior nas fases seguintes) ----------

export type BoleiaAuthStackParamList = {
	PhoneEntry: undefined;
	OtpVerify: { phone: string };
	ProfileSetup: { phone: string };
};

export type PassengerTabsParamList = {
	PassengerHome: undefined;
	PassengerSearch: undefined;
	PassengerBookings: undefined;
	PassengerProfile: undefined;
};

export type DriverTabsParamList = {
	DriverHome: undefined;
	DriverPublish: undefined;
	DriverTrips: undefined;
	DriverProfile: undefined;
};

export type BoleiaMainStackParamList = {
	Main: undefined;
	Kyc: undefined;
	Vehicle: undefined;
	PublishTrip: undefined;
	RideDetail: { rideId: string };
	PublicProfile: { userId: string };
	ActiveRide: { rideId: string };
	Review: { rideId: string; toUserId: string };
	Notifications: undefined;
};

export type BoleiaRootStackParamList = {
	Splash: undefined;
	Onboarding: undefined;
	Auth: NavigatorScreenParams<BoleiaAuthStackParamList>;
	Main: NavigatorScreenParams<BoleiaMainStackParamList>;
};
