import React, { useCallback, useState } from 'react';
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	Alert,
	RefreshControl,
	Modal,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	Keyboard,
	TouchableWithoutFeedback,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
	FadeInDown,
	FadeInUp,
	FadeIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useAuthStore } from '../../store/authStore';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { StatCard, StatItem } from '../../components/profile/StatCard';
import { TripCard, TripItem } from '../../components/profile/TripCard';
import { ProfileHeaderSkeleton } from '../../components/skeletons/ProfileHeaderSkeleton';
import { StatCardGridSkeleton } from '../../components/skeletons/StatCardSkeleton';
import { TripCardSkeleton } from '../../components/skeletons/TripCardSkeleton';
import { fetchProfile } from '../../api/profile';
import { fetchProfileStats, type ProfileStats } from '../../api/stats';
import { useTrips } from '../../hooks/useTrips';
import { logoutUser } from '../../services/auth';
import { updateProfile, updateEmergencyContact } from '../../services/user';
import { uploadToCloudinary } from '../../lib/upload';
import {
	sendPhoneVerification,
	confirmPhoneVerification,
} from '../../services/phone';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function ProfileScreen() {
	const navigation = useNavigation();
	const logout = useAuthStore((state) => state.logout);
	const refreshToken = useAuthStore((state) => state.refreshToken);
	const setUser = useAuthStore((state) => state.setUser);
	const [showEditModal, setShowEditModal] = useState(false);
	const [editName, setEditName] = useState('');
	const [editSurname, setEditSurname] = useState('');

	const profileQuery = useQuery({
		queryKey: ['profile'],
		queryFn: fetchProfile,
	});

	const statsQuery = useQuery({
		queryKey: ['profile', 'stats'],
		queryFn: fetchProfileStats,
	});

	const { data: tripsData, isLoading: tripsLoading } = useTrips({
		limit: 10,
	});

	const updateMutation = useMutation({
		mutationFn: updateProfile,
		onSuccess: (res) => {
			const data = res.data as unknown as {
				data: import('../../store/authStore').User & {
					name: string;
					surname: string;
				};
			};
			if (data?.data) {
				setUser(data.data as any);
			}
			profileQuery.refetch();
			statsQuery.refetch();
			setShowEditModal(false);
			Alert.alert('Sucesso', 'Perfil atualizado!');
		},
		onError: (err: AxiosError<{ msg?: string }>) => {
			Alert.alert(
				'Erro',
				err.response?.data?.msg || 'Erro ao atualizar perfil.',
			);
		},
	});

	const [showEmergencyModal, setShowEmergencyModal] = useState(false);
	const [emergencyName, setEmergencyName] = useState('');
	const [emergencyPhone, setEmergencyPhone] = useState('');

	const emergencyMutation = useMutation({
		mutationFn: () =>
			updateEmergencyContact({
				emergencyContactName: emergencyName,
				emergencyContactPhone: emergencyPhone,
			}),
		onSuccess: (res) => {
			const data = res.data as unknown as {
				data?: import('../../store/authStore').User;
			};
			if (data?.data) {
				setUser(data.data as any);
			}
			profileQuery.refetch();
			setShowEmergencyModal(false);
			Alert.alert('Sucesso', 'Contacto de emergência atualizado!');
		},
		onError: (err: AxiosError<{ msg?: string }>) => {
			Alert.alert(
				'Erro',
				err.response?.data?.msg ||
					'Erro ao atualizar contacto de emergência.',
			);
		},
	});

	const handleEmergencyPress = () => {
		setEmergencyName(user?.emergencyContactName || '');
		setEmergencyPhone(user?.emergencyContactPhone || '');
		setShowEmergencyModal(true);
	};

	const handleSaveEmergency = () => {
		if (!emergencyName.trim() || !emergencyPhone.trim()) {
			Alert.alert('Erro', 'Nome e telefone são obrigatórios.');
			return;
		}
		emergencyMutation.mutate();
	};

	const [showOTPModal, setShowOTPModal] = useState(false);
	const [otpCode, setOtpCode] = useState('');
	const [otpSent, setOtpSent] = useState(false);

	const sendOTPMutation = useMutation({
		mutationFn: () => sendPhoneVerification(user!.phoneNumber),
		onSuccess: () => {
			setOtpSent(true);
			Alert.alert(
				'Código Enviado',
				'Um código de verificação foi enviado para o teu telefone.',
			);
		},
		onError: (err: AxiosError<{ msg?: string }>) => {
			Alert.alert(
				'Erro',
				err.response?.data?.msg || 'Erro ao enviar código.',
			);
		},
	});

	const confirmOTPMutation = useMutation({
		mutationFn: () => confirmPhoneVerification(otpCode),
		onSuccess: () => {
			setShowOTPModal(false);
			setOtpCode('');
			setOtpSent(false);
			profileQuery.refetch();
			Alert.alert('Sucesso', 'Telefone verificado com sucesso!');
		},
		onError: (err: AxiosError<{ msg?: string }>) => {
			Alert.alert('Erro', err.response?.data?.msg || 'Código inválido.');
		},
	});

	const handleSendOTP = () => {
		sendOTPMutation.mutate();
	};

	const handleConfirmOTP = () => {
		if (!otpCode.trim()) {
			Alert.alert('Atenção', 'Insere o código de verificação');
			return;
		}
		confirmOTPMutation.mutate();
	};

	const handleLogout = () => {
		Alert.alert('Sair da Conta', 'Tem certeza que deseja sair?', [
			{
				text: 'Cancelar',
				style: 'cancel',
			},
			{
				text: 'Sair',
				style: 'destructive',
				onPress: async () => {
					if (refreshToken) {
						try {
							await logoutUser(refreshToken);
						} catch {
							// Ignore API error on logout
						}
					}
					logout();
					(navigation as any).reset({
						index: 0,
						routes: [{ name: 'Auth' }],
					});
				},
			},
		]);
	};

	const onRefresh = useCallback(() => {
		profileQuery.refetch();
		statsQuery.refetch();
	}, [profileQuery, statsQuery]);

	const handleEditPress = () => {
		const user = profileQuery.data?.user;
		setEditName(user?.name || '');
		setEditSurname(user?.surname || '');
		setShowEditModal(true);
	};

	const handleSaveProfile = () => {
		if (!editName.trim()) {
			Alert.alert('Erro', 'O nome é obrigatório.');
			return;
		}
		updateMutation.mutate({ name: editName, surname: editSurname });
	};

	const handleChangePhoto = async () => {
		const permission =
			await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!permission.granted) {
			Alert.alert(
				'Permissão necessária',
				'Precisamos de acesso à galeria para alterar a foto.',
			);
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ['images'],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.7,
		});
		if (result.canceled || !result.assets?.[0]?.uri) return;
		try {
			const imageUrl = await uploadToCloudinary(
				result.assets[0].uri,
				'FDA/profiles',
			);
			updateMutation.mutate({ image: imageUrl });
		} catch {
			Alert.alert('Erro', 'Não foi possível fazer upload da imagem.');
		}
	};

	const isLoading =
		profileQuery.isLoading || tripsLoading || statsQuery.isLoading;
	const error = profileQuery.error;
	const user = profileQuery.data?.user;
	const stats: ProfileStats | undefined = statsQuery.data?.stats;

	const trips: TripItem[] = (tripsData?.pages?.[0]?.trips ?? []).map((t) => ({
		...t,
		totalPrice: Number(t.totalPrice),
	})) as TripItem[];

	const statCards: StatItem[] = stats
		? [
				{
					id: '1',
					label: 'Viagens',
					value: String(stats.totalTrips),
				},
				{
					id: '2',
					label: 'Distância',
					value: `${stats.totalDistanceKm.toFixed(0)} km`,
				},
				{
					id: '3',
					label: 'Tempo',
					value: formatDuration(stats.totalDurationMin),
				},
				{
					id: '4',
					label: 'Total Gasto',
					value: `${stats.totalSpent.toLocaleString('pt-AO')} Kz`,
				},
			]
		: [];

	return (
		<SafeAreaView className="flex-1 bg-off-white dark:bg-[#090909]">
			{/* Header */}
			<View className="flex-row items-center justify-between px-4 py-3">
				<TouchableOpacity
					className="p-2"
					onPress={() => navigation.goBack()}
					activeOpacity={0.7}
				>
					<Ionicons name="chevron-back" size={28} color="#231F20" />
				</TouchableOpacity>
				<Text className="text-lg font-bold text-secondary dark:text-off-white">
					Meu Perfil
				</Text>
				<View className="w-8" />
			</View>

			<ScrollView
				className="px-4 pb-10"
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={isLoading}
						onRefresh={onRefresh}
					/>
				}
			>
				{error ? (
					<View className="mt-10 items-center">
						<Ionicons
							name="cloud-offline-outline"
							size={48}
							color="#9CA3AF"
						/>
						<Text className="text-gray-400 dark:text-gray-500 mt-3">
							Erro ao carregar perfil
						</Text>
						<TouchableOpacity
							onPress={onRefresh}
							className="mt-4 bg-primary px-6 py-2 rounded-full"
							activeOpacity={0.7}
						>
							<Text className="font-bold text-secondary">
								Tentar novamente
							</Text>
						</TouchableOpacity>
					</View>
				) : isLoading ? (
					<View className="mt-5">
						<ProfileHeaderSkeleton />
						<View className="mt-6">
							<StatCardGridSkeleton />
						</View>
						<View className="mt-6">
							<TripCardSkeleton />
							<TripCardSkeleton />
							<TripCardSkeleton />
						</View>
					</View>
				) : (
					<>
						{/* Hero */}
						<Animated.View
							entering={FadeInDown.duration(600)}
							className="mt-5 mb-2"
						>
							<ProfileHeader
								name={user?.name || 'Usuário'}
								surname={user?.surname || ''}
								phoneNumber={
									user?.phoneNumber || '+244 --- --- ---'
								}
								email={user?.email}
								image={user?.image}
								phoneNumberVerified={user?.phoneNumberVerified}
								emailVerified={user?.emailVerified}
								onEditPress={handleEditPress}
								onVerifyPhone={
									!user?.phoneNumberVerified
										? () => setShowOTPModal(true)
										: undefined
								}
							/>
							<TouchableOpacity
								onPress={handleChangePhoto}
								className="flex-row items-center justify-center gap-1.5 mt-2"
								activeOpacity={0.7}
							>
								<Ionicons
									name="camera-outline"
									size={16}
									color="#FFD700"
								/>
								<Text className="text-sm font-bold text-primary">
									Alterar foto
								</Text>
							</TouchableOpacity>
						</Animated.View>

						{/* Stats — unified glass card */}
						{stats && (
							<Animated.View
								entering={FadeInDown.duration(600).delay(150)}
								className="mt-6"
							>
								<Text className="text-xl font-extrabold text-secondary dark:text-off-white mb-4 tracking-tight">
									Estatísticas
								</Text>
								<View
									className="bg-white dark:bg-soft-black rounded-2xl p-4"
									style={{
										elevation: 2,
										shadowColor: '#000',
										shadowOffset: {
											width: 0,
											height: 2,
										},
										shadowOpacity: 0.05,
										shadowRadius: 8,
										borderWidth: 1,
										borderColor: 'rgba(0,0,0,0.04)',
									}}
								>
									<View className="flex-row flex-wrap">
										{statCards.map((s) => (
											<Animated.View
												key={s.id}
												entering={FadeInUp.duration(
													500,
												).delay(
													200 + Number(s.id) * 60,
												)}
												className="w-1/2"
											>
												<StatCard stat={s} />
											</Animated.View>
										))}
									</View>
								</View>
							</Animated.View>
						)}

						{/* Recent trips */}
						<Animated.View
							entering={FadeInDown.duration(600).delay(300)}
							className="mt-6"
						>
							<View className="flex-row justify-between items-center mb-4">
								<Text className="text-xl font-extrabold text-secondary dark:text-off-white tracking-tight">
									Viagens Recentes
								</Text>
								<TouchableOpacity
									activeOpacity={0.7}
									className="py-1"
									onPress={() =>
										navigation.navigate('History' as never)
									}
								>
									<Text className="text-sm font-bold text-primary">
										Ver todos
									</Text>
								</TouchableOpacity>
							</View>

							{trips.length === 0 ? (
								<View className="bg-white dark:bg-soft-black rounded-2xl p-8 items-center">
									<Ionicons
										name="car-outline"
										size={40}
										color="#9CA3AF"
									/>
									<Text className="text-gray-400 dark:text-gray-500 mt-3 text-center">
										Nenhuma viagem ainda
									</Text>
								</View>
							) : (
								trips.map((trip, index) => (
									<Animated.View
										key={trip.id}
										entering={FadeInUp.duration(500).delay(
											350 + index * 80,
										)}
									>
										<TripCard
											trip={trip}
											onPress={() =>
												(navigation as any).navigate(
													'TripDetail',
													{
														tripId: trip.id,
													},
												)
											}
										/>
									</Animated.View>
								))
							)}
						</Animated.View>

						{/* Emergency contact */}
						<Animated.View
							entering={FadeInDown.duration(600).delay(450)}
							className="mt-6"
						>
							<Text className="text-xl font-extrabold text-secondary dark:text-off-white mb-4 tracking-tight">
								Contato de Emergência
							</Text>
							<TouchableOpacity
								onPress={handleEmergencyPress}
								activeOpacity={0.7}
							>
								<View
									className="bg-white dark:bg-soft-black rounded-2xl p-4 flex-row items-center gap-4"
									style={{
										elevation: 2,
										shadowColor: '#000',
										shadowOffset: {
											width: 0,
											height: 2,
										},
										shadowOpacity: 0.05,
										shadowRadius: 8,
										borderWidth: 1,
										borderColor: 'rgba(0,0,0,0.04)',
									}}
								>
									<View className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 items-center justify-center">
										<Ionicons
											name="medkit-outline"
											size={22}
											color="#ED1C24"
										/>
									</View>
									<View className="flex-1">
										{user?.emergencyContactName ? (
											<>
												<Text className="text-base font-bold text-secondary dark:text-off-white">
													{user.emergencyContactName}
												</Text>
												<Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
													{user.emergencyContactPhone}
												</Text>
											</>
										) : (
											<Text className="text-sm font-medium text-gray-500 dark:text-gray-400">
												Nenhum contacto definido
											</Text>
										)}
									</View>
									<Ionicons
										name="chevron-forward"
										size={18}
										color="#9CA3AF"
									/>
								</View>
							</TouchableOpacity>
						</Animated.View>

						{/* Logout */}
						<Animated.View
							entering={FadeInDown.duration(600).delay(500)}
							className="mt-8 items-center"
						>
							<TouchableOpacity
								className="flex-row items-center gap-2 py-3 px-6 active:opacity-60"
								onPress={handleLogout}
								activeOpacity={0.7}
							>
								<Ionicons
									name="log-out-outline"
									size={18}
									color="#ED1C24"
								/>
								<Text className="text-sm font-bold text-red-500">
									Sair da Conta
								</Text>
							</TouchableOpacity>
						</Animated.View>

						{/* Version */}
						<Animated.View
							entering={FadeIn.duration(600).delay(550)}
							className="mt-4 mb-4 items-center"
						>
							<Text className="text-xs text-gray-400">
								Flash Delivery Angola v1.0.0
							</Text>
						</Animated.View>
					</>
				)}
			</ScrollView>

			{/* Edit modal */}
			<Modal
				visible={showEditModal}
				animationType="slide"
				transparent
				onRequestClose={() => setShowEditModal(false)}
			>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					className="flex-1 justify-end"
				>
					<Pressable
						className="absolute inset-0 bg-black/50"
						onPress={() => setShowEditModal(false)}
					/>
					<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
						<View className="bg-white dark:bg-[#121212] rounded-t-3xl p-6 pb-10">
							<View className="flex-row items-center justify-between mb-6">
								<Text className="text-2xl font-black text-gray-900 dark:text-white">
									Editar Perfil
								</Text>
								<TouchableOpacity
									onPress={() => setShowEditModal(false)}
									className="w-8 h-8 items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full"
									activeOpacity={0.6}
								>
									<Ionicons
										name="close"
										size={20}
										color="#000"
									/>
								</TouchableOpacity>
							</View>

							<Input
								label="Nome"
								value={editName}
								onChangeText={setEditName}
								placeholder="Seu nome"
								leftIcon="person-outline"
							/>
							<Input
								label="Sobrenome"
								value={editSurname}
								onChangeText={setEditSurname}
								placeholder="Seu sobrenome"
								leftIcon="person-outline"
							/>

							<Button
								title="Salvar"
								onPress={handleSaveProfile}
								loading={updateMutation.isPending}
							/>
						</View>
					</TouchableWithoutFeedback>
				</KeyboardAvoidingView>
			</Modal>

			{/* Emergency Contact Modal */}
			<Modal
				visible={showEmergencyModal}
				animationType="slide"
				transparent
				onRequestClose={() => setShowEmergencyModal(false)}
			>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					className="flex-1 justify-end"
				>
					<Pressable
						className="absolute inset-0 bg-black/50"
						onPress={() => setShowEmergencyModal(false)}
					/>
					<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
						<View className="bg-white dark:bg-[#121212] rounded-t-3xl p-6 pb-10">
							<View className="flex-row items-center justify-between mb-6">
								<Text className="text-2xl font-black text-gray-900 dark:text-white">
									{user?.emergencyContactName
										? 'Editar Contacto'
										: 'Adicionar Contacto'}
								</Text>
								<TouchableOpacity
									onPress={() => setShowEmergencyModal(false)}
									className="w-8 h-8 items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full"
									activeOpacity={0.6}
								>
									<Ionicons
										name="close"
										size={20}
										color="#000"
									/>
								</TouchableOpacity>
							</View>

							<Input
								label="Nome do contacto"
								value={emergencyName}
								onChangeText={setEmergencyName}
								placeholder="Ex: Maria Silva"
								leftIcon="person-outline"
							/>
							<Input
								label="Telefone do contacto"
								value={emergencyPhone}
								onChangeText={setEmergencyPhone}
								placeholder="Ex: +244 900 000 000"
								leftIcon="call-outline"
								keyboardType="phone-pad"
							/>

							<Button
								title="Salvar"
								onPress={handleSaveEmergency}
								loading={emergencyMutation.isPending}
							/>
						</View>
					</TouchableWithoutFeedback>
				</KeyboardAvoidingView>
			</Modal>

			{/* Phone Verification OTP Modal */}
			<Modal
				visible={showOTPModal}
				animationType="slide"
				transparent
				onRequestClose={() => {
					setShowOTPModal(false);
					setOtpSent(false);
					setOtpCode('');
				}}
			>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					className="flex-1 justify-end"
				>
					<Pressable
						className="absolute inset-0 bg-black/50"
						onPress={() => {
							setShowOTPModal(false);
							setOtpSent(false);
							setOtpCode('');
						}}
					/>
					<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
						<View className="bg-white dark:bg-[#121212] rounded-t-3xl p-6 pb-10">
							<View className="flex-row items-center justify-between mb-6">
								<Text className="text-2xl font-black text-gray-900 dark:text-white">
									Verificar Telefone
								</Text>
								<TouchableOpacity
									onPress={() => {
										setShowOTPModal(false);
										setOtpSent(false);
										setOtpCode('');
									}}
									className="w-8 h-8 items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full"
									activeOpacity={0.6}
								>
									<Ionicons
										name="close"
										size={20}
										color="#000"
									/>
								</TouchableOpacity>
							</View>

							<Text className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
								{otpSent
									? 'Insere o código de verificação enviado para o teu telefone.'
									: `Enviaremos um código de verificação para ${user?.phoneNumber || 'o teu telefone'}.`}
							</Text>

							{!otpSent ? (
								<Button
									title="Enviar Código"
									onPress={handleSendOTP}
									loading={sendOTPMutation.isPending}
								/>
							) : (
								<>
									<Input
										label="Código de verificação"
										value={otpCode}
										onChangeText={setOtpCode}
										placeholder="Ex: 123456"
										keyboardType="number-pad"
									/>
									<View className="mt-3">
										<Button
											title="Confirmar"
											onPress={handleConfirmOTP}
											loading={
												confirmOTPMutation.isPending
											}
										/>
									</View>
									<TouchableOpacity
										onPress={handleSendOTP}
										className="mt-4 items-center"
										disabled={sendOTPMutation.isPending}
										activeOpacity={0.7}
									>
										<Text className="text-sm font-bold text-primary">
											Reenviar código
										</Text>
									</TouchableOpacity>
								</>
							)}
						</View>
					</TouchableWithoutFeedback>
				</KeyboardAvoidingView>
			</Modal>
		</SafeAreaView>
	);
}

function formatDuration(minutes: number): string {
	const h = Math.floor(minutes / 60);
	const m = Math.round(minutes % 60);
	if (h > 0) return `${h}h ${m}m`;
	return `${m}m`;
}
