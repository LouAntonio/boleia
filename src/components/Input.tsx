import React, { useState, useMemo } from 'react';
import {
	View,
	TextInput,
	TextInputProps,
	TouchableOpacity,
	Text,
	StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';

interface InputProps extends TextInputProps {
	label?: string;
	error?: string;
	isPassword?: boolean;
	leftIcon?: keyof typeof Ionicons.glyphMap;
	containerStyle?: any;
}

export default function Input({
	label,
	error,
	isPassword,
	leftIcon,
	containerStyle,
	...props
}: InputProps) {
	const { themeColors, isDark } = useThemeColors();
	const [hidden, setHidden] = useState(isPassword);
	const [isFocused, setIsFocused] = useState(false);

	const containerDynamicStyle = useMemo(
		() => ({
			borderColor: error
				? themeColors.error
				: isFocused
					? themeColors.primary
					: themeColors.border,
			borderWidth: error || isFocused ? 1.5 : 1,
			backgroundColor: themeColors.card,
		}),
		[error, isFocused, themeColors],
	);

	const textInputStyle = useMemo(
		() => ({ color: themeColors.text }),
		[themeColors.text],
	);

	const errorTextStyle = useMemo(
		() => ({ color: themeColors.error }),
		[themeColors.error],
	);

	return (
		<View className="w-full mb-6">
			{label && (
				<Text
					className="font-sansMedium text-label-small mb-2"
					style={{ color: themeColors.text }}
				>
					{label}
				</Text>
			)}
			<View
				className="flex-row items-center rounded-xl overflow-hidden px-4"
				style={[
					styles.inputContainer,
					containerDynamicStyle,
					// eslint-disable-next-line react-native/no-inline-styles
					props.multiline && {
						height: undefined,
						minHeight: 120,
						alignItems: 'flex-start',
						paddingTop: 12,
					},
					containerStyle,
				]}
			>
				{leftIcon && (
					<Ionicons
						name={leftIcon}
						size={22}
						color={
							isFocused
								? themeColors.primary
								: isDark
									? '#888'
									: '#666'
						}
						style={[
							styles.leftIcon,
							// eslint-disable-next-line react-native/no-inline-styles
							props.multiline && { marginTop: 4 },
						]}
					/>
				)}
				<TextInput
					className="flex-1 font-sans text-body"
					style={[
						textInputStyle,
						// eslint-disable-next-line react-native/no-inline-styles
						{ height: props.multiline ? 'auto' : 56 },
					]}
					placeholderTextColor={themeColors.secondary}
					secureTextEntry={hidden}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
					textAlignVertical={props.multiline ? 'top' : 'center'}
					{...props}
				/>
				{isPassword && (
					<TouchableOpacity
						onPress={() => setHidden(!hidden)}
						className="p-2"
						activeOpacity={0.6}
					>
						<Ionicons
							name={hidden ? 'eye-off' : 'eye'}
							size={20}
							color={
								isFocused
									? themeColors.primary
									: themeColors.secondary
							}
						/>
					</TouchableOpacity>
				)}
			</View>
			{error ? (
				<Text
					className="text-body-xs mt-1.5 ml-2 font-sans"
					style={errorTextStyle}
				>
					{error}
				</Text>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	inputContainer: {
		height: 56,
	},
	leftIcon: {
		marginRight: 12,
	},
});
