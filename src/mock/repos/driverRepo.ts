// Registo de motoristas — KYC, viatura (auto-verificação simulada p/ demo)
import { useDbStore } from '../db';
import { UID, nowISO } from '../helpers';
import { KYC, Vehicle } from '../../types/boleia';

const VERIFY_MS = 2600;

export function submitKyc(
	userId: string,
	input: {
		biNumber: string;
		licenseNumber: string;
		licenseExpiry: string; // yyyy-mm-dd
		biPhotoUri: string | null;
	},
): KYC {
	const kyc: KYC = {
		id: UID.next('kyc'),
		userId,
		fullName: '',
		biNumber: input.biNumber.trim(),
		biPhotoUri: input.biPhotoUri,
		licenseNumber: input.licenseNumber.trim(),
		licenseExpiry: input.licenseExpiry,
		status: 'pendente',
		rejectionReason: null,
		submissionDate: nowISO(),
		verifiedAt: null,
	};

	useDbStore.getState().mutate((db) => {
		const user = db.users.find((u) => u.id === userId);
		if (!user) return;
		user.kyc = kyc;
	});

	// Demo: "verificação" automática ao fim de ~2.6s
	setTimeout(() => {
		useDbStore.getState().mutate((d) => {
			const user = d.users.find((u) => u.id === userId);
			if (user?.kyc?.id === kyc.id) {
				const userKyc = d.users.find((u) => u.id === userId)?.kyc;
				if (userKyc) {
					userKyc.status = 'verificado';
					userKyc.verifiedAt = nowISO();
				}
			}
		});
	}, VERIFY_MS);

	return kyc;
}

export function submitVehicle(
	ownerId: string,
	input: {
		make: string;
		model: string;
		color: string;
		plate: string;
		seats: number;
		photoUri: string | null;
	},
): Vehicle {
	const vehicle: Vehicle = {
		id: UID.next('veh'),
		ownerId,
		make: input.make.trim(),
		model: input.model.trim(),
		color: input.color.trim(),
		plate: input.plate.toUpperCase().trim(),
		seats: input.seats,
		photoUri: input.photoUri,
		status: 'pendente',
		verifiedAt: null,
	};

	useDbStore.getState().mutate((db) => {
		const user = db.users.find((u) => u.id === ownerId);
		if (!user) return;
		user.vehicle = vehicle;
	});

	setTimeout(() => {
		useDbStore.getState().mutate((d) => {
			const user = d.users.find((u) => u.id === ownerId);
			const veh = user?.vehicle;
			if (veh && veh.id === vehicle.id) {
				veh.status = 'verificado';
				veh.verifiedAt = nowISO();
			}
		});
	}, VERIFY_MS);

	return vehicle;
}

export function isDriverReady(userId: string): boolean {
	const user = useDbStore.getState().db.users.find((u) => u.id === userId);
	return (
		!!user &&
		user.kyc?.status === 'verificado' &&
		!!user.vehicle &&
		user.vehicle.status === 'verificado'
	);
}
