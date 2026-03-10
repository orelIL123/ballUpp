import { zodResolver } from '@hookform/resolvers/zod';
import { BlurView } from 'expo-blur';
import { Link, router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';
import { loginWithEmail } from '@/services/auth.service';
import { isFirebaseConfigured } from '@/services/firebase';
import { useAuthStore } from '@/stores/auth.store';

const schema = z.object({
  email: z.email('יש להזין אימייל תקין.'),
  password: z.string().min(6, 'הסיסמה חייבת להכיל לפחות 6 תווים.'),
});

type LoginForm = z.infer<typeof schema>;

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const loginAsGuest = useAuthStore((state) => state.loginAsGuest);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    try {
      await loginWithEmail(values.email, values.password);
      router.replace('/');
    } catch (error) {
      Alert.alert('התחברות נכשלה', error instanceof Error ? error.message : 'לא הצלחנו להתחבר.');
    } finally {
      setLoading(false);
    }
  });

  return (
    <LinearGradient colors={['#2A9CF1', '#47A8F3', '#88CAF8', '#E4C89A']} style={styles.root}>
      <View style={[styles.glow, styles.glowTop]} />
      <View style={[styles.glow, styles.glowRight]} />
      <View style={[styles.glow, styles.glowBottom]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.logoWrap}>
              <SymbolView name="circle.grid.2x2.fill" size={34} tintColor="#FFFFFF" />
            </View>
            <Text style={styles.kicker}>FOOTVOLLEY SOCIAL</Text>
            <Text style={styles.title}>בואו להקפיץ איתי</Text>
            <Text style={styles.subtitle}>מתחברים, קובעים מעגל, נפגשים על החול ונותנים לכדור לעוף.</Text>
            <View style={styles.ball}>
              <View style={[styles.ballStripe, styles.ballStripeYellow]} />
              <View style={[styles.ballStripe, styles.ballStripeBlue]} />
              <View style={[styles.ballStripe, styles.ballStripeWhite]} />
              <Text style={styles.ballText}>MIKASA</Text>
            </View>
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
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.fieldWrap}>
                      <Text style={styles.label}>אימייל</Text>
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        textAlign="left"
                        placeholder="your@email.com"
                        placeholderTextColor="#8796A6"
                        style={styles.input}
                      />
                      {errors.email?.message ? <Text style={styles.error}>{errors.email.message}</Text> : null}
                    </View>
                  )}
                />

                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.fieldWrap}>
                      <Text style={styles.label}>סיסמה</Text>
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        secureTextEntry
                        textAlign="left"
                        placeholder="••••••••"
                        placeholderTextColor="#8796A6"
                        style={styles.input}
                      />
                      {errors.password?.message ? <Text style={styles.error}>{errors.password.message}</Text> : null}
                    </View>
                  )}
                />

                <Button title="התחברות" loading={loading} onPress={onSubmit} style={styles.loginButton} />

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

                <Link href="/(auth)/register" style={styles.registerLink}>
                  <Text style={styles.registerText}>אין לך חשבון? להרשמה</Text>
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
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 40,
    paddingBottom: 24,
    justifyContent: 'space-between',
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
    width: 74,
    height: 74,
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
  },
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
    maxWidth: 580,
    fontSize: 18,
    lineHeight: 30,
    color: '#ECF6FF',
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  ball: {
    marginTop: 6,
    width: 84,
    height: 84,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#FFE38A',
    overflow: 'hidden',
    backgroundColor: '#2F57A8',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-18deg' }],
  },
  ballStripe: {
    position: 'absolute',
    width: 118,
    height: 24,
    borderRadius: 24,
  },
  ballStripeYellow: {
    top: 8,
    right: -10,
    backgroundColor: '#F6CB3B',
    transform: [{ rotate: '16deg' }],
  },
  ballStripeBlue: {
    top: 34,
    left: -10,
    backgroundColor: '#2E4E9A',
    transform: [{ rotate: '-8deg' }],
  },
  ballStripeWhite: {
    bottom: 10,
    right: -6,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '-16deg' }],
  },
  ballText: {
    color: '#254689',
    fontSize: 12,
    fontWeight: '900',
    transform: [{ rotate: '18deg' }],
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
  fieldWrap: {
    gap: 7,
  },
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
  registerLink: {
    alignSelf: 'center',
    marginTop: 4,
  },
  registerText: {
    color: '#F2FAFF',
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  helperText: {
    color: '#F0F7FF',
    lineHeight: 23,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  bottomSpacer: {
    height: Platform.OS === 'ios' ? 12 : 6,
  },
});
