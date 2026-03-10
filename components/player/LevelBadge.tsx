import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import type { CircleRequiredLevel, PlayerLevel } from '@/types/models';

type LevelBadgeProps = {
  level: PlayerLevel | CircleRequiredLevel;
};

const LABELS: Record<LevelBadgeProps['level'], string> = {
  any: 'כל הרמות',
  beginner: 'מתחיל',
  intermediate: 'בינוני',
  expert: 'מתקדם',
};

const COLORS: Record<LevelBadgeProps['level'], string> = {
  any: '#E8FFF6',
  beginner: '#E3F7FF',
  intermediate: '#FFF2C8',
  expert: '#FFE3DA',
};

export function LevelBadge({ level }: LevelBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: COLORS[level] }]}>
      <Text style={styles.text}>{LABELS[level]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFFFFFAA',
  },
  text: {
    color: theme.colors.deep,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
});
