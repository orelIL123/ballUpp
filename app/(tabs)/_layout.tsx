import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Redirect, Tabs, router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Home, Settings, User } from 'lucide-react-native';
import { Dimensions, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth.store';

const { width } = Dimensions.get('window');

export default function TabLayout() {
  const status = useAuthStore((state) => state.status);
  const profile = useAuthStore((state) => state.profile);

  if (status === 'loading') {
    return null;
  }

  if (status !== 'authenticated') {
    return <Redirect href="/(auth)/login" />;
  }

  if (!profile?.profileCompleted) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        sceneStyle: {
          backgroundColor: theme.colors.sand,
        },
        headerStyle: {
          backgroundColor: theme.colors.shell,
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          color: theme.colors.deep,
          fontSize: 18,
          fontWeight: '800',
        },
        headerTitle: () => <TopBrand />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'מעגלים',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="availability"
        options={{
          title: 'זמינות',
        }}
      />
      <Tabs.Screen
        name="create-circle"
        options={{
          title: 'יצירת מעגל',
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'הגדרות',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'הפרופיל שלי',
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

const logoSource = require('@/assets/images/logo.png');
const circleLogoSource = require('@/assets/images/ball-icon.png');

function TopBrand() {
  return (
    <View style={styles.brandWrap}>
      <View style={styles.headerLogoWrap}>
        <Image source={logoSource} style={styles.headerLogo} resizeMode="cover" />
      </View>
      <Text style={styles.brandTitle}>מקפיצים ביחד</Text>
      <Text style={styles.brandSubtitle}>Beach Footvolley Club</Text>
    </View>
  );
}

function CustomTabBar({ state, navigation, descriptors, insets }: BottomTabBarProps) {
  const items = [
    { name: 'index', label: 'בית', Icon: Home },
    { name: 'availability', label: 'זמינות', Icon: Calendar },
    { name: 'settings', label: 'הגדרות', Icon: Settings },
    { name: 'profile', label: 'פרופיל', Icon: User },
  ] as const;

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 10 : 8) }]}>
      <View style={styles.shell}>
        <BlurView intensity={50} tint="light" style={styles.blurContainer}>
          <LinearGradient
            colors={['rgba(255,255,255,0.28)', 'rgba(240,240,255,0.18)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.tabBar}>
            {items.slice(0, 2).map(({ name, label, Icon }) => {
              const routeIndex = state.routes.findIndex((route) => route.name === name);
              const focused = state.index === routeIndex;

              return (
                <TabItem
                  key={name}
                  label={label}
                  focused={focused}
                  onPress={() => navigation.navigate(name)}
                  icon={<Icon size={24} color={focused ? '#6A17DF' : '#8B7AA0'} strokeWidth={2.4} />}
                />
              );
            })}

            <View style={styles.centerGap} />

            {items.slice(2).map(({ name, label, Icon }) => {
              const routeIndex = state.routes.findIndex((route) => route.name === name);
              const focused = state.index === routeIndex;

              return (
                <TabItem
                  key={name}
                  label={label}
                  focused={focused}
                  onPress={() => navigation.navigate(name)}
                  icon={<Icon size={24} color={focused ? '#6A17DF' : '#8B7AA0'} strokeWidth={2.4} />}
                />
              );
            })}
          </View>
        </BlurView>

        <Pressable
          style={({ pressed }) => [styles.mikasaWrap, pressed && styles.mikasaWrapPressed]}
          onPress={() => router.push('/(tabs)/create-circle')}
        >
          <View style={styles.mikasaGlow}>
            <Image source={circleLogoSource} style={styles.circleLogoImage} resizeMode="contain" />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

function TabItem({
  label,
  focused,
  icon,
  onPress,
}: {
  label: string;
  focused: boolean;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tabItem, pressed && styles.tabItemPressed]}>
      {icon}
      <Text style={[styles.tabText, focused && styles.tabTextFocused]}>{label}</Text>
      {focused ? <View style={styles.activePill} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  brandWrap: {
    alignItems: 'center',
    gap: 2,
  },
  headerLogo: {
    width: 40,
    height: 40,
  },
  headerLogoWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  brandTitle: {
    color: theme.colors.deep,
    fontSize: 20,
    fontWeight: '900',
    writingDirection: 'rtl',
  },
  brandSubtitle: {
    color: '#8EA3BF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
  },
  shell: {
    width: width * 0.88,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  blurContainer: {
    width: '100%',
    height: 86,
    borderRadius: 34,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 18,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    paddingHorizontal: 14,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 62,
  },
  tabItemPressed: {
    opacity: 0.86,
  },
  centerGap: {
    width: 92,
  },
  tabText: {
    fontSize: 11,
    color: '#8B7AA0',
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  tabTextFocused: {
    color: '#6A17DF',
  },
  activePill: {
    position: 'absolute',
    top: 8,
    width: 38,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(106,23,223,0.7)',
  },
  mikasaWrap: {
    position: 'absolute',
    top: -32,
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mikasaWrapPressed: {
    transform: [{ scale: 0.97 }],
  },
  mikasaGlow: {
    width: 82,
    height: 82,
    borderRadius: 41,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 18,
    elevation: 14,
  },
  circleLogoImage: {
    width: 82,
    height: 82,
  },
});
