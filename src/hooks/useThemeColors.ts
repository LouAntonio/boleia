import { useColorScheme } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { colors } from '../store/colors';

export function useThemeColors() {
	const systemScheme = useColorScheme(); // react-native — reage ao sistema
	const themeMode = useThemeStore((state) => state.theme);

	const isDark =
		themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';

	const activeTheme = isDark ? 'dark' : 'light';
	const themeColors = colors[activeTheme];

	return { themeColors, isDark, activeTheme };
}
