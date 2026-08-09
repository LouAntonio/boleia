import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface MenuItemInfo {
	id: string;
	label: string;
	icon: string;
	iconSolid?: string;
	danger?: boolean;
}

interface MenuRowProps {
	item: MenuItemInfo;
	isActive?: boolean;
	isDarkIconBg?: boolean;
	showSwitch?: boolean;
	switchValue?: boolean;
	onSwitchChange?: (val: boolean) => void;
	onPress?: () => void;
	hasBorder?: boolean;
}

export function MenuRow({
	item,
	isActive,
	isDarkIconBg,
	showSwitch,
	switchValue,
	onSwitchChange,
	onPress,
	hasBorder = true,
}: MenuRowProps) {
	const iconName = (
		isActive && item.iconSolid ? item.iconSolid : item.icon
	) as any;

	let iconBgColor = '#F4F4F4'; // light theme default
	if (isDarkIconBg) iconBgColor = '#333333';
	if (item.danger) iconBgColor = '#FFEBEE';
	if (showSwitch) iconBgColor = '#FFF9E0';

	let iconColor = '#6B7280'; // gray-500
	if (item.danger) iconColor = '#ED1C24';
	if (showSwitch) iconColor = '#FFD700';

	return (
		<TouchableOpacity
			className={`flex-row items-center justify-between py-4 ${hasBorder ? 'border-b border-gray-200 dark:border-gray-800' : ''}`}
			activeOpacity={showSwitch ? 1 : 0.7}
			onPress={!showSwitch ? onPress : undefined}
		>
			<View className="flex-row items-center">
				<View
					className="w-8 h-8 rounded-full items-center justify-center mr-3"
					style={{ backgroundColor: iconBgColor }}
				>
					<Ionicons name={iconName} size={18} color={iconColor} />
				</View>
				<Text
					className={`text-base font-medium ${item.danger ? 'text-red-500' : 'text-secondary dark:text-off-white'}`}
				>
					{item.label}
				</Text>
			</View>

			{showSwitch ? (
				<Switch
					value={switchValue}
					onValueChange={onSwitchChange}
					trackColor={{ false: '#D1D3D4', true: '#10B981' }}
					thumbColor="#FFFFFF"
				/>
			) : (
				<Ionicons
					name="chevron-forward"
					size={20}
					color={item.danger ? '#ED1C24' : '#6B7280'}
				/>
			)}
		</TouchableOpacity>
	);
}
