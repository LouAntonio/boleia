import { createNavigationContainerRef } from '@react-navigation/native';
import type { BoleiaRootStackParamList } from '../types/navigation';

export const navigationRef =
	createNavigationContainerRef<BoleiaRootStackParamList>();
