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

	const labelStyle = useMemo(
		() => ({
			color: isFocused ? themeColors.primary : themeColors.text,
		}),
		[isFocused, themeColors],
	);

	const containerDynamicStyle = useMemo(
		() => ({
			borderColor: error
				? themeColors.error
				: isFocused
					? themeColors.primary
					: themeColors.border,
			backgroundColor: isDark
				? isFocused
					? '#1A1A1A'
					: '#121212'
				: isFocused
					? '#FFFFFF'
					: '#F5F5F5',
			shadowColor: isFocused ? themeColors.primary : 'transparent',
			elevation: isFocused ? 2 : 0,
		}),
		[error, isFocused, isDark, themeColors],
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
		<View className="w-full mb-5">
			{label && (
				<Text
					className="text-sm font-bold mb-2 ml-1"
					style={[
						labelStyle,
						styles.labelOpacity,
						isFocused && styles.fullOpacity,
					]}
				>
					{label}
				</Text>
			)}
			<View
				className="flex-row items-center border-2 rounded-2xl overflow-hidden px-4"
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
					className="flex-1 text-base"
					style={[
						textInputStyle,
						// eslint-disable-next-line react-native/no-inline-styles
						{ height: props.multiline ? 'auto' : 58 },
					]}
					placeholderTextColor={isDark ? '#666' : '#999'}
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
					className="text-xs mt-1.5 ml-2 font-medium"
					style={errorTextStyle}
				>
					{error}
				</Text>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	labelOpacity: {
		opacity: 0.8,
	},
	fullOpacity: {
		opacity: 1,
	},
	inputContainer: {
		height: 58,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
	},
	leftIcon: {
		marginRight: 12,
	},
});
