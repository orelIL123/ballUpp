import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { LevelBadge } from '@/components/player/LevelBadge';
import { Avatar } from '@/components/ui/Avatar';
import type { UserProfile } from '@/types/models';

type PlayerCardProps = {
  player: UserProfile;
  onPress?: () => void;
};

export function PlayerCard({ player, onPress }: PlayerCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Avatar uri={player.photoURL} name={player.displayName} />
      <View style={styles.content}>
        <Text style={styles.name}>{player.displayName}</Text>
        <Text style={styles.meta}>{player.city}</Text>
        <View style={styles.row}>
          <LevelBadge level={player.level} />
          <Text style={styles.meta}>דירוג {player.stats.rating.toFixed(1)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row-reverse',
    gap: 12,
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#FFF9F0',
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
  },
  content: {
    flex: 1,
    gap: 6,
    alignItems: 'flex-end',
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    writingDirection: 'rtl',
  },
  meta: {
    color: theme.colors.muted,
    writingDirection: 'rtl',
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
});
