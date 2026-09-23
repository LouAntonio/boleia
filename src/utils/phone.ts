// Máscara de telefone PT-AO para inputs de auth: 923 456 789
export function maskPhone(phone: string): string {
	const digits = phone.replace(/\D/g, '').slice(0, 9);
	if (digits.length <= 3) return digits;
	if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
	return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

// Número local sem espaços: 923 456 789 -> 923456789
export function normalizePhone(raw: string): string {
	return raw.replace(/\s+/g, '');
}
