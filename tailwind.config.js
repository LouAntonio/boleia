/** @type {import('tailwindcss').Config} */
module.exports = {
	// NOTE: Update this to include the paths to all files that contain Nativewind classes.
	content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
	presets: [require('nativewind/preset')],
	theme: {
		extend: {
			colors: {
				// Tokens Pixar — espelham src/store/colors.ts (fonte runtime).
				primary: '#0071EB', // accent/bg/default
				'primary-dark': '#47A0FF', // accent/bg/default (dark)
				accentWeak: '#E6F2FE',
				secondary: '#576680', // neutral/txt/weak
				ink: '#001536', // neutral/txt/default
				'off-white': '#F5F7FB', // neutral/bg/weak
				surface: '#FFFFFF', // neutral/bg/elevated
				'soft-black': '#25282B', // elevated (dark)
				success: '#107046',
				successWeak: '#C5FFC6',
				warning: '#B84412',
				caution: '#FFCC56',
				danger: '#BA303B',
			},
			// Escala semântica do Pixar: title/label/body. Seven steps, com 行
			// herdados (110% títulos, 120% corpo, 140% texto pequeno).
			fontSize: {
				'title-primary': ['28px', { lineHeight: '31px' }],
				'title-secondary': ['22px', { lineHeight: '24px' }],
				'title-tertiary': ['18px', { lineHeight: '20px' }],
				label: ['16px', { lineHeight: '18px' }],
				'label-small': ['14px', { lineHeight: '16px' }],
				body: ['16px', { lineHeight: '19px' }],
				'body-small': ['14px', { lineHeight: '17px' }],
				'body-xs': ['12px', { lineHeight: '17px' }],
				'number-xl': ['40px', { lineHeight: '44px' }],
			},
			fontFamily: {
				// Uma só família; a hierarquia é feita por peso, não por nome.
				sans: ['HankenGrotesk_400Regular', 'sans-serif'],
				sansMedium: ['HankenGrotesk_500Medium', 'sans-serif'],
				sansBold: ['HankenGrotesk_700Bold', 'sans-serif'],
				sansExtraBold: ['HankenGrotesk_800ExtraBold', 'sans-serif'],
			},
		},
	},
	plugins: [],
};
