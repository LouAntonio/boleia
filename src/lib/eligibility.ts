import {
	ApiKycMe,
	ApiVehicle,
	apiErrorMessage,
	getKycMe,
	listMyVehicles,
} from './api';

export interface Eligibility {
	loaded: boolean;
	error: string | null;
	kycDriver: ApiKycMe['driver'];
	kycPassenger: ApiKycMe['passenger'];
	vehicles: ApiVehicle[];
	verifiedVehicles: ApiVehicle[];
	driverReady: boolean;
	passengerReady: boolean;
}

const EMPTY: Eligibility = {
	loaded: false,
	error: null,
	kycDriver: null,
	kycPassenger: null,
	vehicles: [],
	verifiedVehicles: [],
	driverReady: false,
	passengerReady: false,
};

/**
 * Estado real de elegibilidade (KYC + viaturas) para os gates de
 * pedir/registar corrida. As viagens em si continuam no mock; a
 * identidade é que passa a ser real.
 */
export async function fetchEligibility(): Promise<Eligibility> {
	try {
		const [kyc, vehicles] = await Promise.all([
			getKycMe(),
			listMyVehicles(),
		]);
		const verifiedVehicles = vehicles.filter(
			(v) => v.status === 'VERIFIED',
		);
		return {
			loaded: true,
			error: null,
			kycDriver: kyc.driver,
			kycPassenger: kyc.passenger,
			vehicles,
			verifiedVehicles,
			driverReady:
				kyc.driver?.status === 'VERIFIED' &&
				verifiedVehicles.length > 0,
			passengerReady: kyc.passenger?.status === 'VERIFIED',
		};
	} catch (error) {
		return {
			...EMPTY,
			loaded: true,
			error: apiErrorMessage(error, 'Sem ligação ao servidor.'),
		};
	}
}
