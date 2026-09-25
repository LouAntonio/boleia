import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import StatusStamp from '../../components/StatusStamp';
import SectionTitle from '../../components/SectionTitle';
import { useDbStore } from '../../mock/db';
import { initials } from '../../mock/helpers';
import { reviewsFor } from '../../mock/repos/reviewRepo';

function Stat({
	value,
	label,
	first,
}: {
	value: string;
	label: string;
	first?: boolean;
}) {
	const { themeColors } = useThemeColors();
	return (
		<View
			className="flex-1 items-center"
			style={
				first
					? undefined
					: {
							borderLeftWidth: 1,
							borderLeftColor: themeColors.border,
						}
			}
		>
			<Text
				className="font-sansMedium text-label"
				style={{ color: themeColors.laterite }}
			>
				{value}
			</Text>
			<Text
				className="font-sansMedium text-body-xs mt-1"
				style={{ color: themeColors.secondary }}
			>
				{label}
			</Text>
		</View>
	);
}

export default function PublicProfileScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'PublicProfile'>
		>();
	const route =
		useRoute<RouteProp<BoleiaMainStackParamList, 'PublicProfile'>>();
	const { themeColors } = useThemeColors();

	const user = useDbStore((s) =>
		s.db.users.find((u) => u.id === route.params.userId),
	);
	const reviews = reviewsFor(route.params.userId);

	if (!user) {
		return (
			<SafeAreaView
				className="flex-1 items-center justify-center px-5"
				style={{ backgroundColor: themeColors.background }}
			>
				<Text style={{ color: themeColors.secondary }}>
					Perfil não encontrado.
				</Text>
			</SafeAreaView>
		);
	}

	const veh = user.vehicle;
	const rating = user.rating ? user.rating.toFixed(1) : 'novo';
	const since = new Date(user.createdAt)
		.toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' })
		.replace('.', '')
		.toUpperCase();

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
				<View className="flex-1">
					<Text
						className="font-sansMedium text-body-xs"
						style={{ color: themeColors.laterite }}
					>
						Perfil público
					</Text>
					<Text
						className="font-sansExtraBold text-title-secondary -mt-0.5"
						style={{ color: themeColors.text }}
					>
						{user.firstName} {user.lastName}
					</Text>
				</View>
			</View>

			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingBottom: 48 }}
			>
				{/* Ficha de apresentação */}
				<View
					className="p-5 rounded-xl border"
					style={{
						borderColor: themeColors.border,
						backgroundColor: themeColors.card,
					}}
				>
					<View className="items-center">
						<View
							className="w-20 h-20 rounded-full items-center justify-center"
							style={{
								backgroundColor: themeColors.primary,
								borderWidth: 2,
								borderColor: themeColors.laterite,
							}}
						>
							<Text
								className="font-sansExtraBold text-title-primary"
								style={{ color: themeColors.text }}
							>
								{initials(user.firstName, user.lastName)}
							</Text>
						</View>
						<Text
							className="font-sansBold text-title-secondary mt-3"
							style={{ color: themeColors.text }}
						>
							{user.firstName} {user.lastName}
						</Text>
						<View className="flex-row items-center mt-1">
							<Text
								className="font-sansMedium text-label-small mr-1"
								style={{ color: themeColors.laterite }}
							>
								★
							</Text>
							<Text
								className="font-sansMedium text-body-small"
								style={{ color: themeColors.secondary }}
							>
								{rating}
								{user.ratingsCount > 0
									? ` · ${user.ratingsCount} avaliaçõe${user.ratingsCount > 1 ? 's' : ''}`
									: ''}
							</Text>
						</View>
					</View>

					<View
						className="border-t my-4"
						style={{ borderColor: themeColors.border }}
					/>

					<View className="flex-row">
						<Stat first value={rating} label="Avaliação" />
						<Stat
							value={String(user.ratingsCount)}
							label="Viagens"
						/>
						<Stat value={since} label="Desde" />
					</View>
				</View>

				<View className="flex-row mt-4 justify-center">
					<StatusStamp status={user.kyc?.status ?? 'nao_submetido'} />
					<View className="ml-2">
						<StatusStamp
							status={user.vehicle?.status ?? 'nao_submetido'}
							label={
								user.vehicle
									? 'Viatura registada'
									: 'Sem viatura'
							}
						/>
					</View>
				</View>

				{veh ? (
					<View className="mt-6">
						<SectionTitle>Viatura</SectionTitle>
						<View
							className="p-4 rounded-xl border"
							style={{
								borderColor: themeColors.border,
								backgroundColor: themeColors.card,
							}}
						>
							<View className="flex-row items-start justify-between">
								<View className="flex-1 mr-3">
									<Text
										className="font-sansBold text-label"
										style={{ color: themeColors.text }}
									>
										{veh.make} {veh.model}
									</Text>
									<Text
										className="font-sansMedium text-body-xs mt-0.5"
										style={{ color: themeColors.secondary }}
									>
										{veh.color} · {veh.plate}
									</Text>
									<Text
										className="font-sans text-body-xs mt-1"
										style={{ color: themeColors.secondary }}
									>
										{veh.seats} lugares de lotação
									</Text>
								</View>
								<View
									className="rounded-full border px-2.5 py-1"
									style={{ borderColor: themeColors.mato }}
								>
									<Text
										className="font-sansMedium text-body-xs"
										style={{ color: themeColors.mato }}
									>
										Registada
									</Text>
								</View>
							</View>
						</View>
					</View>
				) : null}

				<View className="mt-6">
					<SectionTitle>Avaliações ({reviews.length})</SectionTitle>
					{reviews.length === 0 ? (
						<Text
							className="font-sans text-body-small"
							style={{ color: themeColors.secondary }}
						>
							Ainda sem avaliações nesta rota.
						</Text>
					) : (
						reviews.map((r) => (
							<View
								key={r.id}
								className="rounded-xl border mb-2 overflow-hidden"
								style={{
									borderColor: themeColors.border,
									backgroundColor: themeColors.card,
								}}
							>
								<View className="flex-row">
									<View
										className="w-[4px]"
										style={{
											backgroundColor:
												themeColors.laterite,
										}}
									/>
									<View className="flex-1 p-3.5">
										<View className="flex-row items-center">
											<Text
												className="font-sansMedium text-body-small mr-2"
												style={{
													color: themeColors.laterite,
												}}
											>
												★ {r.rating}
											</Text>
											<Text
												className="font-sansMedium text-body-xs"
												style={{
													color: themeColors.secondary,
												}}
											>
												{new Date(
													r.createdAt,
												).toLocaleDateString('pt-PT', {
													day: '2-digit',
													month: 'short',
													year: 'numeric',
												})}
											</Text>
										</View>
										<Text
											className="font-sans text-body-small mt-1"
											style={{
												color: themeColors.secondary,
											}}
										>
											{r.comment}
										</Text>
									</View>
								</View>
							</View>
						))
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
