import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { loginWithPhoneAndPassword } from '@/services/auth.service';
import { isFirebaseConfigured } from '@/services/firebase';
import { useAuthStore } from '@/stores/auth.store';

const logoSource = require('@/assets/images/logo.png');

const PHONE_REGEX = /^0?[2-9]\d{7,8}$/;

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const loginAsGuest = useAuthStore((state) => state.loginAsGuest);

  const handleLogin = async () => {
    setError(null);
    const trimmedPhone = phone.replace(/\s/g, '');
    const digits = trimmedPhone.replace(/\D/g, '');
    if (!digits || !PHONE_REGEX.test(digits)) {
      setError('יש להזין מספר טלפון תקין (למשל 0501234567)');
      return;
    }
    if (!password || password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    setLoading(true);
    try {
      await loginWithPhoneAndPassword(trimmedPhone, password);
      router.replace('/');
    } catch (e) {
      Alert.alert(
        'התחברות נכשלה',
        e instanceof Error ? e.message : 'טלפון או סיסמה שגויים. נסה שוב.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#2A9CF1', '#47A8F3', '#88CAF8', '#E4C89A']} style={styles.root}>
      <View style={[styles.glow, styles.glowTop]} />
      <View style={[styles.glow, styles.glowRight]} />
      <View style={[styles.glow, styles.glowBottom]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.logoWrap}>
              <Image source={logoSource} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={styles.kicker}>FOOTVOLLEY SOCIAL</Text>
            <Text style={styles.title}>בואו להקפיץ</Text>
            <Text style={styles.subtitle}>מתחברים, קובעים מעגל, נפגשים על החול ונותנים לכדור לעוף.</Text>
          </View>

          <BlurView intensity={56} tint="light" style={styles.card}>
            {!isFirebaseConfigured ? (
              <>
                <Text style={styles.helperText}>Firebase לא מוגדר כרגע, לכן כניסת אורח פעילה.</Text>
                <Button
                  title="כניסה כאורח"
                  loading={loading}
                  onPress={() => {
                    loginAsGuest();
                    router.replace('/(tabs)');
                  }}
                  style={styles.guestPrimaryButton}
                />
              </>
            ) : (
              <>
                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>מספר טלפון</Text>
                  <TextInput
                    value={phone}
                    onChangeText={(t) => { setPhone(t); setError(null); }}
                    keyboardType="phone-pad"
                    textAlign="right"
                    placeholder="0501234567"
                    placeholderTextColor="#8796A6"
                    style={styles.input}
                  />
                </View>
                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>סיסמה</Text>
                  <TextInput
                    value={password}
                    onChangeText={(t) => { setPassword(t); setError(null); }}
                    secureTextEntry
                    textAlign="right"
                    placeholder="••••••••"
                    placeholderTextColor="#8796A6"
                    style={styles.input}
                  />
                </View>
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Button title="התחברות" loading={loading} onPress={handleLogin} style={styles.loginButton} />

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>או</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Button
                  title="כניסה כאורח"
                  variant="primary"
                  onPress={() => {
                    loginAsGuest();
                    router.replace('/(tabs)');
                  }}
                  style={styles.guestButton}
                />

                <Link href="/(auth)/register" asChild>
                  <Pressable style={({ pressed }) => [styles.registerButton, pressed && styles.registerButtonPressed]}>
                    <Text style={styles.registerButtonText}>אין לך חשבון? להרשמה</Text>
                  </Pressable>
                </Link>
              </>
            )}
          </BlurView>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 40,
    paddingBottom: 24,
    gap: 18,
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.48,
  },
  glowTop: {
    width: 340,
    height: 340,
    top: -110,
    left: -80,
    backgroundColor: '#8CDCFF',
  },
  glowRight: {
    width: 300,
    height: 300,
    right: -100,
    top: 180,
    backgroundColor: '#A6D6FF',
  },
  glowBottom: {
    width: 440,
    height: 240,
    left: -70,
    bottom: -80,
    backgroundColor: '#EACF9E',
  },
  hero: {
    alignItems: 'center',
    gap: 10,
  },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF20',
    borderWidth: 1,
    borderColor: '#FFFFFF90',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  logoImage: { width: 76, height: 76 },
  kicker: {
    marginTop: 8,
    fontSize: 13,
    letterSpacing: 2.2,
    color: '#E68654',
    fontWeight: '800',
  },
  title: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    writingDirection: 'rtl',
    textAlign: 'center',
    textShadowColor: '#00000035',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 7,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 30,
    color: '#ECF6FF',
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  card: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#FFFFFF73',
    overflow: 'hidden',
    padding: 20,
    gap: 14,
    backgroundColor: '#FFFFFF1F',
  },
  fieldWrap: { gap: 7 },
  label: {
    color: '#F8FBFF',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  input: {
    minHeight: 58,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#92A7B8',
    backgroundColor: '#F9FBFF',
    color: '#3B4A5B',
    fontSize: 16,
    paddingHorizontal: 16,
  },
  error: {
    color: '#FFD2D2',
    textAlign: 'right',
    writingDirection: 'rtl',
    fontSize: 14,
  },
  loginButton: {
    marginTop: 6,
    backgroundColor: '#F56A1A',
    borderColor: '#D24E00',
    shadowColor: '#FF6C1E',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#FFFFFF59',
  },
  dividerText: {
    color: '#F4F4F4',
    fontSize: 16,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  guestButton: {
    backgroundColor: '#00000036',
    borderColor: '#FFFFFF2E',
    shadowOpacity: 0,
  },
  guestPrimaryButton: {
    backgroundColor: '#00000036',
    borderColor: '#FFFFFF2E',
    shadowOpacity: 0,
  },
  registerButton: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  registerButtonPressed: { opacity: 0.85 },
  registerButtonText: {
    color: '#F2FAFF',
    fontWeight: '800',
    fontSize: 16,
    writingDirection: 'rtl',
  },
  helperText: {
    color: '#F0F7FF',
    lineHeight: 23,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  bottomSpacer: { height: Platform.OS === 'ios' ? 12 : 6 },
});
