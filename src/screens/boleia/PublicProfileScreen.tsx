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
					Perfil
				</Text>
			</View>

			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingBottom: 48 }}
			>
				<View className="items-center pt-4">
					<View
						className="w-20 h-20 rounded-full items-center justify-center"
						style={{ backgroundColor: themeColors.primary }}
					>
						<Text
							className="font-display text-[26px]"
							style={{ color: themeColors.text }}
						>
							{initials(user.firstName, user.lastName)}
						</Text>
					</View>
					<Text
						className="font-sansBold text-[20px] mt-3"
						style={{ color: themeColors.text }}
					>
						{user.firstName} {user.lastName}
					</Text>
					<View className="flex-row items-center mt-1">
						<Text
							className="font-mono text-[15px] mr-1"
							style={{ color: themeColors.laterite }}
						>
							★
						</Text>
						<Text
							className="font-sansMedium text-[14px]"
							style={{ color: themeColors.secondary }}
						>
							{user.rating ? user.rating.toFixed(1) : 'novo'}
							{user.ratingsCount > 0
								? ` · ${user.ratingsCount} avaliaçõe${user.ratingsCount > 1 ? 's' : ''}`
								: ''}
						</Text>
					</View>
					<View className="flex-row mt-2">
						<StatusStamp
							status={user.kyc?.status ?? 'nao_submetido'}
						/>
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
				</View>

				{user.bio ? (
					<Text
						className="font-sans text-[13px] leading-5 text-center mt-4 px-4"
						style={{ color: themeColors.secondary }}
					>
						{user.bio}
					</Text>
				) : null}

				{veh ? (
					<View className="mt-6">
						<SectionTitle>Viatura</SectionTitle>
						<View
							className="p-4 rounded-2xl border"
							style={{
								borderColor: themeColors.border,
								backgroundColor: themeColors.card,
							}}
						>
							<Text
								className="font-sansBold text-[16px]"
								style={{ color: themeColors.text }}
							>
								{veh.make} {veh.model}
							</Text>
							<Text
								className="font-mono text-[12px] mt-0.5"
								style={{ color: themeColors.secondary }}
							>
								{veh.color} · {veh.plate}
							</Text>
							<Text
								className="font-sans text-[12px] mt-1"
								style={{ color: themeColors.secondary }}
							>
								{veh.seats} lugares de lotação
							</Text>
						</View>
					</View>
				) : null}

				<View className="mt-6">
					<SectionTitle>Avaliações ({reviews.length})</SectionTitle>
					{reviews.length === 0 ? (
						<Text
							className="font-sans text-[13px]"
							style={{ color: themeColors.secondary }}
						>
							Ainda sem avaliações nesta rota.
						</Text>
					) : (
						reviews.map((r) => (
							<View
								key={r.id}
								className="p-3.5 rounded-2xl border mb-2"
								style={{
									borderColor: themeColors.border,
									backgroundColor: themeColors.card,
								}}
							>
								<View className="flex-row items-center">
									<Text
										className="font-mono text-[14px] mr-1"
										style={{ color: themeColors.laterite }}
									>
										★ {r.rating}
									</Text>
									<Text
										className="font-mono text-[11px]"
										style={{ color: themeColors.secondary }}
									>
										{r.createdAt.slice(0, 10)}
									</Text>
								</View>
								<Text
									className="font-sans text-[13px] mt-1"
									style={{ color: themeColors.secondary }}
								>
									{r.comment}
								</Text>
							</View>
						))
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
