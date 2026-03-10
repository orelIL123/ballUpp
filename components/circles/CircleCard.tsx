import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { CircleStatusBadge } from '@/components/circles/CircleStatusBadge';
import { LevelBadge } from '@/components/player/LevelBadge';
import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';
import type { Circle } from '@/types/models';
import { formatTimestamp } from '@/utils/date';

type CircleCardProps = {
  circle: Circle;
  onPress: () => void;
  onJoin?: () => void;
  joining?: boolean;
  canJoin?: boolean;
  compact?: boolean;
};

export function CircleCard({ circle, onPress, onJoin, joining, canJoin = true, compact = false }: CircleCardProps) {
  const isClosed = circle.status === 'closed' || circle.status === 'completed';
  const canRenderJoin = Boolean(onJoin) && !compact;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact && styles.cardCompact,
        pressed && styles.cardPressed,
        isClosed && styles.cardClosed,
      ]}
    >
      <View style={[styles.accentBar, isClosed && styles.accentBarClosed]} />
      <View style={styles.topRow}>
        <CircleStatusBadge status={circle.status} />
        <LevelBadge level={circle.requiredLevel} />
      </View>
      {circle.isUrgent ? (
        <View style={styles.urgentRow}>
          <Text style={styles.urgentText}>דחוף</Text>
        </View>
      ) : null}
      <Text numberOfLines={compact ? 2 : undefined} style={[styles.title, compact && styles.titleCompact]}>
        {circle.title}
      </Text>
      <Text numberOfLines={1} style={[styles.meta, compact && styles.metaCompact]}>
        {circle.location.name}
      </Text>
      <Text numberOfLines={compact ? 1 : undefined} style={[styles.meta, compact && styles.metaCompact]}>
        {circle.city || 'ללא עיר'} · {circle.courtType === 'beach' ? 'חוף' : circle.courtType === 'asphalt' ? 'אספלט' : 'דשא'}
        {(circle.genderRestriction ?? 'any') !== 'any' && ` · ${circle.genderRestriction === 'female' ? 'בנות בלבד' : 'בנים בלבד'}`}
      </Text>
      <Text numberOfLines={1} style={[styles.meta, compact && styles.metaCompact]}>
        {formatTimestamp(circle.dateTime)}
      </Text>
      <Text style={[styles.meta, compact && styles.metaCompact]}>
        {circle.players.length}/{circle.maxPlayers} שחקנים
      </Text>
      {circle.isUrgent && circle.creatorName ? (
        <View style={styles.creatorRow}>
          <View style={styles.creatorTextWrap}>
            <Text style={styles.creatorLabel}>נפתח על ידי</Text>
            <Text style={styles.creatorName}>{circle.creatorName}</Text>
          </View>
          <Avatar uri={circle.creatorPhotoURL} name={circle.creatorName} size={compact ? 30 : 38} />
        </View>
      ) : null}
      {canRenderJoin ? (
        <Button
          title="הצטרף"
          loading={joining}
          onPress={onJoin!}
          disabled={!canJoin || circle.status !== 'open'}
          style={styles.joinButton}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    padding: 18,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: '#FFF9F0',
    overflow: 'hidden',
    ...theme.shadow.card,
  },
  cardCompact: {
    flex: 1,
    aspectRatio: 1,
    gap: 6,
    padding: 12,
    borderRadius: 20,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
  },
  cardClosed: {
    opacity: 0.92,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 7,
    backgroundColor: theme.colors.coral,
  },
  accentBarClosed: {
    backgroundColor: '#9B9B9B',
  },
  topRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  urgentRow: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FFE4D2',
  },
  urgentText: {
    color: '#D95B12',
    fontSize: 12,
    fontWeight: '900',
    writingDirection: 'rtl',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  titleCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  meta: {
    color: theme.colors.muted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  metaCompact: {
    fontSize: 12,
  },
  creatorRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  creatorTextWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  creatorLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    writingDirection: 'rtl',
  },
  creatorName: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 13,
    writingDirection: 'rtl',
  },
  joinButton: {
    marginTop: 8,
  },
});
