import React, { useState, useEffect, useMemo } from 'react';
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
	TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TripDetailSkeleton } from '../../components/skeletons/TripDetailSkeleton';
import { useAuthStore } from '../../store/authStore';
import { useTrip, useTripEvents, useOpenDispute } from '../../hooks/useTrips';
import { useMapRoute } from '../../hooks/useMapRoute';
import { createReview } from '../../api/review';
import MapView from '../../components/MapView';
import type { MainStackParamList } from '../../types/navigation';
import type { TripEventFromApi } from '../../api/trip';

function parseWktPoint(wkt: string): { lat: number; lng: number } | null {
	const match = wkt.match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i);
	if (!match) return null;
	return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
}

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
	REQUESTED: { label: 'Solicitada', color: '#F59E0B' },
	ACCEPTED: { label: 'Aceite', color: '#3B82F6' },
	PICKUP_IN_PROGRESS: { label: 'Busca', color: '#3B82F6' },
	STARTED: { label: 'Em Andamento', color: '#3B82F6' },
	COMPLETED: { label: 'Concluída', color: '#10B981' },
	CANCELLED: { label: 'Cancelada', color: '#ED1C24' },
};

const EVENT_LABELS: Record<string, string> = {
	TRIP_REQUESTED: 'Viagem solicitada',
	DRIVER_ACCEPTED: 'Motorista aceitou',
	DRIVER_ARRIVED_PICKUP: 'Motorista chegou ao local',
	TRIP_STARTED: 'Viagem iniciada',
	TRIP_COMPLETED: 'Viagem concluída',
	TRIP_CANCELLED: 'Viagem cancelada',
	PICKUP_CONFIRMED: 'Coleta confirmada',
	ARRIVED_DROPOFF: 'Chegou ao destino',
	LOCATION_UPDATED: 'Localização atualizada',
};

export default function TripDetailScreen() {
	const navigation = useNavigation();
	const route = useRoute<RouteProp<MainStackParamList, 'TripDetail'>>();
	const { themeColors, isDark } = useThemeColors();
	const { tripId } = route.params;

	const [showDispute, setShowDispute] = useState(false);
	const [disputeReason, setDisputeReason] = useState('');
	const [disputeDesc, setDisputeDesc] = useState('');

	const { data: trip, isLoading } = useTrip(tripId);
	const { data: events } = useTripEvents(tripId);
	const disputeMutation = useOpenDispute();
	const currentUser = useAuthStore((state) => state.user);
	const { route: mapRoute, fetchRoute } = useMapRoute();

	const [showReview, setShowReview] = useState(false);
	const [reviewRating, setReviewRating] = useState(0);
	const [reviewComment, setReviewComment] = useState('');

	const reviewMutation = useMutation({
		mutationFn: () => {
			if (!currentUser || !trip?.driver?.user?.id) {
				throw new Error('Missing user or driver info');
			}
			return createReview({
				tripId: tripId,
				fromUserId: currentUser.id,
				toUserId: trip.driver.user.id,
				rating: reviewRating,
				comment: reviewComment || undefined,
			});
		},
		onSuccess: () => {
			setShowReview(false);
			setReviewRating(0);
			setReviewComment('');
			Alert.alert('Obrigado!', 'A tua avaliação foi registada.');
		},
		onError: () => {
			Alert.alert('Erro', 'Não foi possível enviar a avaliação.');
		},
	});

	const pickupWkt = trip?.actualPickupCoords ?? trip?.pickupCoords;
	const dropoffWkt = trip?.actualDropoffCoords ?? trip?.dropoffCoords;

	useEffect(() => {
		if (!pickupWkt || !dropoffWkt) return;
		const pickup = parseWktPoint(pickupWkt);
		const dropoff = parseWktPoint(dropoffWkt);
		if (pickup && dropoff) {
			fetchRoute([pickup.lng, pickup.lat], [dropoff.lng, dropoff.lat]);
		}
	}, [pickupWkt, dropoffWkt, fetchRoute]);

	const markers = useMemo(() => {
		if (!pickupWkt || !dropoffWkt) return [];
		const pickup = parseWktPoint(pickupWkt);
		const dropoff = parseWktPoint(dropoffWkt);
		if (!pickup || !dropoff) return [];
		return [
			{
				id: 'pickup',
				latitude: pickup.lat,
				longitude: pickup.lng,
				title: 'Origem',
			},
			{
				id: 'dropoff',
				latitude: dropoff.lat,
				longitude: dropoff.lng,
				title: 'Destino',
			},
		];
	}, [pickupWkt, dropoffWkt]);

	const routeCoords = useMemo(
		() =>
			mapRoute
				? mapRoute.geometry.coordinates.map(([lng, lat]) => ({
						latitude: lat,
						longitude: lng,
					}))
				: [],
		[mapRoute],
	);

	if (isLoading) {
		return (
			<SafeAreaView
				className="flex-1"
				style={{ backgroundColor: themeColors.background }}
			>
				<TripDetailSkeleton />
			</SafeAreaView>
		);
	}

	if (!trip) {
		return (
			<SafeAreaView
				className="flex-1 items-center justify-center"
				style={{ backgroundColor: themeColors.background }}
			>
				<Text className="text-gray-500">Viagem não encontrada</Text>
			</SafeAreaView>
		);
	}

	const badge = STATUS_BADGES[trip.status] ?? {
		label: trip.status,
		color: '#6B7280',
	};
	const driver = trip.driver;
	const vehicle = driver?.vehicles?.[0];

	const handleOpenDispute = () => {
		if (!disputeReason.trim() || !disputeDesc.trim()) {
			Alert.alert('Atenção', 'Preencha todos os campos');
			return;
		}
		disputeMutation.mutate(
			{ tripId, reason: disputeReason, description: disputeDesc },
			{
				onSuccess: () => {
					setShowDispute(false);
					setDisputeReason('');
					setDisputeDesc('');
				},
			},
		);
	};

	return (
		<SafeAreaView
			className="flex-1"
			style={{ backgroundColor: themeColors.background }}
		>
			<View
				className="flex-row items-center px-4 py-3 border-b"
				style={{ borderColor: isDark ? '#333' : '#F3F4F6' }}
			>
				<TouchableOpacity
					onPress={() => navigation.goBack()}
					className="w-10 h-10 items-center justify-center rounded-full bg-black/5 dark:bg-white/10"
				>
					<Ionicons
						name="chevron-back"
						size={22}
						color={themeColors.text}
					/>
				</TouchableOpacity>
				<Text
					className="flex-1 text-lg font-bold ml-3"
					style={{ color: themeColors.text }}
				>
					Detalhes da Viagem
				</Text>
			</View>

			<ScrollView
				className="flex-1 px-4"
				showsVerticalScrollIndicator={false}
			>
				{/* Status Badge */}
				<Animated.View
					entering={FadeInDown.duration(400)}
					className="flex-row items-center justify-between mt-4 mb-4"
				>
					<View
						className="flex-row items-center px-3 py-1.5 rounded-lg"
						style={{ backgroundColor: badge.color + '20' }}
					>
						<View
							className="w-2 h-2 rounded-full mr-2"
							style={{ backgroundColor: badge.color }}
						/>
						<Text
							className="text-sm font-bold"
							style={{ color: badge.color }}
						>
							{badge.label}
						</Text>
					</View>
					<Text className="text-sm text-gray-500">
						{new Date(trip.requestedAt).toLocaleDateString('pt-AO')}
					</Text>
				</Animated.View>

				{/* Map */}
				<Animated.View
					entering={FadeInDown.duration(400).delay(100)}
					className="h-48 rounded-2xl overflow-hidden mb-4"
				>
					<MapView
						style={{ flex: 1 }}
						initialRegion={{
							latitude:
								markers.length > 0
									? (markers[0].latitude +
											markers[1].latitude) /
										2
									: -8.8399,
							longitude:
								markers.length > 0
									? (markers[0].longitude +
											markers[1].longitude) /
										2
									: 13.2344,
							latitudeDelta: 0.05,
							longitudeDelta: 0.05,
						}}
						markers={markers}
						routeCoords={routeCoords}
					/>
				</Animated.View>

				{/* Route */}
				<Animated.View
					entering={FadeInDown.duration(400).delay(150)}
					className="p-4 rounded-2xl mb-4 border"
					style={{
						backgroundColor: isDark ? '#1A1A1A' : '#F9FAFB',
						borderColor: isDark ? '#333' : '#E5E7EB',
					}}
				>
					<View className="flex-row items-start">
						<View className="w-4 items-center mr-3 mt-1">
							<View className="w-2.5 h-2.5 rounded-full bg-blue-500" />
							<View className="w-0.5 h-6 bg-gray-300 dark:bg-gray-700 my-1" />
							<View className="w-2.5 h-2.5 rounded-full bg-primary" />
						</View>
						<View className="flex-1 gap-2">
							<View>
								<Text
									className="text-sm font-bold"
									style={{ color: themeColors.text }}
								>
									{trip.pickupAddress}
								</Text>
								{trip.pickupReference && (
									<Text className="text-xs text-gray-500">
										Ref: {trip.pickupReference}
									</Text>
								)}
							</View>
							<View>
								<Text
									className="text-sm font-bold"
									style={{ color: themeColors.text }}
								>
									{trip.dropoffAddress}
								</Text>
								{trip.dropoffReference && (
									<Text className="text-xs text-gray-500">
										Ref: {trip.dropoffReference}
									</Text>
								)}
							</View>
						</View>
					</View>
				</Animated.View>

				{/* Driver Info */}
				{driver && (
					<Animated.View
						entering={FadeInDown.duration(400).delay(200)}
						className="p-4 rounded-2xl mb-4 border"
						style={{
							backgroundColor: isDark ? '#1A1A1A' : '#F9FAFB',
							borderColor: isDark ? '#333' : '#E5E7EB',
						}}
					>
						<Text className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
							Motorista
						</Text>
						<View className="flex-row items-center">
							<View className="w-12 h-12 rounded-full items-center justify-center bg-primary/20">
								<Ionicons
									name="person"
									size={24}
									color={themeColors.primary}
								/>
							</View>
							<View className="flex-1 ml-3">
								<Text
									className="text-base font-bold"
									style={{ color: themeColors.text }}
								>
									{driver.user.name} {driver.user.surname}
								</Text>
								{vehicle && (
									<Text className="text-sm text-gray-500">
										{vehicle.brand} {vehicle.model} •{' '}
										{vehicle.color} • {vehicle.plateNumber}
									</Text>
								)}
							</View>
						</View>
					</Animated.View>
				)}

				{/* Receipt / Invoice */}
				<Animated.View
					entering={FadeInDown.duration(400).delay(250)}
					className="p-4 rounded-2xl mb-4 border"
					style={{
						backgroundColor: isDark ? '#1A1A1A' : '#F9FAFB',
						borderColor: isDark ? '#333' : '#E5E7EB',
					}}
				>
					<View className="flex-row items-center justify-between mb-3">
						<Text className="text-xs font-bold uppercase tracking-wider text-gray-500">
							Recibo / Factura
						</Text>
						<View className="px-2 py-0.5 rounded bg-primary/20">
							<Text className="text-[9px] font-black text-primary uppercase tracking-wider">
								#{trip.id.slice(0, 8).toUpperCase()}
							</Text>
						</View>
					</View>
					{trip.completedAt && (
						<Text className="text-[10px] text-gray-400 mb-3">
							{new Date(trip.completedAt).toLocaleDateString(
								'pt-AO',
								{
									day: '2-digit',
									month: 'long',
									year: 'numeric',
									hour: '2-digit',
									minute: '2-digit',
								},
							)}
						</Text>
					)}
					<PriceRow
						label="Subtotal"
						value={Number(trip.subtotal).toLocaleString('pt-AO')}
					/>
					{trip.discountAmount > 0 && (
						<PriceRow
							label="Desconto"
							value={`-${Number(trip.discountAmount).toLocaleString('pt-AO')} Kz`}
							color="#10B981"
						/>
					)}
					<PriceRow
						label="IVA (14%)"
						value={`${Number(trip.ivaAmount).toLocaleString('pt-AO')} Kz`}
					/>
					<PriceRow
						label="Taxa de serviço"
						value={`${Number(trip.serviceFee).toLocaleString('pt-AO')} Kz`}
					/>
					{trip.surgeMultiplierApplied > 1 && (
						<PriceRow
							label="Tarifa dinâmica"
							value={`${trip.surgeMultiplierApplied}x`}
						/>
					)}
					<View
						className="border-t mt-2 pt-2 flex-row justify-between"
						style={{ borderColor: isDark ? '#333' : '#E5E7EB' }}
					>
						<Text
							className="text-base font-bold"
							style={{ color: themeColors.text }}
						>
							Total
						</Text>
						<Text className="text-lg font-black text-primary">
							{Number(trip.totalPrice).toLocaleString('pt-AO')} Kz
						</Text>
					</View>
					<View className="flex-row justify-between mt-1">
						<Text className="text-xs text-gray-500">Pagamento</Text>
						<Text className="text-xs font-bold text-gray-500">
							{trip.paymentMethod}
						</Text>
					</View>
				</Animated.View>

				{/* Distance and Duration */}
				<Animated.View
					entering={FadeInDown.duration(400).delay(300)}
					className="flex-row gap-4 mb-4"
				>
					<View
						className="flex-1 p-4 rounded-2xl border items-center"
						style={{
							backgroundColor: isDark ? '#1A1A1A' : '#F9FAFB',
							borderColor: isDark ? '#333' : '#E5E7EB',
						}}
					>
						<Ionicons
							name="speedometer-outline"
							size={24}
							color={themeColors.primary}
						/>
						<Text
							className="text-lg font-black mt-1"
							style={{ color: themeColors.text }}
						>
							{trip.actualDistanceKm
								? `${trip.actualDistanceKm.toFixed(1)} km`
								: `${(trip.estimatedDistanceKm ?? 0).toFixed(1)} km`}
						</Text>
						<Text className="text-xs text-gray-500">Distância</Text>
					</View>
					<View
						className="flex-1 p-4 rounded-2xl border items-center"
						style={{
							backgroundColor: isDark ? '#1A1A1A' : '#F9FAFB',
							borderColor: isDark ? '#333' : '#E5E7EB',
						}}
					>
						<Ionicons
							name="time-outline"
							size={24}
							color={themeColors.primary}
						/>
						<Text
							className="text-lg font-black mt-1"
							style={{ color: themeColors.text }}
						>
							{trip.actualDurationMin
								? `${trip.actualDurationMin} min`
								: `${trip.estimatedDurationMin ?? 0} min`}
						</Text>
						<Text className="text-xs text-gray-500">Duração</Text>
					</View>
				</Animated.View>

				{/* Timeline */}
				{events && events.length > 0 && (
					<Animated.View
						entering={FadeInDown.duration(400).delay(350)}
						className="mb-6"
					>
						<Text
							className="text-base font-bold mb-4"
							style={{ color: themeColors.text }}
						>
							Linha do Tempo
						</Text>
						{events.map((event, index) => (
							<TimelineItem
								key={event.id}
								event={event}
								isLast={index === events.length - 1}
								themeColors={themeColors}
							/>
						))}
					</Animated.View>
				)}

				{/* Review */}
				{trip.status === 'COMPLETED' && !trip.review && !showReview && (
					<Animated.View
						entering={FadeInUp.duration(400).delay(380)}
						className="mb-6"
					>
						<TouchableOpacity
							onPress={() => setShowReview(true)}
							className="py-3 rounded-2xl items-center bg-primary"
						>
							<Text className="text-base font-bold text-secondary">
								Avaliar Viagem
							</Text>
						</TouchableOpacity>
					</Animated.View>
				)}

				{showReview && (
					<Animated.View
						entering={FadeInUp.duration(400)}
						className="mb-6 p-4 rounded-2xl border"
						style={{
							backgroundColor: isDark ? '#1A1A1A' : '#F9FAFB',
							borderColor: isDark ? '#333' : '#E5E7EB',
						}}
					>
						<Text
							className="text-base font-bold mb-4"
							style={{ color: themeColors.text }}
						>
							Avaliar Viagem
						</Text>

						{/* Star Rating */}
						<View className="flex-row justify-center gap-2 mb-4">
							{[1, 2, 3, 4, 5].map((star) => (
								<TouchableOpacity
									key={star}
									onPress={() => setReviewRating(star)}
									activeOpacity={0.7}
								>
									<Ionicons
										name={
											star <= reviewRating
												? 'star'
												: 'star-outline'
										}
										size={36}
										color={
											star <= reviewRating
												? themeColors.primary
												: '#9CA3AF'
										}
									/>
								</TouchableOpacity>
							))}
						</View>

						<View
							className="px-4 py-3 rounded-2xl border mb-4"
							style={{
								backgroundColor: isDark ? '#121212' : '#FFF',
								borderColor: isDark ? '#333' : '#E5E7EB',
							}}
						>
							<TextInput
								className="text-base"
								style={{
									color: themeColors.text,
									minHeight: 60,
								}}
								placeholder="Comentário (opcional)"
								placeholderTextColor="#9CA3AF"
								multiline
								value={reviewComment}
								onChangeText={setReviewComment}
							/>
						</View>

						<View className="flex-row gap-3">
							<TouchableOpacity
								onPress={() => {
									setShowReview(false);
									setReviewRating(0);
									setReviewComment('');
								}}
								className="flex-1 py-3 rounded-2xl items-center border"
								style={{
									borderColor: isDark ? '#333' : '#E5E7EB',
								}}
							>
								<Text className="text-base font-bold text-gray-500">
									Cancelar
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() => reviewMutation.mutate()}
								className="flex-1 py-3 rounded-2xl items-center bg-primary"
								disabled={
									reviewRating === 0 ||
									reviewMutation.isPending
								}
							>
								{reviewMutation.isPending ? (
									<ActivityIndicator color="#000" />
								) : (
									<Text className="text-base font-bold text-secondary">
										Enviar
									</Text>
								)}
							</TouchableOpacity>
						</View>
					</Animated.View>
				)}

				{/* Dispute */}
				{trip.status === 'COMPLETED' && !showDispute && (
					<Animated.View
						entering={FadeInUp.duration(400).delay(400)}
						className="mb-6"
					>
						<TouchableOpacity
							onPress={() => setShowDispute(true)}
							className="py-3 rounded-2xl items-center border border-red-500/20 bg-red-500/10"
						>
							<Text className="text-base font-bold text-red-500">
								Abrir Disputa
							</Text>
						</TouchableOpacity>
					</Animated.View>
				)}

				{showDispute && (
					<Animated.View
						entering={FadeInUp.duration(400)}
						className="mb-6 p-4 rounded-2xl border"
						style={{
							backgroundColor: isDark ? '#1A1A1A' : '#F9FAFB',
							borderColor: isDark ? '#333' : '#E5E7EB',
						}}
					>
						<Text
							className="text-base font-bold mb-3"
							style={{ color: themeColors.text }}
						>
							Abrir Disputa
						</Text>
						<View
							className="px-4 py-3 rounded-2xl border mb-3"
							style={{
								backgroundColor: isDark ? '#121212' : '#FFF',
								borderColor: isDark ? '#333' : '#E5E7EB',
							}}
						>
							<TextInput
								className="text-base"
								style={{ color: themeColors.text }}
								placeholder="Motivo"
								placeholderTextColor="#9CA3AF"
								value={disputeReason}
								onChangeText={setDisputeReason}
							/>
						</View>
						<View
							className="px-4 py-3 rounded-2xl border mb-3"
							style={{
								backgroundColor: isDark ? '#121212' : '#FFF',
								borderColor: isDark ? '#333' : '#E5E7EB',
							}}
						>
							<TextInput
								className="text-base"
								style={{
									color: themeColors.text,
									minHeight: 60,
								}}
								placeholder="Descrição detalhada"
								placeholderTextColor="#9CA3AF"
								multiline
								value={disputeDesc}
								onChangeText={setDisputeDesc}
							/>
						</View>
						<View className="flex-row gap-3">
							<TouchableOpacity
								onPress={() => setShowDispute(false)}
								className="flex-1 py-3 rounded-2xl items-center border"
								style={{
									borderColor: isDark ? '#333' : '#E5E7EB',
								}}
							>
								<Text className="text-base font-bold text-gray-500">
									Cancelar
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={handleOpenDispute}
								className="flex-1 py-3 rounded-2xl items-center bg-red-500"
								disabled={disputeMutation.isPending}
							>
								{disputeMutation.isPending ? (
									<ActivityIndicator color="#FFF" />
								) : (
									<Text className="text-base font-bold text-white">
										Enviar
									</Text>
								)}
							</TouchableOpacity>
						</View>
					</Animated.View>
				)}

				<View className="h-10" />
			</ScrollView>
		</SafeAreaView>
	);
}

function PriceRow({
	label,
	value,
	color,
}: {
	label: string;
	value: string;
	color?: string;
}) {
	const { themeColors, isDark } = useThemeColors();
	return (
		<View className="flex-row justify-between mb-1.5">
			<Text
				className="text-sm"
				style={{ color: color ?? (isDark ? '#CCC' : '#666') }}
			>
				{label}
			</Text>
			<Text
				className="text-sm font-semibold"
				style={{ color: color ?? themeColors.text }}
			>
				{value}
			</Text>
		</View>
	);
}

function TimelineItem({
	event,
	isLast,
	themeColors,
}: {
	event: TripEventFromApi;
	isLast: boolean;
	themeColors: any;
}) {
	const label = EVENT_LABELS[event.type] ?? event.type;
	return (
		<View className="flex-row">
			<View className="w-6 items-center">
				<View className="w-3 h-3 rounded-full bg-primary" />
				{!isLast && (
					<View className="w-0.5 flex-1 bg-gray-300 dark:bg-gray-700 my-1" />
				)}
			</View>
			<View className={`flex-1 ml-3 ${isLast ? '' : 'mb-4'}`}>
				<Text
					className="text-sm font-semibold"
					style={{ color: themeColors.text }}
				>
					{label}
				</Text>
				<Text className="text-xs text-gray-500">
					{new Date(event.createdAt).toLocaleTimeString('pt-AO', {
						hour: '2-digit',
						minute: '2-digit',
					})}
				</Text>
			</View>
		</View>
	);
}
