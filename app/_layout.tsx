import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { I18nManager } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { theme } from '@/constants/theme';
import { AnimatedSplash } from '@/components/ui/AnimatedSplash';
import { configureNotificationsAsync } from '@/services/notifications.service';
import { useAuthStore } from '@/stores/auth.store';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const bootstrappedRef = useRef(false);
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (!I18nManager.isRTL) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(true);
    }
  }, []);

  useEffect(() => {
    if (bootstrappedRef.current) {
      return;
    }

    bootstrappedRef.current = true;
    const unsubscribe = useAuthStore.getState().bootstrap();

    return () => {
      unsubscribe();
      bootstrappedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    configureNotificationsAsync();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <RootLayoutNav
      showAnimatedSplash={showAnimatedSplash}
      onFinishSplash={() => setShowAnimatedSplash(false)}
    />
  );
}

function RootLayoutNav({
  showAnimatedSplash,
  onFinishSplash,
}: {
  showAnimatedSplash: boolean;
  onFinishSplash: () => void;
}) {
  return (
    <SafeAreaProvider>
      <ThemeProvider value={DefaultTheme}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerBackTitle: 'חזור',
            headerTitleAlign: 'center',
            contentStyle: { backgroundColor: '#FFF4E5' },
            headerStyle: {
              backgroundColor: '#FFF9F0',
            },
            headerShadowVisible: false,
            headerTintColor: theme.colors.deep,
            headerTitleStyle: {
              color: theme.colors.deep,
              fontSize: 18,
              fontWeight: '800',
            },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ title: 'השלמת פרופיל' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="manager-alerts" options={{ title: 'התראות ושליטה' }} />
          <Stack.Screen
            name="circle/[id]"
            options={{
              title: 'פרטי מעגל',
              headerBackTitle: 'חזור',
              headerBackVisible: true,
              headerStyle: { backgroundColor: theme.colors.shell },
              headerTitleStyle: {
                color: theme.colors.deep,
                fontSize: 18,
                fontWeight: '800',
              },
              contentStyle: { backgroundColor: theme.colors.sand },
            }}
          />
          <Stack.Screen name="player/[id]" options={{ title: 'פרופיל שחקן' }} />
          <Stack.Screen name="+not-found" options={{ title: 'לא נמצא' }} />
        </Stack>
        {showAnimatedSplash ? <AnimatedSplash onFinish={onFinishSplash} /> : null}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
