import React, { useState, useCallback } from 'react';
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	Modal,
	Pressable,
	Platform,
	KeyboardAvoidingView,
	Keyboard,
	TouchableWithoutFeedback,
	RefreshControl,
	Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAddresses } from '../../hooks/useAddresses';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import { AddressListSkeleton } from '../../components/skeletons/AddressSkeleton';
import Input from '../../components/Input';
import Button from '../../components/Button';
import type { AddressLabel, UserAddress } from '../../types/api';

const LABEL_OPTIONS: { label: string; value: AddressLabel; icon: string }[] = [
	{ label: 'Casa', value: 'HOME', icon: 'home' },
	{ label: 'Trabalho', value: 'WORK', icon: 'briefcase' },
	{ label: 'Outro', value: 'OTHER', icon: 'location-outline' },
];

const LABEL_COLORS: Record<string, string> = {
	HOME: '#FFD700',
	WORK: '#3B82F6',
	OTHER: '#6B7280',
};

const LABEL_BG: Record<string, string> = {
	HOME: '#FFD70015',
	WORK: '#3B82F615',
	OTHER: '#6B728015',
};

export default function AddressesScreen() {
	const navigation = useNavigation();
	const { themeColors, isDark } = useThemeColors();
	const {
		addresses,
		isLoading,
		refetch,
		createAddress,
		isCreating,
		deleteAddress,
		updateAddress,
		isUpdating,
	} = useAddresses();

	const { location: currentLocation } = useCurrentLocation();

	const [isRefreshing, setIsRefreshing] = useState(false);
	const [showAddModal, setShowAddModal] = useState(false);
	const [editingAddress, setEditingAddress] = useState<UserAddress | null>(
		null,
	);

	const handleRefresh = useCallback(async () => {
		setIsRefreshing(true);
		await refetch();
		setIsRefreshing(false);
	}, [refetch]);
	const [newLabel, setNewLabel] = useState('');
	const [newAddress, setNewAddress] = useState('');
	const [selectedLabel, setSelectedLabel] = useState<AddressLabel>('OTHER');
	const [selectedLat, setSelectedLat] = useState(
		currentLocation?.latitude ?? -8.8399,
	);
	const [selectedLng, setSelectedLng] = useState(
		currentLocation?.longitude ?? 13.2344,
	);

	const handleAdd = () => {
		if (!newLabel || !newAddress) return;

		if (editingAddress) {
			updateAddress(
				{
					addressId: editingAddress.id,
					data: {
						label: selectedLabel,
						customLabel:
							selectedLabel === 'OTHER' ? newLabel : undefined,
						address: newAddress,
						lat: selectedLat,
						lng: selectedLng,
					},
				},
				{
					onSuccess: () => {
						setEditingAddress(null);
						resetModalState();
					},
				},
			);
		} else {
			createAddress(
				{
					label: selectedLabel,
					customLabel:
						selectedLabel === 'OTHER' ? newLabel : undefined,
					address: newAddress,
					lat: selectedLat,
					lng: selectedLng,
				},
				{
					onSuccess: () => {
						resetModalState();
					},
				},
			);
		}
	};

	const handleUseCurrentLocation = () => {
		if (currentLocation) {
			setSelectedLat(currentLocation.latitude);
			setSelectedLng(currentLocation.longitude);
			if (currentLocation.address) {
				setNewAddress(currentLocation.address);
			}
			Alert.alert('Localização', 'Posição atual definida no mapa');
		} else {
			Alert.alert('Erro', 'Não foi possível obter a localização atual');
		}
	};

	const resetModalState = () => {
		setNewLabel('');
		setNewAddress('');
		setSelectedLabel('OTHER');
		setSelectedLat(currentLocation?.latitude ?? -8.8399);
		setSelectedLng(currentLocation?.longitude ?? 13.2344);
		setEditingAddress(null);
		setShowAddModal(false);
	};

	const handleEdit = (item: UserAddress) => {
		setEditingAddress(item);
		setNewLabel(item.customLabel || item.label);
		setNewAddress(item.address);
		setSelectedLabel(item.label);
		setSelectedLat(item.lat);
		setSelectedLng(item.lng);
		setShowAddModal(true);
	};

	const handleDelete = (id: string) => {
		deleteAddress(id);
	};

	const iconForLabel = (label: AddressLabel) => {
		const found = LABEL_OPTIONS.find((o) => o.value === label);
		return found?.icon || 'location-outline';
	};

	return (
		<SafeAreaView
			className="flex-1"
			style={{ backgroundColor: themeColors.background }}
		>
			{/* Header */}
			<View className="flex-row items-center justify-between px-5 py-3">
				<TouchableOpacity
					onPress={() => navigation.goBack()}
					className="w-10 h-10 items-center justify-center rounded-full bg-black/5 dark:bg-white/10"
					activeOpacity={0.7}
				>
					<Ionicons
						name="chevron-back"
						size={22}
						color={themeColors.text}
					/>
				</TouchableOpacity>
				<Text
					className="text-xl font-bold tracking-tight"
					style={{ color: themeColors.text }}
				>
					Endereços
				</Text>
				<TouchableOpacity
					onPress={() => {
						resetModalState();
						setShowAddModal(true);
					}}
					className="w-10 h-10 items-center justify-center rounded-full bg-primary/10"
					activeOpacity={0.7}
				>
					<Ionicons
						name="add"
						size={24}
						color={themeColors.primary}
					/>
				</TouchableOpacity>
			</View>

			{isLoading ? (
				<AddressListSkeleton />
			) : (
				<ScrollView
					contentContainerClassName="px-5 pb-10 pt-2"
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={isRefreshing}
							onRefresh={handleRefresh}
						/>
					}
				>
					{addresses.length === 0 ? (
						<View className="items-center py-20">
							<View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-4">
								<Ionicons
									name="location-outline"
									size={36}
									color={themeColors.primary}
								/>
							</View>
							<Text
								className="text-lg font-bold mt-2"
								style={{ color: themeColors.text }}
							>
								Nenhum endereço salvo
							</Text>
							<Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
								Adicione endereços para agilizar suas viagens
							</Text>
						</View>
					) : (
						addresses.map((item, index) => {
							const accentColor =
								LABEL_COLORS[item.label] || '#6B7280';
							const bgAccent =
								LABEL_BG[item.label] || '#6B728015';
							return (
								<Animated.View
									key={item.id}
									entering={FadeInRight.duration(500).delay(
										index * 80,
									)}
								>
									<TouchableOpacity
										className="flex-row bg-white dark:bg-soft-black rounded-2xl mb-3 overflow-hidden active:opacity-70"
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
										activeOpacity={0.7}
									>
										{/* Left accent */}
										<View
											style={{
												width: 4,
												backgroundColor: accentColor,
											}}
										/>

										<View className="flex-row items-center flex-1 p-4 gap-3">
											<View
												className="w-11 h-11 rounded-xl items-center justify-center"
												style={{
													backgroundColor: bgAccent,
												}}
											>
												<Ionicons
													name={
														iconForLabel(
															item.label,
														) as any
													}
													size={20}
													color={accentColor}
												/>
											</View>
											<View className="flex-1">
												<Text
													className="text-base font-extrabold tracking-tight mb-0.5"
													style={{
														color: themeColors.text,
													}}
												>
													{item.customLabel ||
														item.label}
												</Text>
												<Text
													className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
													numberOfLines={2}
												>
													{item.address}
												</Text>
											</View>
											<TouchableOpacity
												onPress={() => handleEdit(item)}
												className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-500/10 mr-2"
												activeOpacity={0.6}
											>
												<Ionicons
													name="pencil-outline"
													size={18}
													color="#3B82F6"
												/>
											</TouchableOpacity>
											<TouchableOpacity
												onPress={() =>
													handleDelete(item.id)
												}
												className="p-2.5 rounded-full bg-red-50 dark:bg-red-500/10"
												activeOpacity={0.6}
											>
												<Ionicons
													name="trash-outline"
													size={18}
													color="#EF4444"
												/>
											</TouchableOpacity>
										</View>
									</TouchableOpacity>
								</Animated.View>
							);
						})
					)}

					{addresses.length > 0 && (
						<Animated.View entering={FadeInDown.duration(600)}>
							<TouchableOpacity
								onPress={() => {
									resetModalState();
									setShowAddModal(true);
								}}
								className="flex-row items-center justify-center py-5 gap-2"
								activeOpacity={0.6}
							>
								<Ionicons
									name="add-circle-outline"
									size={24}
									color={themeColors.primary}
								/>
								<Text
									className="text-base font-bold"
									style={{ color: themeColors.primary }}
								>
									Adicionar novo endereço
								</Text>
							</TouchableOpacity>
						</Animated.View>
					)}
				</ScrollView>
			)}

			{/* Add/Edit modal */}
			<Modal
				visible={showAddModal}
				animationType="slide"
				transparent
				onRequestClose={resetModalState}
			>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					className="flex-1 justify-end"
				>
					<Pressable
						className="absolute inset-0 bg-black/50"
						onPress={resetModalState}
					/>
					<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
						<View
							className={`rounded-t-3xl p-6 pb-10 ${isDark ? 'bg-[#121212]' : 'bg-white'}`}
						>
							<View className="flex-row items-center justify-between mb-6">
								<Text
									className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}
								>
									{editingAddress
										? 'Editar Endereço'
										: 'Novo Endereço'}
								</Text>
								<TouchableOpacity
									onPress={resetModalState}
									className="w-8 h-8 items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full"
									activeOpacity={0.6}
								>
									<Ionicons
										name="close"
										size={20}
										color={isDark ? '#FFF' : '#000'}
									/>
								</TouchableOpacity>
							</View>

							<Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
								Tipo de endereço
							</Text>
							<View className="flex-row gap-3 mb-5">
								{LABEL_OPTIONS.map((opt) => {
									const isActive =
										selectedLabel === opt.value;
									const accentColor = LABEL_COLORS[opt.value];
									return (
										<TouchableOpacity
											key={opt.value}
											onPress={() =>
												setSelectedLabel(opt.value)
											}
											className={`flex-1 flex-row items-center justify-center py-3 px-2 rounded-xl gap-1 ${
												isActive
													? `bg-primary`
													: isDark
														? 'bg-[#262626]'
														: 'bg-gray-100'
											}`}
											activeOpacity={0.7}
										>
											<Ionicons
												name={opt.icon as any}
												size={16}
												color={
													isActive
														? '#231F20'
														: accentColor
												}
											/>
											<Text
												className={`text-xs font-bold ${
													isActive
														? 'text-secondary'
														: 'text-gray-500 dark:text-gray-400'
												}`}
											>
												{opt.label}
											</Text>
										</TouchableOpacity>
									);
								})}
							</View>

							{/* Map Picker */}
							<View
								className="h-44 rounded-2xl overflow-hidden mb-4 border"
								style={{
									borderColor: isDark ? '#333' : '#E5E7EB',
								}}
							>
								<MapView
									style={{ flex: 1 }}
									initialRegion={{
										latitude: selectedLat,
										longitude: selectedLng,
										latitudeDelta: 0.01,
										longitudeDelta: 0.01,
									}}
									onPress={(e) => {
										setSelectedLat(
											e.nativeEvent.coordinate.latitude,
										);
										setSelectedLng(
											e.nativeEvent.coordinate.longitude,
										);
									}}
									mapType="standard"
								>
									<Marker
										coordinate={{
											latitude: selectedLat,
											longitude: selectedLng,
										}}
										draggable
										onDragEnd={(e) => {
											setSelectedLat(
												e.nativeEvent.coordinate
													.latitude,
											);
											setSelectedLng(
												e.nativeEvent.coordinate
													.longitude,
											);
										}}
										pinColor="#FFD700"
									/>
								</MapView>
							</View>

							<TouchableOpacity
								onPress={handleUseCurrentLocation}
								className="flex-row items-center justify-center py-2 mb-4 gap-2 rounded-xl border"
								style={{
									borderColor: isDark ? '#333' : '#E5E7EB',
								}}
								activeOpacity={0.7}
							>
								<Ionicons
									name="locate-outline"
									size={18}
									color={themeColors.primary}
								/>
								<Text
									className="text-sm font-bold"
									style={{ color: themeColors.primary }}
								>
									Usar localização atual
								</Text>
							</TouchableOpacity>

							<Input
								label={
									selectedLabel === 'OTHER'
										? 'Nome personalizado'
										: 'Nome do local'
								}
								value={newLabel}
								onChangeText={setNewLabel}
								placeholder="Ex: Casa, Trabalho"
							/>
							<Input
								label="Endereço completo"
								value={newAddress}
								onChangeText={setNewAddress}
								placeholder="Ex: Rocha Cabine, Luanda"
							/>
							<Button
								title={editingAddress ? 'Salvar' : 'Adicionar'}
								onPress={handleAdd}
								loading={isCreating || isUpdating}
							/>
						</View>
					</TouchableWithoutFeedback>
				</KeyboardAvoidingView>
			</Modal>
		</SafeAreaView>
	);
}
