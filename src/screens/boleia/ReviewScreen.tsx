import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useSessionUserId } from '../../hooks/useSessionUser';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import BoleiaButton from '../../components/BoleiaButton';
import { useDbStore } from '../../mock/db';
import { initials } from '../../mock/helpers';
import { writeReview, submittedReview } from '../../mock/repos/reviewRepo';

const MAX_COMMENT = 240;

export default function ReviewScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'Review'>
		>();
	const route = useRoute<RouteProp<BoleiaMainStackParamList, 'Review'>>();
	const { themeColors } = useThemeColors();
	const sessionUserId = useSessionUserId();

	const target = useDbStore((s) =>
		s.db.users.find((u) => u.id === route.params.toUserId),
	);
	const ride = useDbStore((s) =>
		s.db.rides.find((r) => r.id === route.params.rideId),
	);
	const already = submittedReview(
		sessionUserId,
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
			byUserId: sessionUserId,
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
				<View className="flex-1">
					<Text
						className="font-sansMedium text-body-xs"
						style={{ color: themeColors.laterite }}
					>
						{subjectLabel}
					</Text>
					<Text
						className="font-sansExtraBold text-title-secondary -mt-0.5"
						style={{ color: themeColors.text }}
					>
						Como correu a viagem?
					</Text>
				</View>
			</View>

			<ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
				<View className="items-center pt-6">
					<View
						className="w-16 h-16 rounded-full items-center justify-center"
						style={{
							backgroundColor: themeColors.primary,
							borderWidth: 2,
							borderColor: themeColors.laterite,
						}}
					>
						<Text
							className="font-sansExtraBold text-title-secondary"
							style={{ color: themeColors.text }}
						>
							{target
								? initials(target.firstName, target.lastName)
								: '?'}
						</Text>
					</View>
					<Text
						className="font-sansBold text-title-tertiary mt-3"
						style={{ color: themeColors.text }}
					>
						{target
							? `${target.firstName} ${target.lastName}`
							: '—'}
					</Text>
					<Text
						className="font-sansMedium text-body-xs"
						style={{ color: themeColors.secondary }}
					>
						{ride?.routeName ?? ''}
					</Text>
				</View>

				{already || done ? (
					<View
						className="mt-10 items-center p-5 rounded-xl border"
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
							className="font-sansMedium text-body-xs mt-2"
							style={{ color: themeColors.mato }}
						>
							Recibo
						</Text>
						<Text
							className="font-sansBold text-label mt-0.5"
							style={{ color: themeColors.mato }}
						>
							Avaliação guardada
						</Text>
						<Text
							className="font-sans text-body-small text-center mt-1"
							style={{ color: themeColors.secondary }}
						>
							Obrigado por ajudar a comunidade a viajar com gente
							de confiança.
						</Text>
					</View>
				) : (
					<View className="mt-8">
						<View
							className="p-5 rounded-xl border"
							style={{
								borderColor: themeColors.border,
								backgroundColor: themeColors.card,
							}}
						>
							<Text
								className="font-sansMedium text-body-xs"
								style={{ color: themeColors.laterite }}
							>
								A tua nota
							</Text>
							<View className="flex-row justify-center pt-3">
								{[1, 2, 3, 4, 5].map((n) => (
									<Pressable
										key={n}
										onPress={() =>
											setRating(n as 1 | 2 | 3 | 4 | 5)
										}
										className="px-1.5"
										style={({ pressed }) => ({
											opacity: pressed ? 0.6 : 1,
											transform: [
												{
													scale: pressed ? 0.9 : 1,
												},
											],
										})}
									>
										<Ionicons
											name={
												n <= rating
													? 'star'
													: 'star-outline'
											}
											size={36}
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
								className="font-sansMedium text-body-xs text-center mt-2"
								style={{ color: themeColors.secondary }}
							>
								{rating} de 5{' '}
								{rating === 1
									? '· correu mal'
									: rating === 5
										? '· viagem perfeita'
										: ''}
							</Text>

							<View
								className="border-t mt-5"
								style={{ borderColor: themeColors.border }}
							/>

							<View className="flex-row items-center justify-between mt-5">
								<Text
									className="font-sansMedium text-body-xs"
									style={{ color: themeColors.secondary }}
								>
									Comentário · opcional
								</Text>
								<Text
									className="font-sansMedium text-body-xs"
									style={{ color: themeColors.border }}
								>
									{comment.length}/{MAX_COMMENT}
								</Text>
							</View>
							<View
								className="rounded-xl border px-3.5 mt-2.5"
								style={{
									borderColor: themeColors.border,
									backgroundColor: themeColors.background,
								}}
							>
								<TextInput
									value={comment}
									onChangeText={(t) =>
										setComment(t.slice(0, MAX_COMMENT))
									}
									multiline
									placeholder="O que te marcou na viagem?"
									placeholderTextColor={themeColors.border}
									className="py-3 font-sans text-body-small"
									style={{
										color: themeColors.text,
										minHeight: 96,
									}}
								/>
							</View>
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
