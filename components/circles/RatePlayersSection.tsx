import { SymbolView } from 'expo-symbols';
import { useState, useEffect } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { theme } from '@/constants/theme';
import { getMyRatingsForCircle, submitRating } from '@/services/ratings.service';
import type { UserProfile } from '@/types/models';

type RatePlayersSectionProps = {
  circleId: string;
  players: UserProfile[];
  currentUserId: string;
};

const STARS = [1, 2, 3, 4, 5];

export function RatePlayersSection({ circleId, players, currentUserId }: RatePlayersSectionProps) {
  const [myRatings, setMyRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const others = players.filter((p) => p.uid !== currentUserId);

  useEffect(() => {
    getMyRatingsForCircle(circleId, currentUserId)
      .then(setMyRatings)
      .catch(() => setMyRatings({}))
      .finally(() => setLoading(false));
  }, [circleId, currentUserId]);

  const handleRate = async (ratedId: string, score: number) => {
    setSubmitting(ratedId);
    try {
      await submitRating(circleId, currentUserId, ratedId, score);
      setMyRatings((prev) => ({ ...prev, [ratedId]: score }));
    } catch (error) {
      Alert.alert('דירוג נכשל', error instanceof Error ? error.message : 'נסה שוב בעוד רגע.');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading || others.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>דרג את החברים במעגל</Text>
      <Text style={styles.sectionSubtitle}>עזור לקהילה להכיר שחקנים אמינים</Text>
      <View style={styles.list}>
        {others.map((player) => (
          <View key={player.uid} style={styles.row}>
            <Avatar uri={player.photoURL} name={player.displayName} size={40} />
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{player.displayName}</Text>
              <View style={styles.starsRow}>
                {submitting === player.uid ? (
                  <ActivityIndicator size="small" color={theme.colors.coral} />
                ) : (
                  STARS.map((star) => (
                    <Pressable
                      key={star}
                      onPress={() => handleRate(player.uid, star)}
                      style={styles.starButton}
                    >
                      <SymbolView
                        name={star <= (myRatings[player.uid] ?? 0) ? 'star.fill' : 'star'}
                        size={24}
                        tintColor={star <= (myRatings[player.uid] ?? 0) ? '#F4C95D' : theme.colors.muted}
                      />
                    </Pressable>
                  ))
                )}
              </View>
            </View>
            {myRatings[player.uid] ? (
              <Text style={styles.ratedBadge}>דורג {myRatings[player.uid]}/5</Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'right',
    writingDirection: 'rtl',
    color: theme.colors.deep,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  list: {
    gap: 12,
    padding: 18,
    borderRadius: 28,
    backgroundColor: '#FFF9F0',
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  playerInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    writingDirection: 'rtl',
  },
  starsRow: {
    flexDirection: 'row-reverse',
    gap: 4,
    marginTop: 4,
  },
  starButton: {
    padding: 4,
  },
  ratedBadge: {
    fontSize: 12,
    color: theme.colors.muted,
    writingDirection: 'rtl',
  },
});
