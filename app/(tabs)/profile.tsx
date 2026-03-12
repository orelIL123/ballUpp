import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { LevelBadge } from '@/components/player/LevelBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ScreenView } from '@/components/ui/Screen';
import { useAuthStore } from '@/stores/auth.store';
import { goBackOrReplace } from '@/utils/navigation';

export default function ProfileScreen() {
  const profile = useAuthStore((state) => state.profile);

  if (!profile) {
    return (
      <ScreenView style={styles.empty}>
        <Text style={styles.emptyText}>אין פרופיל להצגה.</Text>
      </ScreenView>
    );
  }

  const attendance =
    profile.stats.circlesJoined > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              ((profile.stats.circlesJoined - profile.stats.noShows) / profile.stats.circlesJoined) * 100,
            ),
          ),
        )
      : 100;
  const mentalScore = Math.max(0, Math.min(100, Math.round((profile.stats.rating / 5) * 100)));

  return (
    <LinearGradient colors={['#7D90B1', '#8BB0C7', '#DFA47D', '#56758A']} style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => goBackOrReplace('/(tabs)')} style={styles.iconButton}>
            <SymbolView name="chevron.left" size={22} tintColor={theme.colors.white} />
          </Pressable>
          <Text style={styles.title}>פרופיל שחקן</Text>
          <Pressable onPress={() => router.push('/(tabs)/settings')} style={styles.iconButton}>
            <SymbolView name="gearshape.fill" size={20} tintColor={theme.colors.white} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.avatarRing}>
            <Avatar uri={profile.photoURL} name={profile.displayName} size={122} />
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>פרו</Text>
            </View>
          </View>
          <Text style={styles.name}>{profile.displayName}</Text>
          <View style={styles.levelWrap}>
            <LevelBadge level={profile.level} />
          </View>
        </View>

        <BlurView intensity={45} tint="light" style={styles.card}>
          <View style={styles.metricsRow}>
            <MetricRing value={`${profile.stats.circlesJoined}`} label="משחקים שוחקו" color="#63B7FF" />
            <MetricRing value={`${attendance}%`} label="שיעור נוכחות" color="#69D777" />
            <MetricRing value={`${mentalScore}%`} label="ציון מנטלי" color="#FF8E7C" />
          </View>
        </BlurView>

        <BlurView intensity={42} tint="light" style={styles.card}>
          <Text style={styles.sectionTitle}>גלריה</Text>
          <View style={styles.galleryRow}>
            {[1, 2, 3, 4].map((item) => (
              <LinearGradient
                key={item}
                colors={['#8FBDD9', '#78A0C0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.galleryItem}
              >
                <View style={styles.playWrap}>
                  <SymbolView name="play.fill" size={14} tintColor={theme.colors.white} />
                </View>
              </LinearGradient>
            ))}
          </View>
        </BlurView>

        <View style={styles.actions}>
          <Button title="עריכת פרופיל" variant="secondary" onPress={() => router.push('/onboarding')} />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function MetricRing({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={styles.metricWrap}>
      <View style={styles.metricTrack}>
        <View style={[styles.metricRing, { borderColor: color }]}>
          <Text style={styles.metricValue}>{value}</Text>
        </View>
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 30,
    gap: 14,
  },
  topBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FFFFFF8F',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF24',
  },
  title: {
    color: theme.colors.white,
    fontSize: 25,
    fontWeight: '900',
    writingDirection: 'rtl',
    textShadowColor: '#0000004D',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    marginBottom: 2,
  },
  avatarRing: {
    position: 'relative',
    padding: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FFFFFFA8',
    backgroundColor: '#FFFFFF1D',
  },
  proBadge: {
    position: 'absolute',
    right: -8,
    bottom: 2,
    width: 52,
    height: 52,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#C89A36',
    backgroundColor: '#F4C95D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proBadgeText: {
    color: '#6A4408',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  name: {
    color: theme.colors.white,
    fontSize: 44,
    fontWeight: '900',
    writingDirection: 'rtl',
    textShadowColor: '#00000055',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 7,
  },
  levelWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FFFFFF80',
    padding: 14,
    overflow: 'hidden',
  },
  metricsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    justifyContent: 'space-between',
  },
  metricWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  metricTrack: {
    width: 92,
    height: 92,
    borderRadius: 999,
    borderWidth: 7,
    borderColor: '#FFFFFF3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricRing: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00000012',
  },
  metricValue: {
    color: theme.colors.white,
    fontSize: 23,
    fontWeight: '900',
    textAlign: 'center',
    width: '100%',
    includeFontPadding: false,
  },
  metricLabel: {
    color: '#F4F4F4',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  sectionTitle: {
    color: theme.colors.white,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 10,
    textShadowColor: '#0000004D',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  matchesList: {
    gap: 8,
  },
  matchRow: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFFFFF86',
    backgroundColor: '#00000019',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  matchText: {
    color: '#F4F4F4',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  galleryRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  galleryItem: {
    flex: 1,
    height: 90,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFFFFF95',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  playWrap: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#FFFFFFC4',
    backgroundColor: '#00000036',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  actions: {
    gap: 10,
    paddingBottom: 110,
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
