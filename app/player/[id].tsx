import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

import { theme } from '@/constants/theme';
import { LevelBadge } from '@/components/player/LevelBadge';
import { Avatar } from '@/components/ui/Avatar';
import { ScreenScroll, ScreenView } from '@/components/ui/Screen';
import { getPlayerProfile } from '@/services/players.service';
import type { UserProfile } from '@/types/models';

export default function PlayerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [player, setPlayer] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    getPlayerProfile(id).then(setPlayer);
  }, [id]);

  const playerVideo = useVideoPlayer(player?.videoURL ?? null, (videoPlayer) => {
    videoPlayer.loop = false;
  });

  if (!player) {
    return (
      <ScreenView style={styles.empty}>
        <Text style={styles.emptyText}>טוען פרופיל שחקן...</Text>
      </ScreenView>
    );
  }

  return (
    <ScreenScroll contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Avatar uri={player.photoURL} name={player.displayName} size={92} />
        <Text style={styles.name}>{player.displayName}</Text>
        <Text style={styles.meta}>{player.city}</Text>
        <LevelBadge level={player.level} />
        <View style={styles.statsRow}>
          <Text style={styles.stat}>הצטרף ל-{player.stats.circlesJoined} מעגלים</Text>
          <Text style={styles.stat}>דירוג קהילה {player.stats.rating.toFixed(1)}</Text>
          <Text style={styles.stat}>אי הגעה {player.stats.noShows}</Text>
        </View>
        {player.videoURL ? (
          <VideoView style={styles.video} player={playerVideo} nativeControls />
        ) : (
          <Text style={styles.helper}>אין וידאו בפרופיל כרגע.</Text>
        )}
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
  },
  card: {
    gap: 14,
    alignItems: 'center',
    padding: 24,
    borderRadius: 32,
    backgroundColor: '#FFF9F0',
    borderWidth: 1,
    borderColor: theme.colors.line,
    ...theme.shadow.card,
  },
  name: {
    fontSize: 28,
    fontWeight: '900',
    writingDirection: 'rtl',
    color: theme.colors.deep,
  },
  meta: {
    color: theme.colors.muted,
    writingDirection: 'rtl',
  },
  statsRow: {
    width: '100%',
    gap: 8,
  },
  stat: {
    textAlign: 'right',
    writingDirection: 'rtl',
    color: theme.colors.text,
  },
  video: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  helper: {
    color: theme.colors.muted,
    writingDirection: 'rtl',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    writingDirection: 'rtl',
    color: theme.colors.deep,
  },
});
