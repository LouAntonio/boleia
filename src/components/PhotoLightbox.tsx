import React from 'react';
import { Modal, Text, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Visualizador de foto em ecrã cheio — fundo escuro, toque em qualquer
// ponto (ou no X) fecha. Usa o padrão de Modal já existente na app.
export default function PhotoLightbox({
	uri,
	label,
	onClose,
}: {
	uri: string | null;
	label?: string;
	onClose: () => void;
}) {
	const insets = useSafeAreaInsets();

	return (
		<Modal
			visible={uri != null}
			transparent
			animationType="fade"
			onRequestClose={onClose}
		>
			<Pressable
				style={{
					flex: 1,
					backgroundColor: 'rgba(0,0,0,0.94)',
					alignItems: 'center',
					justifyContent: 'center',
				}}
				onPress={onClose}
			>
				{uri ? (
					<Image
						source={{ uri }}
						resizeMode="contain"
						style={{ width: '90%', height: '75%' }}
					/>
				) : null}

				<Pressable
					onPress={onClose}
					hitSlop={8}
					style={{
						position: 'absolute',
						top: insets.top + 12,
						right: 16,
						width: 40,
						height: 40,
						borderRadius: 20,
						alignItems: 'center',
						justifyContent: 'center',
						backgroundColor: 'rgba(255,255,255,0.14)',
					}}
				>
					<Ionicons name="close" size={20} color="#F7F3E7" />
				</Pressable>

				{label ? (
					<Text
						className="font-mono text-[11px] uppercase tracking-[2px]"
						style={{
							position: 'absolute',
							bottom: insets.bottom + 28,
							alignSelf: 'center',
							color: '#F7F3E7',
							opacity: 0.9,
						}}
					>
						{label}
					</Text>
				) : null}
			</Pressable>
		</Modal>
	);
}
