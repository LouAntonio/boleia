import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import BackButton from '../../components/BackButton';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import { fmtDate } from '../../lib/format';
import {
	listNotifications,
	markNotificationRead,
	type ApiNotification,
} from '../../lib/api';
import {
	requestPushPermission,
	registerDeviceForPush,
} from '../../hooks/usePushRegistration';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
	RIDE: 'car-outline',
	BOOKING: 'car-outline',
	PAYMENT: 'wallet-outline',
	SYSTEM: 'information-circle-outline',
	PROMOTION: 'megaphone-outline',
};

/**
 * Centro de notificações.
 *
 * É o que o `ExpoPushService` do backend alimenta: cada notificação criada pelo
 * servidor é guardada aqui e, se o utilizador tiver push activo, chega também
 * fora da app.
 */
export default function NotificationsScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'Notifications'>
		>();
	const { themeColors } = useThemeColors();
	const queryClient = useQueryClient();

	const { data, isLoading } = useQuery({
		queryKey: ['notifications'],
		queryFn: () => listNotifications({ limit: 50 }),
	});
	const notifications = data?.rows ?? [];

	/**
	 * Abrir uma notificação marca-a como lida e leva à corrida, se a notificação
	 * se referir a uma. Marcar antes de navegar garante que voltar atrás não
	 * mostra a mesma notificação como nova outra vez.
	 */
	const open = async (n: ApiNotification) => {
		if (!n.read) {
			try {
				await markNotificationRead(n.id);
				await queryClient.invalidateQueries({
					queryKey: ['notifications'],
				});
			} catch {
				// Falhar a marcação não deve impedir o utilizador de ver a
				// notificação que acabou de tocar.
			}
		}
		const rideId = n.data?.rideId;
		if (typeof rideId === 'string' && rideId) {
			navigation.navigate('RideDetail', { rideId });
		}
	};

	/**
	 * Pedir a permissão e, se for concedida, registar de imediato o token.
	 *
	 * O registo vive num efeito ligado ao estado de autenticação, por isso
	 * pedir a permissão depois de a app ter arrancado não bastaria: o token
	 * ficaria por registar até ao próximo arranque.
	 */
	const enablePush = async () => {
		const granted = await requestPushPermission();
		if (granted) {
			await registerDeviceForPush();
		}
	};

	return (
		<SafeAreaView
			className="flex-1 px-5"
			style={{ backgroundColor: themeColors.background }}
		>
			<View className="flex-row items-center pt-2 pb-3">
				<BackButton onPress={() => navigation.goBack()} />
				<Text
					className="font-sansExtraBold text-title-secondary"
					style={{ color: themeColors.text }}
				>
					Notificações
				</Text>
			</View>

			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				{notifications.length === 0 ? (
					<>
						<Text
							className="font-sans text-body-small"
							style={{ color: themeColors.secondary }}
						>
							{isLoading
								? 'A carregar…'
								: 'Ainda não há notificações.'}
						</Text>
						<PushPrompt onEnable={enablePush} />
					</>
				) : (
					notifications.map((n) => (
						<Pressable
							key={n.id}
							onPress={() => void open(n)}
							className="p-4 rounded-xl border mb-2 flex-row min-h-[44px]"
							style={{
								borderColor: n.read
									? themeColors.border
									: themeColors.primary,
								backgroundColor: themeColors.card,
								opacity: n.read ? 0.75 : 1,
							}}
						>
							<View
								className="w-10 h-10 rounded-full items-center justify-center mr-3"
								style={{
									backgroundColor: themeColors.background,
								}}
							>
								<Ionicons
									name={
										ICONS[n.type] ??
										'information-circle-outline'
									}
									size={20}
									color={themeColors.primary}
								/>
							</View>
							<View className="flex-1">
								<View className="flex-row items-center justify-between">
									<Text
										className="font-sansBold text-body-small"
										style={{ color: themeColors.text }}
									>
										{n.title}
									</Text>
									<Text
										className="font-sansMedium text-body-xs ml-2"
										style={{ color: themeColors.secondary }}
									>
										{fmtDate(n.createdAt)}
									</Text>
								</View>
								<Text
									className="font-sans text-body-small mt-0.5 leading-5"
									style={{ color: themeColors.secondary }}
								>
									{n.message}
								</Text>
							</View>
						</Pressable>
					))
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

/**
 * Convite a activar o push.
 *
 * O pedido de permissão só é feito a partir de um ecrã, nunca ao arrancar a
 * app: um modal de permissão em primeiro plano, sem contexto, é a forma mais
 * rápida de um utilizador dizer "não" e nunca mais aceitar.
 */
function PushPrompt({ onEnable }: { onEnable: () => void }) {
	const { themeColors } = useThemeColors();
	return (
		<Pressable
			onPress={onEnable}
			className="mt-4 p-4 rounded-xl border min-h-[44px] justify-center"
			style={{
				borderColor: themeColors.border,
				backgroundColor: themeColors.card,
			}}
		>
			<Text
				className="font-sansBold text-body-small"
				style={{ color: themeColors.text }}
			>
				Activar avisos no telemóvel
			</Text>
			<Text
				className="font-sans text-body-xs mt-0.5"
				style={{ color: themeColors.secondary }}
			>
				Recebe um aviso quando um pedido é aceite ou recusado, mesmo com
				a app fechada.
			</Text>
		</Pressable>
	);
}
