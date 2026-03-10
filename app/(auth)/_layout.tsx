import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/stores/auth.store';

export default function AuthLayout() {
  const status = useAuthStore((state) => state.status);
  const profile = useAuthStore((state) => state.profile);

  if (status === 'authenticated' && profile?.profileCompleted) {
    return <Redirect href="/(tabs)" />;
  }

  if (status === 'authenticated' && !profile?.profileCompleted) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
