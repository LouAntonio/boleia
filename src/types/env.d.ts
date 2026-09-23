declare module '@env' {
	export const API_URL: string;
	export const MAPBOX_ACCESS_TOKEN: string;
}

// NativeWind: import side-effect do CSS global (App.tsx)
declare module '*.css';
