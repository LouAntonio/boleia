import { api } from '../lib/api';

export interface ValidateCouponPayload {
	code: string;
	tripAmount: number;
}

export interface ValidateCouponResult {
	valid: boolean;
	discountApplied: number;
	reason?: string;
	coupon: {
		id: string;
		code: string;
		discountType: 'PERCENTAGE' | 'FIXED';
		discountValue: number;
	} | null;
}

export async function validateCoupon(
	payload: ValidateCouponPayload,
): Promise<ValidateCouponResult> {
	const { data } = await api.post('/coupons/validate', payload);
	return data as ValidateCouponResult;
}
