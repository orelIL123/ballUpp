import { router } from 'expo-router';

export function goBackOrReplace(fallbackHref: '/(tabs)' | '/(tabs)/profile' | '/(tabs)/settings' | '/(tabs)/availability') {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallbackHref);
}
