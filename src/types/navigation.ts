import { NavigatorScreenParams } from '@react-navigation/native';

// ---------- Árvore Boleia (substitui a anterior nas fases seguintes) ----------

export type BoleiaAuthStackParamList = {
	Login: undefined;
	Register: undefined;
	ForgotPassword: undefined;
	OtpVerify: { phone: string };
	ResetPassword: { phone: string };
	ProfileSetup: { phone: string };
};

export type PassengerTabsParamList = {
	PassengerHome: undefined;
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
	SosCenter: undefined;
	Review: {
		rideId: string;
		toUserId: string;
		subject: 'driver' | 'passenger';
	};
	Notifications: undefined;
};

export type BoleiaRootStackParamList = {
	Splash: undefined;
	Onboarding: undefined;
	Auth: NavigatorScreenParams<BoleiaAuthStackParamList>;
	App: NavigatorScreenParams<BoleiaMainStackParamList>;
};
