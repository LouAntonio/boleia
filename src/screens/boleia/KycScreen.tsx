import React, { useCallback, useMemo, useState } from 'react';
import {
	View,
	Text,
	ScrollView,
	ActivityIndicator,
	Alert,
	useWindowDimensions,
	LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoleiaMainStackParamList } from '../../types/navigation';
import { useThemeColors } from '../../hooks/useThemeColors';
import BackButton from '../../components/BackButton';
import BoleiaButton from '../../components/BoleiaButton';
import Card from '../../components/Card';
import PhotoSlot, { ProgressRail } from '../../components/PhotoSlot';
import PhotoLightbox from '../../components/PhotoLightbox';
import SegmentedControl from '../../components/SegmentedControl';
import StickyCta from '../../components/StickyCta';
import { useAppStore } from '../../store/appStore';
import {
	ApiKycMe,
	apiErrorMessage,
	getKycMe,
	KycMediaIds,
	submitDriverKyc,
	submitPassengerKyc,
	uploadPhoto,
} from '../../lib/api';

type Mode = 'passenger' | 'driver';

/** Quantos uploads correm ao mesmo tempo. */
const UPLOAD_CONCURRENCY = 3;

/** Balde do `mediaIds` a que uma foto pertence. */
type UploadSlot = 'biFront' | 'biBack' | 'selfie' | 'license' | 'bodyPhoto';

type UploadItem = { uri: string; label: string; slot: UploadSlot };

/** O que o upload vai juntando, antes de virar `mediaIds`. */
type Collected = {
	biFront?: string;
	biBack?: string;
	selfies: string[];
	license?: string;
	bodyPhoto?: string;
};

/**
 * Cabeçalho de um grupo do dossiê.
 *
 * Antes cada secção do formulário repetia a mesma casca: banda tingida com
 * círculo de ícone, título e subtítulo, por cima de um cartão. Cinco vezes
 * seguidas, era isso que dava ao ecrã o ar de montagem. Agora cada grupo tem
 * uma forma própria e o que os une é o mesmo peso tipográfico, não o mesmo
 * invólucro.
 */
function Group({
	title,
	hint,
	children,
}: {
	title: string;
	hint?: string;
	children: React.ReactNode;
}) {
	const { themeColors } = useThemeColors();
	return (
		<Card padded={false} className="mb-4">
			<View className="px-4 pt-4 pb-3">
				<Text
					className="font-sansExtraBold text-label"
					style={{ color: themeColors.text }}
				>
					{title}
				</Text>
				{hint ? (
					<Text
						className="font-sans text-body-xs mt-1"
						style={{ color: themeColors.secondary }}
					>
						{hint}
					</Text>
				) : null}
			</View>
			{children}
		</Card>
	);
}

/** Faixa de estado com uma cor, para os ramos terminais do ecrã. */
function Outcome({
	band,
	icon,
	spinner,
	title,
	subtitle,
	children,
}: {
	band: string;
	icon?: React.ComponentProps<typeof Ionicons>['name'];
	spinner?: boolean;
	title: string;
	subtitle: string;
	children?: React.ReactNode;
}) {
	const { themeColors } = useThemeColors();
	return (
		<Card padded={false}>
			<View
				className="flex-row items-center px-4 py-3"
				style={{ backgroundColor: band }}
			>
				{spinner ? (
					<ActivityIndicator
						color={themeColors.onWarning}
						size="small"
					/>
				) : icon ? (
					<Ionicons
						name={icon}
						size={20}
						color={themeColors.onSuccess}
					/>
				) : null}
				<View className="flex-1 ml-3">
					<Text
						className="font-sansExtraBold text-label"
						style={{ color: themeColors.onSuccess }}
					>
						{title}
					</Text>
					<Text
						className="font-sans text-body-xs mt-0.5"
						style={{
							color: themeColors.onSuccess,
							opacity: 0.9,
						}}
					>
						{subtitle}
					</Text>
				</View>
			</View>
			{children ? <View className="p-4">{children}</View> : null}
		</Card>
	);
}

export default function KycScreen() {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<BoleiaMainStackParamList, 'Kyc'>
		>();
	const { themeColors } = useThemeColors();
	const currentRole = useAppStore((s) => s.currentRole);

	const [mode, setMode] = useState<Mode>(currentRole);
	const [kyc, setKyc] = useState<ApiKycMe | null>(null);
	const [loading, setLoading] = useState(true);

	const [selfies, setSelfies] = useState<string[]>(['', '', '']);
	const [biFront, setBiFront] = useState<string | null>(null);
	const [biBack, setBiBack] = useState<string | null>(null);
	const [licensePhoto, setLicensePhoto] = useState<string | null>(null);
	const [bodyPhoto, setBodyPhoto] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [progress, setProgress] = useState('');
	const [viewing, setViewing] = useState<{
		uri: string;
		label: string;
	} | null>(null);

	useFocusEffect(
		useCallback(() => {
			let alive = true;
			setLoading(true);
			getKycMe()
				.then((me) => {
					if (alive) setKyc(me);
				})
				.catch(() => undefined)
				.finally(() => {
					if (alive) setLoading(false);
				});
			return () => {
				alive = false;
			};
		}, []),
	);

	// Largura real do ecrã para dimensionar os slots de forma explícita (sem
	// aspectRatio nem largura percentual em filhos de flex-row).
	const { width: winW } = useWindowDimensions();
	const [viewW, setViewW] = useState<number | null>(null);
	const layoutW = viewW ?? winW;
	const slot = Math.min(
		140,
		Math.max(84, Math.floor((layoutW - 72 - 16) / 3)),
	);
	const slotPair = Math.min(
		140,
		Math.max(84, Math.floor((layoutW - 72) / 2)),
	);

	const state = mode === 'driver' ? kyc?.driver : kyc?.passenger;
	const status = state?.status ?? 'NOT_SUBMITTED';

	const selfieCount = selfies.filter(Boolean).length;

	/**
	 * O que falta, dito à pessoa.
	 *
	 * Antes o botão de envio ficava cinzento e a causa nunca aparecia: tinha
	 * seis campos e três condições escondidas, e a pessoa não sabia se faltava
	 * uma selfie ou o verso do BI. A lista é a mesma que governa o botão, por
	 * isso não podem divergir.
	 *
	 * Passou a ser **só** documentos: o nome, o número do BI e os dados da
	 * carta deixaram de se escrever à mão. Nada os validava contra o
	 * documento, e a fotografia é a fonte que o revisor usa.
	 */
	const requirements = useMemo(
		() =>
			mode === 'passenger'
				? [
						{
							label: 'BI (frente e verso)',
							done: !!biFront && !!biBack,
						},
						{ label: 'Duas selfies', done: selfieCount >= 2 },
						{ label: 'Foto de corpo inteiro', done: !!bodyPhoto },
					]
				: [
						{
							label: 'BI (frente e verso)',
							done: !!biFront && !!biBack,
						},
						{ label: 'Uma selfie', done: selfieCount >= 1 },
					],
		[mode, biFront, biBack, selfieCount, bodyPhoto],
	);
	const missing = requirements.filter((r) => !r.done);
	const canSubmit = missing.length === 0;

	const pickOne = async (set: (uri: string) => void) => {
		const res = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ['images'],
			quality: 0.6,
		});
		if (!res.canceled) set(res.assets[0].uri);
	};

	/**
	 * Fotos a enviar, com o balde a que pertencem.
	 *
	 * O `mediaIds` do backend não é uma lista plana: são campos com nome
	 * (`biFront`, `biBack`, `selfies[]`, e opcionalmente `license` /
	 * `bodyPhoto`). Por isso cada item da fila carrega o seu destino, e o
	 * resultado é remontado por chave em vez de por posição — assim uma
	 * reordenação da fila nunca embaralha os documentos.
	 */
	const uploadQueue = useMemo(() => {
		const items: UploadItem[] = [];
		if (biFront)
			items.push({ uri: biFront, label: 'BI frente', slot: 'biFront' });
		if (biBack)
			items.push({ uri: biBack, label: 'BI verso', slot: 'biBack' });
		selfies.forEach((uri, i) => {
			if (uri)
				items.push({
					uri,
					label: `Selfie ${i + 1}`,
					slot: 'selfie',
				});
		});
		if (mode === 'passenger' && bodyPhoto) {
			items.push({
				uri: bodyPhoto,
				label: 'Corpo inteiro',
				slot: 'bodyPhoto',
			});
		}
		if (mode === 'driver' && licensePhoto) {
			items.push({
				uri: licensePhoto,
				label: 'Carta de condução',
				slot: 'license',
			});
		}
		return items;
	}, [biFront, biBack, selfies, bodyPhoto, licensePhoto, mode]);

	const submit = async () => {
		if (!canSubmit || submitting) return;
		setSubmitting(true);
		setProgress('A enviar os documentos');
		const ownerType = mode === 'driver' ? 'DRIVER_KYC' : 'PASSENGER_KYC';

		try {
			/*
			 * Lotes de três, não um a um. Seis fotos em fila custavam minutos
			 * numa ligação fraca, e era a razão pela qual as pessoas achavam que
			 * a app tinha ficado presa. Ao mesmo tempo, abrir as seis de uma
			 * vez seria pior: seis uploads de imagem a competir pelo mesmo
			 * enlace é como se garante que metade falha.
			 */
			const collected: Collected = {
				selfies: [],
			};
			let done = 0;
			for (let i = 0; i < uploadQueue.length; i += UPLOAD_CONCURRENCY) {
				const batch = uploadQueue.slice(i, i + UPLOAD_CONCURRENCY);
				const got = await Promise.all(
					batch.map((item) => uploadPhoto(item.uri, ownerType)),
				);
				batch.forEach((item, index) => {
					if (item.slot === 'selfie') {
						collected.selfies.push(got[index]);
						return;
					}
					collected[item.slot] = got[index];
				});
				done += batch.length;
				setProgress(
					`A enviar documentos (${done}/${uploadQueue.length})`,
				);
			}

			const mediaIds: KycMediaIds = {
				biFront: collected.biFront ?? '',
				biBack: collected.biBack ?? '',
				selfies: collected.selfies,
				...(collected.license ? { license: collected.license } : {}),
				...(collected.bodyPhoto
					? { bodyPhoto: collected.bodyPhoto }
					: {}),
			};

			if (mode === 'driver') {
				await submitDriverKyc({ mediaIds });
			} else {
				await submitPassengerKyc({ mediaIds });
			}
			setKyc(await getKycMe());
		} catch (error) {
			Alert.alert(
				'Verificação',
				apiErrorMessage(
					error,
					'Não foi possível enviar. As fotos que já subiram ficam guardadas.',
				),
			);
		} finally {
			setSubmitting(false);
			setProgress('');
		}
	};

	/**
	 * Trocar de modo apaga o formulário inteiro.
	 *
	 * Sem confirmação, quem tocava no alternador por engano perdia seis fotos
	 * sem aviso. Só perguntamos quando há mesmo algo a perder.
	 */
	const switchMode = (next: Mode) => {
		if (next === mode || submitting) return;
		const filled = Boolean(
			biFront ||
			biBack ||
			licensePhoto ||
			bodyPhoto ||
			selfies.some(Boolean),
		);
		const drop = () => {
			setMode(next);
			setSelfies(['', '', '']);
			setBiFront(null);
			setBiBack(null);
			setLicensePhoto(null);
			setBodyPhoto(null);
		};
		if (!filled) {
			drop();
			return;
		}
		Alert.alert(
			'Mudar de modo',
			'As fotos que já escolheste são apagadas. Queres continuar?',
			[
				{ text: 'Ficar aqui', style: 'cancel' },
				{ text: 'Mudar', style: 'destructive', onPress: drop },
			],
		);
	};

	const renderForm = () => (
		<>
			{/*
			 * Espinha do ecrã. Responde à pergunta que o ecrã antigo não
			 * respondia: quanto falta. O rail conta o que está feito; a lista
			 * debaixo diz o que não está, pelo nome.
			 */}
			<Card className="mb-4">
				<ProgressRail
					done={requirements.length - missing.length}
					total={requirements.length}
					unit="requisito"
					unitPlural="requisitos"
				/>
				{missing.length > 0 ? (
					<View className="mt-3">
						{missing.map((r) => (
							<View
								key={r.label}
								className="flex-row items-center mt-1.5"
							>
								<Ionicons
									name="ellipse-outline"
									size={13}
									color={themeColors.secondary}
								/>
								<Text
									className="font-sans text-body-xs ml-2"
									style={{ color: themeColors.secondary }}
								>
									{r.label}
								</Text>
							</View>
						))}
					</View>
				) : null}
			</Card>

			{status === 'REJECTED' ? (
				<Card tone="danger" className="mb-4">
					<Text
						className="font-sansBold text-body-small"
						style={{ color: themeColors.error }}
					>
						Submissão recusada
					</Text>
					<Text
						className="font-sans text-body-xs mt-1"
						style={{ color: themeColors.secondary }}
					>
						{state?.rejectionReason ??
							'Revê os documentos e volta a submeter.'}
					</Text>
				</Card>
			) : null}

			{/* Identidade: só o documento, sem campos escritos à mão. */}
			<Group
				title="Identidade"
				hint="A fotografia do BI é o que o revisor confere."
			>
				<View
					className="flex-row px-4 pt-1 pb-4"
					style={{ justifyContent: 'space-between' }}
				>
					<PhotoSlot
						uri={biFront}
						label="Frente"
						size={slotPair}
						onView={() =>
							setViewing({
								uri: biFront ?? '',
								label: 'BI · Frente',
							})
						}
						onPick={() => pickOne(setBiFront)}
						onRemove={() => setBiFront(null)}
					/>
					<PhotoSlot
						uri={biBack}
						label="Verso"
						size={slotPair}
						onView={() =>
							setViewing({
								uri: biBack ?? '',
								label: 'BI · Verso',
							})
						}
						onPick={() => pickOne(setBiBack)}
						onRemove={() => setBiBack(null)}
					/>
				</View>
			</Group>

			{/* Rosto: só fotografias, centradas. */}
			<Group
				title="Rosto"
				hint={
					mode === 'passenger'
						? 'Duas selfies e uma foto de corpo inteiro'
						: 'Uma selfie, de frente, com o rosto descoberta'
				}
			>
				<View className="px-4 flex-row flex-wrap" style={{ gap: 8 }}>
					{selfies.map((uri, i) => (
						<PhotoSlot
							key={`selfie-${i}`}
							uri={uri}
							label={`Selfie ${i + 1}`}
							size={slot}
							onView={() =>
								setViewing({ uri, label: `Selfie ${i + 1}` })
							}
							onPick={() =>
								pickOne((u) =>
									setSelfies((prev) =>
										prev.map((p, j) => (j === i ? u : p)),
									),
								)
							}
							onRemove={() =>
								setSelfies((prev) =>
									prev.map((p, j) => (j === i ? '' : p)),
								)
							}
						/>
					))}
				</View>
				{mode === 'passenger' ? (
					<View className="px-4 pt-4 pb-4">
						<PhotoSlot
							uri={bodyPhoto}
							label="Corpo inteiro"
							size={slotPair}
							onView={() =>
								setViewing({
									uri: bodyPhoto ?? '',
									label: 'Corpo inteiro',
								})
							}
							onPick={() => pickOne(setBodyPhoto)}
							onRemove={() => setBodyPhoto(null)}
						/>
					</View>
				) : null}
			</Group>

			{/* Condução: só no papel de motorista, e com outro registo. */}
			{mode === 'driver' ? (
				<Group
					title="Carta de condução"
					hint="Só para publicar viagens"
				>
					<View className="px-4 pt-1 pb-4">
						<PhotoSlot
							uri={licensePhoto}
							label="Carta"
							size={slotPair}
							onView={() =>
								setViewing({
									uri: licensePhoto ?? '',
									label: 'Carta de condução',
								})
							}
							onPick={() => pickOne(setLicensePhoto)}
							onRemove={() => setLicensePhoto(null)}
						/>
					</View>
				</Group>
			) : null}
		</>
	);

	const renderBody = () => {
		if (loading) {
			return (
				<View className="items-center py-10">
					<ActivityIndicator color={themeColors.primary} />
				</View>
			);
		}
		if (status === 'VERIFIED') {
			return (
				<Outcome
					band={themeColors.success}
					icon="checkmark"
					title="Identidade verificada"
					subtitle={
						mode === 'driver'
							? 'Motorista aprovado'
							: 'Passageiro aprovado'
					}
				>
					<Text
						className="font-sans text-body-small"
						style={{ color: themeColors.secondary }}
					>
						{mode === 'driver'
							? 'A tua identidade de motorista está confirmada. Falta registar a viatura.'
							: 'A tua identidade está confirmada. Já podes pedir boleias.'}
					</Text>
					{mode === 'driver' ? (
						<View className="mt-4">
							<BoleiaButton
								title="Registar viatura"
								onPress={() => navigation.navigate('Vehicle')}
								strong
							/>
						</View>
					) : null}
				</Outcome>
			);
		}
		if (status === 'PENDING') {
			return (
				<Outcome
					band={themeColors.laterite}
					spinner
					title="A verificar"
					subtitle="Processo em análise"
				>
					<Text
						className="font-sans text-body-small"
						style={{ color: themeColors.secondary }}
					>
						Estamos a confirmar os teus documentos. Avisamos quando
						estiver pronto.
					</Text>
				</Outcome>
			);
		}
		return renderForm();
	};

	const isForm = !loading && status !== 'VERIFIED' && status !== 'PENDING';

	return (
		<SafeAreaView
			className="flex-1 px-5"
			style={{ backgroundColor: themeColors.background }}
			onLayout={(e: LayoutChangeEvent) =>
				setViewW(e.nativeEvent.layout.width)
			}
		>
			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingBottom: isForm ? 24 : 40 }}
				showsVerticalScrollIndicator={false}
			>
				<View className="flex-row items-center pt-1 pb-4">
					<BackButton onPress={() => navigation.goBack()} />
					<Text
						className="font-sansExtraBold text-title-tertiary flex-1 ml-3"
						style={{ color: themeColors.text }}
					>
						Verificar identidade
					</Text>
				</View>

				<SegmentedControl
					className="mb-5"
					options={[
						{ value: 'passenger' as const, label: 'Passageiro' },
						{ value: 'driver' as const, label: 'Motorista' },
					]}
					value={mode}
					onChange={switchMode}
					accessibilityLabel="Tipo de verificação"
				/>

				{renderBody()}
			</ScrollView>

			{isForm ? (
				<StickyCta>
					{progress ? (
						<Text
							className="font-sans text-body-xs mb-3 text-center"
							style={{ color: themeColors.onPrimary }}
						>
							{progress}
						</Text>
					) : null}
					<BoleiaButton
						title="Enviar para verificação"
						onPress={submit}
						loading={submitting}
						disabled={!canSubmit}
						strong
					/>
				</StickyCta>
			) : null}

			<PhotoLightbox
				uri={viewing?.uri ?? null}
				label={viewing?.label}
				onClose={() => setViewing(null)}
			/>
		</SafeAreaView>
	);
}
