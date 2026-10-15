import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import { HIT_SLOP } from '../store/type';

/**
 * Avatar de iniciais (ou foto, quando existir).
 *
 * Substitui quatro versões escritas à mão que divergiam entre si em tamanho,
 * cor de fundo e cor de tinta. A mais egregious — `RidePeople`, 44px — punha
 * `text` (#001536) sobre `primary` (#0071EB), que dá 3.9:1 e viola a regra do
 * próprio `colors.ts`. Aqui a tinta é sempre `onPrimary`, que o token existe
 * precisamente para isso.
 *
 * **Não há fotografia de utilizador na app.** O campo `image` existe no
 * esquema do better-auth mas nunca é preenchido: o registo é telefone-primeiro
 * e não há upload de avatar. O componente aceita `image` na mesma, para o dia
 * em que existir — sem isso, a primeira pessoa a precisar de uma fotografia
 * teria de desenhar isto de novo.
 */

type AvatarSize = 36 | 44 | 64;

/** Tamanho da letra das iniciais, em função do diâmetro do círculo. */
const INK: Record<AvatarSize, number> = { 36: 13, 44: 15, 64: 22 };

/** Tamanho do glifo de pessoa, para o caso de não haver nome nenhum. */
const GLYPH: Record<AvatarSize, number> = { 36: 18, 44: 22, 64: 30 };

export default function Avatar({
	initials,
	image = null,
	size = 44,
	onPress,
	accessibilityLabel,
}: {
	initials: string;
	image?: string | null;
	size?: AvatarSize;
	onPress?: () => void;
	accessibilityLabel?: string;
}) {
	const { themeColors } = useThemeColors();

	const circle = (
		<View
			className="rounded-full items-center justify-center overflow-hidden"
			style={{
				width: size,
				height: size,
				backgroundColor: themeColors.primary,
			}}
		>
			{image ? (
				<Image
					source={{ uri: image }}
					style={{ width: size, height: size }}
					resizeMode="cover"
				/>
			) : initials ? (
				<Text
					className="font-sansExtraBold"
					style={{
						color: themeColors.onPrimary,
						fontSize: INK[size],
					}}
				>
					{initials}
				</Text>
			) : (
				/*
				 * Sem nome e sem apelido — o registo aceita os dois vazios.
				 * Um glifo de pessoa é o que a plataforma toda usa para
				 * "conta sem retrato"; um ponto de interrogação seria uma
				 * pergunta feita à pessoa que não cabe ali responder.
				 */
				<Ionicons
					name="person"
					size={GLYPH[size]}
					color={themeColors.onPrimary}
				/>
			)}
		</View>
	);

	if (!onPress) return circle;

	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel ?? 'Abrir perfil'}
			hitSlop={HIT_SLOP}
		>
			{circle}
		</Pressable>
	);
}
