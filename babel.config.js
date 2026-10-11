module.exports = function (api) {
	api.cache(true);
	return {
		/*
		 * `jsxImportSource` não se configura à mão: é o NativeWind v4 que o
		 * injeta, a partir do `tailwind.config.js`, quando o preset
		 * `nativewind/babel` está presente.
		 *
		 * Passar `jsxImportSource: 'nativewind'` aqui era a configuração da v2 e
		 * fazia o JSX ser importado duas vezes por pathways diferentes. O
		 * `tsconfig.json` também não declara `jsxImportSource`, pelo que o
		 * TypeScript e o Metro compilavam o mesmo ficheiro de maneiras
		 * diferentes — e isso só aparece em build, nunca em `tsc`.
		 */
		presets: ['babel-preset-expo', 'nativewind/babel'],
		plugins: [
			[
				'module:react-native-dotenv',
				{
					envName: 'APP_ENV',
					moduleName: '@env',
					path: '.env',
				},
			],
			// Tem de ser o último. Na v4.5 este reexporta o plugin do
			// `react-native-worklets`, que é quem processa os worklets.
			'react-native-reanimated/plugin',
		],
	};
};
