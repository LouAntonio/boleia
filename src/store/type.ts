// Tokens de tipografia e espaço — espelham a escala semântica do Pixar
// (design system da BlaBlaCar). Os mesmos valores estão em tailwind.config.js
// como classes nomeadas; aqui ficam para uso em `style={{}}`.
//
// Princípios herdados:
//   - UMA família, hierarquia por peso (Regular no corpo, Medium em labels,
//     Bold em info principal, ExtraBold em títulos) — sem itálicos.
//   - Títulos com行 110% (apertado); corpo 16/14 a 120%; texto pequeno 120 a 140%.
//   - Info principal de um componente = `label`; meta = `bodySmall`.

export const type = {
	titlePrimary: { fontSize: 28, lineHeight: 31, fontWeight: '800' },
	titleSecondary: { fontSize: 22, lineHeight: 24, fontWeight: '500' },
	titleTertiary: { fontSize: 18, lineHeight: 20, fontWeight: '500' },
	label: { fontSize: 16, lineHeight: 18, fontWeight: '500' },
	labelSmall: { fontSize: 14, lineHeight: 16, fontWeight: '500' },
	body: { fontSize: 16, lineHeight: 19, fontWeight: '400' },
	bodySmall: { fontSize: 14, lineHeight: 17, fontWeight: '400' },
	bodyXSmall: { fontSize: 12, lineHeight: 17, fontWeight: '400' },
	numberLarge: { fontSize: 40, lineHeight: 44, fontWeight: '500' },
} as const;

// space: small dentro do componente, medium como padding, xlarge entre inputs.
export const space = {
	xs: 4,
	small: 8,
	medium: 16,
	large: 24,
	xlarge: 32,
} as const;

// Raios: cartes 12, chips/caixas 8, cápsulas e avatares cheios.
export const radius = {
	sm: 8,
	md: 12,
	lg: 16,
	full: 999,
} as const;

// Alvo de toque mínimo (regra de acessibilidade do Pixar).
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };
export const MIN_TAP = 44;
