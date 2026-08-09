import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import BoleiaButton from '../../components/BoleiaButton';
import { useDbStore } from '../../mock/db';
import { resolveSos } from '../../mock/repos/liveRepo';
import { fmtDate } from '../../mock/helpers';

// Central de segurança — eventos SOS registados (mock) e respetivo estado.
// No demo basta um botão para "confirmar assistência" (sinal que alguém cuidou).
export default function SosCenterScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'SosCenter'>
		>();
	const { themeColors } = useThemeColors();
	const events = useDbStore((s) => s.db.sos);
	const users = useDbStore((s) => s.db.users);
	const rides = useDbStore((s) => s.db.rides);

	const name = (id: string) => {
		const u = users.find((x) => x.id === id);
		return u ? `${u.firstName} ${u.lastName}`.trim() : id;
	};
	const route = (id: string) =>
		rides.find((r) => r.id === id)?.routeName ?? 'Rota desconhecida';

	return (
		<SafeAreaView
			className="flex-1 px-5"
			style={{ backgroundColor: themeColors.background }}
		>
			<View className="flex-row items-center pt-2 pb-3">
				<Pressable
					onPress={() => navigation.goBack()}
					className="w-9 h-9 rounded-full items-center justify-center border mr-3"
					style={{
						borderColor: themeColors.border,
						backgroundColor: themeColors.card,
					}}
				>
					<Ionicons
						name="chevron-back"
						size={18}
						color={themeColors.text}
					/>
				</Pressable>
				<Text
					className="font-display text-[20px]"
					style={{ color: themeColors.text }}
				>
					Central de segurança
				</Text>
			</View>

			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				<Text
					className="font-sans text-[13px] mb-4 leading-5"
					style={{ color: themeColors.secondary }}
				>
					Eventos SOS desta conta. Quando um alerta está ativo, a
					central Boleia liga-te e à pessoa de confiança que
					indicaste.
				</Text>

				{events.length === 0 ? (
					<View
						className="p-5 rounded-2xl border items-center"
						style={{
							borderColor: themeColors.border,
							backgroundColor: themeColors.card,
						}}
					>
						<Ionicons
							name="shield-checkmark-outline"
							size={30}
							color={themeColors.mato}
						/>
						<Text
							className="font-sansMedium text-[14px] mt-2"
							style={{ color: themeColors.text }}
						>
							Sem alerts por agora
						</Text>
						<Text
							className="font-sans text-[12px] text-center mt-1"
							style={{ color: themeColors.secondary }}
						>
							Os pedidos SOS que fizeres durante uma viagem
							aparecem aqui.
						</Text>
					</View>
				) : (
					events.map((e) => {
						const active = e.status === 'ativa';
						return (
							<View
								key={e.id}
								className="p-4 rounded-2xl border mb-3"
								style={{
									borderColor: active
										? themeColors.error
										: themeColors.border,
									backgroundColor: themeColors.card,
								}}
							>
								<View className="flex-row items-center">
									<View
										className="w-9 h-9 rounded-full items-center justify-center mr-3"
										style={{
											backgroundColor: active
												? themeColors.error
												: themeColors.mato,
										}}
									>
										<Ionicons
											name="alert-circle"
											size={18}
											color={themeColors.card}
										/>
									</View>
									<Text
										className="font-sansBold text-[15px] flex-1"
										style={{ color: themeColors.text }}
									>
										{name(e.fromUserId)}
									</Text>
									<Text
										className="font-mono text-[10px]"
										style={{
											color: themeColors.secondary,
										}}
									>
										{fmtDate(e.createdAt)}
									</Text>
								</View>
								<Text
									className="font-sans text-[13px] mt-2 leading-5"
									style={{ color: themeColors.secondary }}
								>
									{e.message}
								</Text>
								<Text
									className="font-mono text-[11px] mt-1"
									style={{ color: themeColors.laterite }}
								>
									{route(e.rideId)}
								</Text>

								{active ? (
									<View className="mt-3">
										<BoleiaButton
											title="Confirmar assistência"
											variant="outline"
											onPress={() => resolveSos(e.id)}
										/>
									</View>
								) : (
									<View className="flex-row items-center mt-3">
										<Ionicons
											name="checkmark-circle"
											size={16}
											color={themeColors.mato}
										/>
										<Text
											className="font-sans text-[12px] ml-1.5"
											style={{ color: themeColors.mato }}
										>
											Assistência confirmada
										</Text>
									</View>
								)}
							</View>
						);
					})
				)}
			</ScrollView>
		</SafeAreaView>
	);
}
