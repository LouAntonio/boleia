import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import BoleiaButton from '../../components/BoleiaButton';
import { useDbStore } from '../../mock/db';
import { initials } from '../../mock/helpers';
import { writeReview, submittedReview } from '../../mock/repos/reviewRepo';

export default function ReviewScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'Review'>
		>();
	const route = useRoute<RouteProp<BoleiaMainStackParamList, 'Review'>>();
	const { themeColors } = useThemeColors();

	const target = useDbStore((s) =>
		s.db.users.find((u) => u.id === route.params.toUserId),
	);
	const ride = useDbStore((s) =>
		s.db.rides.find((r) => r.id === route.params.rideId),
	);
	const already = submittedReview(
		'u_me_001',
		route.params.rideId,
		route.params.toUserId,
	);
	const subjectLabel =
		route.params.subject === 'passenger'
			? 'Avaliar passageiro'
			: 'Avaliar motorista';

	const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
	const [comment, setComment] = useState('');
	const [done, setDone] = useState(false);

	const submit = () => {
		writeReview({
			byUserId: 'u_me_001',
			toUserId: route.params.toUserId,
			rideId: route.params.rideId,
			rating,
			comment,
		});
		setDone(true);
		setTimeout(() => navigation.goBack(), 900);
	};

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
					{subjectLabel}
				</Text>
			</View>

			<ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
				<View className="items-center pt-6">
					<View
						className="w-16 h-16 rounded-full items-center justify-center"
						style={{ backgroundColor: themeColors.primary }}
					>
						<Text
							className="font-display text-[20px]"
							style={{ color: themeColors.text }}
						>
							{target
								? initials(target.firstName, target.lastName)
								: '?'}
						</Text>
					</View>
					<Text
						className="font-sansBold text-[18px] mt-3"
						style={{ color: themeColors.text }}
					>
						{target
							? `${target.firstName} ${target.lastName}`
							: '—'}
					</Text>
					<Text
						className="font-mono text-[12px]"
						style={{ color: themeColors.secondary }}
					>
						{ride?.routeName ?? ''}
					</Text>
				</View>

				{already || done ? (
					<View
						className="mt-10 items-center p-5 rounded-2xl border"
						style={{
							borderColor: themeColors.mato,
							backgroundColor: themeColors.card,
						}}
					>
						<Ionicons
							name="checkmark-circle"
							size={34}
							color={themeColors.mato}
						/>
						<Text
							className="font-sansBold text-[16px] mt-2"
							style={{ color: themeColors.mato }}
						>
							Avaliação guardada
						</Text>
						<Text
							className="font-sans text-[13px] text-center mt-1"
							style={{ color: themeColors.secondary }}
						>
							Obrigado por ajudar a comunidade a viajar com gente
							de confiança.
						</Text>
					</View>
				) : (
					<View className="mt-8 items-center">
						<View className="flex-row">
							{[1, 2, 3, 4, 5].map((n) => (
								<Pressable
									key={n}
									onPress={() =>
										setRating(n as 1 | 2 | 3 | 4 | 5)
									}
									className="px-2"
								>
									<Ionicons
										name="star"
										size={34}
										color={
											n <= rating
												? themeColors.primary
												: themeColors.border
										}
									/>
								</Pressable>
							))}
						</View>
						<Text
							className="font-sansMedium text-[13px] mt-2"
							style={{ color: themeColors.secondary }}
						>
							{rating} de 5
						</Text>

						<View
							className="w-full rounded-xl border px-3.5 mt-6"
							style={{
								borderColor: themeColors.border,
								backgroundColor: themeColors.card,
							}}
						>
							<TextInput
								value={comment}
								onChangeText={setComment}
								multiline
								placeholder="Como foi a viagem? (opcional)"
								placeholderTextColor={themeColors.border}
								className="py-3 font-sans text-[14px]"
								style={{
									color: themeColors.text,
									minHeight: 88,
								}}
							/>
						</View>

						<View className="w-full mt-6">
							<BoleiaButton
								title="Guardar avaliação"
								onPress={submit}
							/>
						</View>
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}
