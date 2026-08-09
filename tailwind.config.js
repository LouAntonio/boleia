/** @type {import('tailwindcss').Config} */
module.exports = {
	// NOTE: Update this to include the paths to all files that contain Nativewind classes.
	content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
	presets: [require('nativewind/preset')],
	theme: {
		extend: {
			colors: {
				// Boleia palette — os nomes antigos mantêm-se (sem quebrar classNames)
				primary: '#F2A900', // linha
				secondary: '#17141B', // asfalto
				'off-white': '#F7F3E7', // céu
				'soft-black': '#221E28', // asfalto elevado (cards dark)
				// novos tokens
				asfalto: '#17141B',
				ceu: '#F7F3E7',
				linha: '#F2A900',
				laterite: '#B4531F',
				mato: '#1F7A5B',
				ferro: '#3A3640',
			},
			fontFamily: {
				sans: ['HankenGrotesk_400Regular', 'sans-serif'],
				sansMedium: ['HankenGrotesk_500Medium', 'sans-serif'],
				sansBold: ['HankenGrotesk_700Bold', 'sans-serif'],
				display: ['BricolageGrotesque_800ExtraBold', 'sans-serif'],
				displayBold: ['BricolageGrotesque_700Bold', 'sans-serif'],
				mono: ['IBMPlexMono_400Regular', 'monospace'],
				monoMedium: ['IBMPlexMono_500Medium', 'monospace'],
			},
		},
	},
	plugins: [],
};
