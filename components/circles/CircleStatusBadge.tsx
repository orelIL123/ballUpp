import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import type { CircleStatus } from '@/types/models';

type CircleStatusBadgeProps = {
  status: CircleStatus;
};

const LABELS: Record<CircleStatus, string> = {
  open: 'פתוח',
  full: 'מלא',
  closed: 'סגור',
  completed: 'הושלם',
};

const COLORS: Record<CircleStatus, string> = {
  open: '#DEFFF0',
  full: '#FFF1C5',
  closed: '#F9E0D8',
  completed: '#E2EDFF',
};

const ICONS: Record<CircleStatus, 'lock.open.fill' | 'person.3.fill' | 'lock.fill' | 'checkmark.circle.fill'> = {
  open: 'lock.open.fill',
  full: 'person.3.fill',
  closed: 'lock.fill',
  completed: 'checkmark.circle.fill',
};

export function CircleStatusBadge({ status }: CircleStatusBadgeProps) {
  const isClosedOrCompleted = status === 'closed' || status === 'completed';
  return (
    <View style={[styles.badge, { backgroundColor: COLORS[status] }, isClosedOrCompleted && styles.closedBadge]}>
      <SymbolView name={ICONS[status]} size={14} tintColor={theme.colors.deep} />
      <Text style={styles.text}>{LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FFFFFFAA',
  },
  closedBadge: {
    borderWidth: 2,
    borderColor: '#D4A574',
  },
  text: {
    fontWeight: '800',
    color: theme.colors.deep,
    writingDirection: 'rtl',
  },
});
