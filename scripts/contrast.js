// Verificador de contraste: le os tokens reais de colors.ts e valida cada
// par texto/fundo contra WCAG AA (4.5:1 texto normal, 3:1 texto grande).
const fs = require('fs');
const path = require('path');

const read = (p) => fs.readFileSync(p, 'utf8');

function lum(hex) {
	const h = hex.trim().replace('#', '');
	const ch = (i) => parseInt(h.substr(i, 2), 16) / 255;
	const f = (c) =>
		c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
	return 0.2126 * f(ch(0)) + 0.7152 * f(ch(2)) + 0.0722 * f(ch(4));
}
const ratio = (a, b) => {
	const l1 = lum(a),
		l2 = lum(b);
	return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

// extrai os dois blocos de tokens de src/store/colors.ts
const src = read(path.join('src', 'store', 'colors.ts'));
function block(name) {
	const start = src.indexOf(`${name}: {`);
	if (start === -1) throw new Error(`bloco ${name} nao encontrado`);
	let depth = 0;
	let end = start;
	for (let i = src.indexOf('{', start); i < src.length; i++) {
		if (src[i] === '{') depth++;
		else if (src[i] === '}') {
			depth--;
			if (depth === 0) {
				end = i;
				break;
			}
		}
	}
	const out = {};
	for (const m of src
		.slice(start, end)
		.matchAll(/(\w+):\s*'(#[0-9A-Fa-f]{6})'/g))
		out[m[1]] = m[2];
	return out;
}

const themes = { light: block('light'), dark: block('dark') };

// pares: [rotulo, token de texto, token de fundo]
const pairs = [
	['texto normal', 'text', 'card'],
	['texto normal', 'text', 'background'],
	['meta', 'secondary', 'card'],
	['meta sobre banda', 'secondary', 'accentWeak'],
	['acção primária', 'onPrimary', 'primary'],
	['estado sucesso', 'onSuccess', 'success'],
	['estado aviso', 'onWarning', 'laterite'],
	['estado cautela', 'cautionText', 'caution'],
	['erro', 'error', 'card'],
	['erro fracamente', 'error', 'dangerWeak'],
	['aviso como texto', 'laterite', 'card'],
	['sucesso como texto', 'success', 'card'],
];

let fails = 0;
for (const [theme, c] of Object.entries(themes)) {
	console.log(`\n=== ${theme} ===`);
	for (const [label, fg, bg] of pairs) {
		if (!c[fg] || !c[bg]) {
			console.log(`  ? ${label}: falta ${!c[fg] ? fg : bg}`);
			continue;
		}
		const r = ratio(c[fg], c[bg]);
		const ok = r >= 4.5;
		if (!ok) fails++;
		console.log(
			`  ${ok ? 'PASS' : 'FALHA'}  ${label.padEnd(18)} ${c[fg]} sobre ${c[bg]}  ${r.toFixed(2)}:1`,
		);
	}
}
console.log(
	`\n${fails === 0 ? 'Tudo passa AA.' : `${fails} par(es) abaixo de 4.5:1.`}`,
);
process.exit(fails === 0 ? 0 : 1);
