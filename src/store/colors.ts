// Boleia design tokens — modelo semântico Pixar (design system da BlaBlaCar).
//
// Regra de emparelhamento (fonte: Pixar "Color styles"):
//   - neutral é a base; `background` é a superfície da página, `card` a elevada.
//   - `text` (ink) só existe sobre surfaces normais; sobre `primary` usa-se
//     `onPrimary` (accent/txt/inverted), que é branco no tema claro — o navy
//     #001536 sobre #0071EB só dá 3.9:1 e não passa em texto normal.
//   - `secondary` é txt/weak — texto meta, nunca texto de acção.
//   - Semânticas de estado (success/warning/danger/caution) nunca se misturam
//     entre si; caution = "ainda não sucesso e não depende do utilizador"
//     (ex.: reserva aguardando).
// Contraste: texto 4.5:1, alvos de toque ≥44×44, informação nunca só por cor.
export const colors = {
	light: {
		background: '#F5F7FB', // neutral/bg/weak — superfície da página
		card: '#FFFFFF', // neutral/bg/elevated
		text: '#001536', // neutral/txt/default (ink)
		secondary: '#576680', // neutral/txt/weak (meta)
		border: '#E9ECF0', // neutral/bg/delicate
		primary: '#0071EB', // accent/bg/default
		onPrimary: '#FFFFFF', // accent/txt/inverted — branco (4.6:1); navy falha
		laterite: '#B84412', // warning/bg/strong (dark, light theme)
		onWarning: '#FFFFFF', // txt sobre warning/bg/strong (5.4:1)
		onSuccess: '#FFFFFF', // txt sobre success/bg/strong (6.1:1)
		caution: '#FFCC56', // caution/bg/strong
		cautionText: '#3F2206', // caution/txt/inverted (9.7:1)
		accentWeak: '#E6F2FE', // accent/bg/weak
		success: '#107046', // success/bg/strong
		successWeak: '#C5FFC6', // success/bg/weak
		error: '#BA303B', // danger/txt
		dangerWeak: '#FBE9EA', // danger/bg/weak
	},
	dark: {
		background: '#171B20', // neutral/bg/deep
		card: '#25282B', // neutral/bg/elevated
		text: '#F1F6FF', // neutral/txt/default
		secondary: '#9BA6BA', // neutral/txt/weak
		border: '#2F3339', // neutral/bg/delicate
		primary: '#47A0FF', // accent/bg/default (dark)
		onPrimary: '#001536', // txt sobre accent claro
		laterite: '#FF993A', // warning/bg/strong (dark)
		onWarning: '#3F2206', // txt sobre warning/bg/strong (dark)
		onSuccess: '#001536', // txt sobre success/txt claro (dark)
		caution: '#99640F', // caution/bg/strong (dark)
		cautionText: '#F1F6FF', // caution/txt sobre fundo escuro (4.6:1)
		accentWeak: '#26303A', // accent/bg/weak (dark)
		success: '#1FDA82', // success/txt (dark)
		successWeak: '#123528', // success/bg/weak (dark)
		error: '#FF8A93', // danger/txt/light (dark) — 6.6:1 sobre card
		dangerWeak: '#3A1618', // danger/bg/weak (dark)
	},
};

export type ThemeColors = (typeof colors)['light'];

// Texto legível sobre uma banda de estado. `bg/strong` só aceita
// `txt/inverted` — e o inverso correcto muda entre temas, porque success é
// escuro no tema claro e claro no tema escuro.
export function onBand(themeColors: ThemeColors, band: string): string {
	return band === themeColors.success
		? themeColors.onSuccess
		: themeColors.onWarning;
}
