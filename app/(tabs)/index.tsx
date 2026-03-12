import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';

import { CircleListGrouped } from '@/components/circles/CircleListGrouped';
import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';
import { subscribeToHomeBulletins, type HomeBulletin } from '@/services/bulletins.service';
import { logout } from '@/services/auth.service';
import { joinCircle } from '@/services/circles.service';
import { useAuthStore } from '@/stores/auth.store';
import { useCirclesStore } from '@/stores/circles.store';
import type { Circle, CircleRequiredLevel } from '@/types/models';
import { isSameDay } from '@/utils/date';

type DateFilter = 'all' | 'today' | 'week';

const LEVEL_FILTERS: CircleRequiredLevel[] = ['any', 'beginner', 'intermediate', 'expert'];

const HOME_BG = {
  uri: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1400&q=80',
};

const logoSource = require('@/assets/images/logo.png');

export default function HomeScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const logoSize = Math.min(160, Math.max(100, windowWidth * 0.36));
  const profile = useAuthStore((state) => state.profile);
  const isGuest = useAuthStore((state) => state.isGuest);
  const logoutLocal = useAuthStore((state) => state.logoutLocal);
  const circles = useCirclesStore((state) => state.circles);
  const loading = useCirclesStore((state) => state.loading);
  const error = useCirclesStore((state) => state.error);
  const startListening = useCirclesStore((state) => state.startListening);
  const stopListening = useCirclesStore((state) => state.stopListening);

  const [levelFilter, setLevelFilter] = useState<CircleRequiredLevel>('any');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [joiningCircleId, setJoiningCircleId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bulletinSectionY, setBulletinSectionY] = useState(0);
  const [bulletins, setBulletins] = useState<HomeBulletin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [areaFilter, setAreaFilter] = useState<string>('all');

  const drawerProgress = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const currentUserId = profile?.uid ?? null;

  useEffect(() => {
    startListening();
    return stopListening;
  }, [startListening, stopListening]);

  useEffect(() => {
    Animated.timing(drawerProgress, {
      toValue: menuOpen ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [drawerProgress, menuOpen]);

  useEffect(() => {
    const unsubscribe = subscribeToHomeBulletins(
      (nextBulletins) => setBulletins(nextBulletins.filter((item) => item.active)),
      () => setBulletins([]),
    );

    return unsubscribe;
  }, []);

  const filteredCircles = useMemo(() => {
    const now = new Date();
    const weekAhead = new Date(now);
    weekAhead.setDate(now.getDate() + 7);
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return circles.filter((circle) => {
      const matchesLevel =
        levelFilter === 'any' ? true : circle.requiredLevel === 'any' || circle.requiredLevel === levelFilter;
      const circleDate = circle.dateTime.toDate();
      const matchesDate =
        dateFilter === 'all'
          ? true
          : dateFilter === 'today'
            ? isSameDay(circle.dateTime, now)
            : circleDate >= now && circleDate <= weekAhead;
      const matchesUrgent = urgentOnly ? Boolean(circle.isUrgent) : true;
      const matchesArea = areaFilter === 'all' ? true : circle.area === areaFilter;
      const haystack = [
        circle.title,
        circle.city,
        circle.area,
        circle.location.name,
        circle.creatorName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesSearch = normalizedSearch.length === 0 ? true : haystack.includes(normalizedSearch);

      return matchesLevel && matchesDate && matchesUrgent && matchesArea && matchesSearch;
    });
  }, [areaFilter, circles, dateFilter, levelFilter, searchTerm, urgentOnly]);

  const areaOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        circles
          .map((circle) => circle.area?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    );

    return values.slice(0, 8);
  }, [circles]);

  const nearbyCircles = useMemo(() => {
    const userCity = profile?.location?.city || profile?.city;
    const userArea = profile?.location?.area;

    return circles.filter((circle) => {
      const sameCity = Boolean(userCity) && circle.city === userCity;
      const sameArea = Boolean(userArea) && circle.area === userArea;
      return sameArea || sameCity;
    });
  }, [circles, profile?.city, profile?.location?.area, profile?.location?.city]);

  const handleJoin = async (circle: Circle) => {
    if (!currentUserId) {
      return;
    }

    setJoiningCircleId(circle.id);
    try {
      await joinCircle(circle.id, currentUserId);
      Alert.alert('הצטרפת למעגל', 'המעגל עודכן בזמן אמת.');
    } catch (joinError) {
      Alert.alert('לא הצלחנו לצרף אותך', joinError instanceof Error ? joinError.message : 'נסה שוב בעוד רגע.');
    } finally {
      setJoiningCircleId(null);
    }
  };

  const handleLogout = async () => {
    try {
      if (isGuest) {
        logoutLocal();
      } else {
        await logout();
      }
      setMenuOpen(false);
      router.replace('/(auth)/login');
    } catch (logoutError) {
      Alert.alert('התנתקות נכשלה', logoutError instanceof Error ? logoutError.message : 'נסה שוב בעוד רגע.');
    }
  };

  const navigateFromMenu = (
    path: '/(tabs)/availability' | '/(tabs)/create-circle' | '/(tabs)/settings' | '/(tabs)/profile',
  ) => {
    setMenuOpen(false);
    router.push(path);
  };

  const drawerTranslateX = drawerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [320, 0],
  });

  const overlayOpacity = drawerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const scrollToBulletins = () => {
    setMenuOpen(false);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, bulletinSectionY - 12),
        animated: true,
      });
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground source={HOME_BG} resizeMode="cover" blurRadius={3} style={StyleSheet.absoluteFillObject}>
        <View style={styles.backdrop} />
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.container,
            {
              paddingTop: Math.max(insets.top, 12) + 8,
              paddingBottom: 120 + insets.bottom,
              paddingHorizontal: Math.max(16, Math.min(20, windowWidth * 0.05)),
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <BlurView intensity={38} tint="light" style={styles.topBarShell}>
            <Pressable style={styles.iconButton} onPress={() => setMenuOpen(true)}>
              <SymbolView name="line.3.horizontal" size={22} tintColor="#FFFFFF" />
            </Pressable>
            <Text style={styles.topTitle} numberOfLines={1}>המעגלים שלי</Text>
            <Pressable style={styles.iconButton} onPress={scrollToBulletins}>
              <SymbolView name="bell.badge" size={21} tintColor="#FFFFFF" />
            </Pressable>
          </BlurView>

          <View style={styles.hero}>
            <View style={[styles.homeLogoWrap, { width: logoSize, height: logoSize }]}>
              <Image source={logoSource} style={[styles.homeLogo, { width: logoSize, height: logoSize }]} resizeMode="contain" />
            </View>
            <Text style={styles.title}>שלום {profile?.displayName || 'שחקן'}</Text>
            <Text style={styles.subtitle}>מצא מעגל פתוח, בדוק התאמה לרמה שלך, והצטרף בלחיצה.</Text>
          </View>

          <View style={styles.heroPanel}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{filteredCircles.length}</Text>
              <Text style={styles.metricLabel}>מעגלים פתוחים</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{profile?.stats.rating.toFixed(1) ?? '0.0'}</Text>
              <Text style={styles.metricLabel}>דירוג</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{profile?.city || 'עיר'}</Text>
              <Text style={styles.metricLabel}>אזור</Text>
            </View>
          </View>

          <View
            style={styles.bulletinsCard}
            onLayout={(event) => setBulletinSectionY(event.nativeEvent.layout.y)}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderBadge}>
                <Text style={styles.sectionHeaderBadgeText}>חדש</Text>
              </View>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>מודעות ונושא מרכזי</Text>
                <Text style={styles.sectionSubtitle}>
                  עדכונים מערכתיים, פתיחות דחופות ונושאים שחשוב לראות לפני שמצטרפים למעגל.
                </Text>
              </View>
            </View>

            {bulletins.map((bulletin, index) => (
              <View
                key={bulletin.id}
                style={[
                  styles.bulletinItem,
                  index === 0 && styles.bulletinItemFeatured,
                ]}
              >
                <View style={styles.bulletinTopRow}>
                  <Text style={styles.bulletinTag}>{bulletin.tag}</Text>
                  <Text style={styles.bulletinTitle}>{bulletin.title}</Text>
                </View>
                <Text style={styles.bulletinBody}>{bulletin.body}</Text>
                <Button
                  title={bulletin.ctaLabel}
                  variant={index === 0 ? 'primary' : 'secondary'}
                  onPress={() => router.push(bulletin.route)}
                />
              </View>
            ))}

            {bulletins.length === 0 ? (
              <Text style={styles.emptyBulletinsText}>כרגע אין מודעות פעילות להצגה.</Text>
            ) : null}
          </View>

          <View style={styles.nearbyCard}>
            <Text style={styles.nearbyTitle}>מעגלים באיזורך</Text>
            <Text style={styles.nearbyBody}>
              {nearbyCircles.length > 0
                ? `${nearbyCircles.length} מעגלים קרובים ל-${profile?.location?.area || profile?.city || 'האזור שלך'}`
                : 'עדיין אין מעגלים בדיוק באזור שלך. אפשר ליצור אחד חדש.'}
            </Text>
            {nearbyCircles.slice(0, 2).map((circle) => (
              <View key={circle.id} style={styles.nearbyRow}>
                <View style={styles.nearbyDot} />
                <Text style={styles.nearbyRowText}>
                  {circle.title} · {circle.location.name}
                </Text>
              </View>
            ))}
            {profile?.role === 'manager' ? (
              <Button title="שליטת התראות למנהלים" variant="secondary" onPress={() => router.push('/manager-alerts')} />
            ) : null}
          </View>

          <View style={styles.filterBlock}>
            <Text style={styles.filterTitle}>חיפוש ואזור</Text>
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="חפש לפי אזור, עיר, חוף או שם מעגל"
              placeholderTextColor="#8C96A7"
              style={styles.searchInput}
              textAlign="right"
            />
            <View style={styles.filterRow}>
              <Button
                title={urgentOnly ? 'דחוף בלבד' : 'כל הדחיפויות'}
                variant={urgentOnly ? 'primary' : 'secondary'}
                onPress={() => setUrgentOnly((current) => !current)}
                style={styles.filterButton}
              />
              <Button
                title="נקה חיפוש"
                variant="ghost"
                onPress={() => {
                  setSearchTerm('');
                  setAreaFilter('all');
                  setUrgentOnly(false);
                }}
                style={styles.filterButton}
              />
            </View>
            <View style={styles.filterRow}>
              <Button
                title="כל האזורים"
                variant={areaFilter === 'all' ? 'primary' : 'secondary'}
                onPress={() => setAreaFilter('all')}
                style={styles.filterButton}
              />
              {areaOptions.map((area) => (
                <Button
                  key={area}
                  title={area}
                  variant={areaFilter === area ? 'primary' : 'secondary'}
                  onPress={() => setAreaFilter(area)}
                  style={styles.filterButton}
                />
              ))}
            </View>
            <Text style={styles.filterTitle}>סינון לפי רמה</Text>
            <View style={styles.filterRow}>
              {LEVEL_FILTERS.map((level) => (
                <Button
                  key={level}
                  title={
                    level === 'any' ? 'הכל' : level === 'beginner' ? 'מתחיל' : level === 'intermediate' ? 'בינוני' : 'מתקדם'
                  }
                  variant={levelFilter === level ? 'primary' : 'secondary'}
                  onPress={() => setLevelFilter(level)}
                  style={styles.filterButton}
                />
              ))}
            </View>
            <Text style={styles.filterTitle}>סינון לפי תאריך</Text>
            <View style={styles.filterRow}>
              {[
                { key: 'all', label: 'הכל' },
                { key: 'today', label: 'היום' },
                { key: 'week', label: 'שבוע' },
              ].map((item) => (
                <Button
                  key={item.key}
                  title={item.label}
                  variant={dateFilter === item.key ? 'primary' : 'secondary'}
                  onPress={() => setDateFilter(item.key as DateFilter)}
                  style={styles.filterButton}
                />
              ))}
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {loading && filteredCircles.length === 0 ? <Text style={styles.helper}>טוען מעגלים...</Text> : null}

          <View style={styles.listWrap}>
            <CircleListGrouped
              circles={filteredCircles}
              currentUserId={currentUserId ?? undefined}
              currentUserGender={profile?.gender}
              joiningCircleId={joiningCircleId}
              onOpen={(circle) => router.push(`/circle/${circle.id}`)}
              onJoin={handleJoin}
            />
          </View>
        </ScrollView>
      </ImageBackground>

      <Animated.View
        pointerEvents={menuOpen ? 'auto' : 'none'}
        style={[styles.drawerOverlay, { opacity: overlayOpacity }]}
      >
        <Pressable style={styles.drawerOverlayTouch} onPress={() => setMenuOpen(false)} />
        <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerTranslateX }] }]}>
          <BlurView intensity={45} tint="light" style={styles.drawerInner}>
            <Text style={styles.drawerTitle}>תפריט</Text>
            <Pressable style={styles.drawerItem} onPress={() => navigateFromMenu('/(tabs)/availability')}>
              <SymbolView name="calendar" size={18} tintColor={theme.colors.deep} />
              <Text style={styles.drawerItemLabel}>זמינות</Text>
            </Pressable>
            <Pressable style={styles.drawerItem} onPress={() => navigateFromMenu('/(tabs)/settings')}>
              <SymbolView name="gearshape" size={18} tintColor={theme.colors.deep} />
              <Text style={styles.drawerItemLabel}>הגדרות</Text>
            </Pressable>
            <Pressable style={styles.drawerItem} onPress={() => navigateFromMenu('/(tabs)/profile')}>
              <SymbolView name="person" size={18} tintColor={theme.colors.deep} />
              <Text style={styles.drawerItemLabel}>פרופיל</Text>
            </Pressable>
            <Pressable style={styles.drawerItem} onPress={scrollToBulletins}>
              <SymbolView name="megaphone" size={18} tintColor={theme.colors.deep} />
              <Text style={styles.drawerItemLabel}>מודעות ועדכונים</Text>
            </Pressable>
            <Pressable style={[styles.drawerItem, styles.logoutItem]} onPress={handleLogout}>
              <SymbolView name="rectangle.portrait.and.arrow.right" size={18} tintColor={theme.colors.danger} />
              <Text style={styles.logoutLabel}>התנתק</Text>
            </Pressable>
          </BlurView>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1E4A5E',
  },
  background: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2E184066',
  },
  container: {
    gap: 18,
    paddingTop: 58,
    paddingBottom: 120,
  },
  topBarShell: {
    minHeight: 58,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF70',
    paddingHorizontal: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  topTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    writingDirection: 'rtl',
    textShadowColor: '#00000035',
    textShadowRadius: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF20',
    borderWidth: 1,
    borderColor: '#FFFFFF40',
  },
  hero: {
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeLogo: {
    backgroundColor: 'transparent',
  },
  homeLogoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    writingDirection: 'rtl',
    color: '#FFFFFF',
    textShadowColor: '#00000030',
    textShadowRadius: 12,
  },
  subtitle: {
    color: '#F7ECFF',
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 24,
  },
  heroPanel: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  bulletinsCard: {
    gap: 12,
    padding: 18,
    borderRadius: 28,
    backgroundColor: '#FFF3D8D9',
    borderWidth: 1,
    borderColor: '#FFE7A6',
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 10,
  },
  sectionHeaderBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EF6A1A',
  },
  sectionHeaderBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    writingDirection: 'rtl',
  },
  sectionHeaderText: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  sectionTitle: {
    color: theme.colors.deep,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sectionSubtitle: {
    color: '#6A4C55',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 21,
  },
  bulletinItem: {
    gap: 10,
    padding: 14,
    borderRadius: 22,
    backgroundColor: '#FFFFFFC4',
    borderWidth: 1,
    borderColor: '#FFFFFFAF',
  },
  bulletinItemFeatured: {
    backgroundColor: '#FFF8E6',
    borderColor: '#FFD77A',
  },
  bulletinTopRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  bulletinTag: {
    color: '#EF6A1A',
    fontWeight: '900',
    writingDirection: 'rtl',
  },
  bulletinTitle: {
    flex: 1,
    color: theme.colors.deep,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  bulletinBody: {
    color: '#573F63',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 21,
  },
  emptyBulletinsText: {
    color: '#6A4C55',
    textAlign: 'right',
    writingDirection: 'rtl',
    fontWeight: '700',
  },
  metric: {
    flex: 1,
    minHeight: 96,
    borderRadius: 28,
    backgroundColor: '#FFFFFFA8',
    borderWidth: 1,
    borderColor: '#FFFFFF8F',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  metricValue: {
    color: theme.colors.deep,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  metricLabel: {
    color: '#52385F',
    fontWeight: '700',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  filterBlock: {
    gap: 12,
    padding: 18,
    borderRadius: 28,
    backgroundColor: '#FFFFFFA8',
    borderWidth: 1,
    borderColor: '#FFFFFF8F',
  },
  searchInput: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E3EDF7',
    backgroundColor: '#F8FBFF',
    paddingHorizontal: 14,
    color: theme.colors.deep,
  },
  nearbyCard: {
    gap: 8,
    padding: 18,
    borderRadius: 28,
    backgroundColor: '#FFFFFFA8',
    borderWidth: 1,
    borderColor: '#FFFFFF8F',
  },
  nearbyTitle: {
    color: theme.colors.deep,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  nearbyBody: {
    color: '#573F63',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  nearbyRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  nearbyDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.coral,
  },
  nearbyRowText: {
    flex: 1,
    color: theme.colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  filterTitle: {
    fontWeight: '900',
    textAlign: 'right',
    writingDirection: 'rtl',
    color: theme.colors.deep,
  },
  filterRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    minWidth: 84,
  },
  listWrap: {
    backgroundColor: '#FFFFFF9F',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#FFFFFF7A',
    padding: 10,
  },
  error: {
    color: '#FFE0E0',
    textAlign: 'right',
    writingDirection: 'rtl',
    fontWeight: '700',
  },
  helper: {
    textAlign: 'center',
    color: '#F7ECFF',
    writingDirection: 'rtl',
  },
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000045',
    flexDirection: 'row',
  },
  drawerOverlayTouch: {
    flex: 1,
  },
  drawer: {
    width: 286,
    height: '100%',
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    overflow: 'hidden',
  },
  drawerInner: {
    flex: 1,
    paddingTop: 72,
    paddingHorizontal: 18,
    gap: 8,
    borderLeftWidth: 1,
    borderColor: '#FFFFFF70',
    backgroundColor: '#FFFFFF99',
  },
  drawerTitle: {
    color: theme.colors.deep,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 10,
  },
  drawerItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    backgroundColor: '#FFFFFFA8',
    borderWidth: 1,
    borderColor: '#FFFFFFA0',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  drawerItemLabel: {
    color: theme.colors.deep,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  logoutItem: {
    marginTop: 12,
    borderColor: '#F5B6B4',
    backgroundColor: '#FFECEC',
  },
  logoutLabel: {
    color: theme.colors.danger,
    fontWeight: '900',
    writingDirection: 'rtl',
  },
});
