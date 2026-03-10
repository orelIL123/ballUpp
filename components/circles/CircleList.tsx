import { FlatList, StyleSheet, Text, View } from 'react-native';

import { CircleCard } from '@/components/circles/CircleCard';
import { theme } from '@/constants/theme';
import type { Circle } from '@/types/models';

type CircleListProps = {
  circles: Circle[];
  onOpen: (circle: Circle) => void;
  onJoin?: (circle: Circle) => void;
  joiningCircleId?: string | null;
  currentUserId?: string;
};

export function CircleList({ circles, onOpen, onJoin, joiningCircleId, currentUserId }: CircleListProps) {
  return (
    <FlatList
      data={circles}
      keyExtractor={(item) => item.id}
      contentContainerStyle={circles.length === 0 ? styles.emptyContainer : styles.list}
      renderItem={({ item }) => (
        <CircleCard
          circle={item}
          onPress={() => onOpen(item)}
          onJoin={onJoin ? () => onJoin(item) : undefined}
          joining={joiningCircleId === item.id}
          canJoin={!item.players.includes(currentUserId ?? '')}
        />
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>אין כרגע מעגלים פתוחים</Text>
          <Text style={styles.emptyBody}>אפשר ליצור מעגל חדש ולמשוך שחקנים אחרים.</Text>
        </View>
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 14,
    paddingBottom: 24,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  empty: {
    padding: 24,
    borderRadius: 28,
    backgroundColor: '#FFF9F0',
    borderWidth: 1,
    borderColor: theme.colors.line,
    gap: 8,
    ...theme.shadow.card,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    writingDirection: 'rtl',
    color: theme.colors.text,
  },
  emptyBody: {
    textAlign: 'center',
    color: theme.colors.muted,
    writingDirection: 'rtl',
  },
});
