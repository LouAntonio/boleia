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
