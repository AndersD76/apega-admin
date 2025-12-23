import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenHeaderProps {
  title: string;
  onBack: () => void;
  rightIcon?: string;
  onRightPress?: () => void;
}

export default function ScreenHeader({ title, onBack, rightIcon, onRightPress }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      {rightIcon && onRightPress ? (
        <TouchableOpacity style={styles.rightBtn} onPress={onRightPress}>
          <Ionicons name={rightIcon as any} size={22} color="#666" />
        </TouchableOpacity>
      ) : (
        <View style={styles.rightBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  rightBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
});
