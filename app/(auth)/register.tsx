import { zodResolver } from '@hookform/resolvers/zod';
import { BlurView } from 'expo-blur';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
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
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { registerWithPhoneAndPassword } from '@/services/auth.service';
import { isFirebaseConfigured } from '@/services/firebase';
import { useAuthStore } from '@/stores/auth.store';
import type { Gender, PlayStyle, PlayerLevel } from '@/types/models';

const PHONE_REGEX = /^0?[2-9]\d{7,8}$/;

const logoSource = require('@/assets/images/logo.png');

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'גבר' },
  { value: 'female', label: 'אישה' },
  { value: 'other', label: 'אחר' },
];

const LEVELS: { value: PlayerLevel; label: string }[] = [
  { value: 'beginner', label: 'מתחיל' },
  { value: 'intermediate', label: 'בינוני' },
  { value: 'expert', label: 'מתקדם' },
];

const STYLES: { value: PlayStyle; label: string; note: string }[] = [
  { value: 'social', label: 'חברתי', note: 'באים בשביל האנשים והכיף' },
  { value: 'competitive', label: 'תחרותי', note: 'אוהבים קצב וניצחונות' },
  { value: 'sunset', label: 'שקיעה', note: 'וייב רגוע ומשחק ארוך' },
];

const demoSchema = z.object({
  displayName: z.string().min(2, 'יש להזין שם תצוגה.'),
  gender: z.enum(['male', 'female', 'other']),
  city: z.string().min(2, 'יש להזין עיר.'),
  level: z.enum(['beginner', 'intermediate', 'expert']),
  playStyle: z.enum(['social', 'competitive', 'sunset']),
});

type DemoRegisterForm = z.infer<typeof demoSchema>;

const STEP_TITLES = ['מי נכנס לשחק?', 'איפה והרמה שלי', 'איזה vibe אני מביא'];
const STEP_SUBTITLES = [
  'בחר שם שיופיע במעגלים ומי אתה.',
  'עיר ורמת משחק כדי להציג מעגלים מתאימים.',
  'הצעד האחרון – בוחרים סגנון ויוצאים לחוף.',
];

export default function RegisterScreen() {
  const createDemoAccount = useAuthStore((state) => state.createDemoAccount);
  const setPendingDisplayName = useAuthStore((state) => state.setPendingDisplayName);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(1)).current;

  const demoForm = useForm<DemoRegisterForm>({
    resolver: zodResolver(demoSchema),
    defaultValues: {
      displayName: '',
      gender: 'male',
      city: '',
      level: 'intermediate',
      playStyle: 'social',
    },
  });

  const handleSendCode = async () => {
    setFormError(null);
    const trimmed = phone.replace(/\s/g, '');
    const digits = trimmed.replace(/\D/g, '');
    if (!displayName.trim() || displayName.trim().length < 2) {
      setFormError('יש להזין שם מלא');
      return;
    }
    if (!digits || !PHONE_REGEX.test(digits)) {
      setFormError('יש להזין מספר טלפון תקין (למשל 0501234567)');
      return;
    }
    if (!password || password.length < 6) {
      setFormError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('הסיסמאות אינן תואמות');
      return;
    }
    setLoading(true);
    try {
      await registerWithPhoneAndPassword(displayName.trim(), trimmed, password);
      setPendingDisplayName(displayName.trim());
      router.replace('/onboarding');
    } catch (e) {
      Alert.alert('הרשמה נכשלה', e instanceof Error ? e.message : 'אולי המספר כבר רשום. נסה להתחבר.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 0.25, duration: 0, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();
  }, [step]);

  const nextStep = async () => {
    if (step === 0) {
      const ok = await demoForm.trigger(['displayName', 'gender']);
      if (!ok) return;
    }
    if (step === 1) {
      const ok = await demoForm.trigger(['city', 'level']);
      if (!ok) return;
    }
    setStep((s) => Math.min(s + 1, 2));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const submitDemo = demoForm.handleSubmit(async (values) => {
    setLoading(true);
    try {
      createDemoAccount(values);
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('הרשמה נכשלה', e instanceof Error ? e.message : 'נסה שוב.');
    } finally {
      setLoading(false);
    }
  });

  if (isFirebaseConfigured) {
    return (
      <LinearGradient colors={['#2A9CF1', '#47A8F3', '#88CAF8', '#E4C89A']} style={styles.root}>
        <View style={[styles.glow, styles.glowTop]} />
        <View style={[styles.glow, styles.glowRight]} />
        <View style={[styles.glow, styles.glowBottom]} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.hero}>
              <View style={styles.logoWrap}>
                <Image source={logoSource} style={styles.logoImage} resizeMode="contain" />
              </View>
              <Text style={styles.kicker}>FOOTVOLLEY SOCIAL</Text>
              <Text style={styles.title}>פותחים חשבון</Text>
              <Text style={styles.subtitle}>
                הזן שם מלא, טלפון וסיסמה. אחרי ההרשמה תשלים פרופיל – מיקום, רמה ועוד.
              </Text>
            </View>

            <BlurView intensity={56} tint="light" style={styles.card}>
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>שם מלא</Text>
                <TextInput
                  value={displayName}
                  onChangeText={(t) => { setDisplayName(t); setFormError(null); }}
                  textAlign="right"
                  placeholder="איך קוראים לך?"
                  placeholderTextColor="#8796A6"
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>מספר טלפון</Text>
                <TextInput
                  value={phone}
                  onChangeText={(t) => { setPhone(t); setFormError(null); }}
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
                  onChangeText={(t) => { setPassword(t); setFormError(null); }}
                  secureTextEntry
                  textAlign="right"
                  placeholder="לפחות 6 תווים"
                  placeholderTextColor="#8796A6"
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>אישור סיסמה</Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); setFormError(null); }}
                  secureTextEntry
                  textAlign="right"
                  placeholder="••••••••"
                  placeholderTextColor="#8796A6"
                  style={styles.input}
                />
              </View>
              {formError ? <Text style={styles.error}>{formError}</Text> : null}
              <Button title="הרשמה" loading={loading} onPress={handleSendCode} style={styles.primaryButton} />

              <Link href="/(auth)/login" asChild>
                <Pressable style={({ pressed }) => [styles.loginLinkButton, pressed && styles.loginLinkButtonPressed]}>
                  <Text style={styles.loginLinkText}>כבר יש חשבון? להתחברות</Text>
                </Pressable>
              </Link>
            </BlurView>

            <View style={styles.bottomSpacer} />
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#2A9CF1', '#47A8F3', '#88CAF8', '#E4C89A']} style={styles.root}>
      <View style={[styles.glow, styles.glowTop]} />
      <View style={[styles.glow, styles.glowRight]} />
      <View style={[styles.glow, styles.glowBottom]} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.logoWrap}>
              <Image source={logoSource} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={styles.kicker}>FOOTVOLLEY SOCIAL</Text>
            <Text style={styles.title}>הרשמה</Text>
            <Text style={styles.subtitle}>{STEP_SUBTITLES[step]}</Text>
          </View>

          <View style={styles.progressRow}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
            ))}
          </View>

          <Animated.View style={{ opacity }}>
            <BlurView intensity={56} tint="light" style={styles.card}>
              <Text style={styles.stepTitle}>{STEP_TITLES[step]}</Text>

              {step === 0 && (
                <>
                  <Controller
                    control={demoForm.control}
                    name="displayName"
                    render={({ field: { onChange, value } }) => (
                      <View style={styles.fieldWrap}>
                        <Text style={styles.label}>שם תצוגה</Text>
                        <TextInput
                          value={value}
                          onChangeText={onChange}
                          textAlign="right"
                          placeholder="איך יקראו לך במעגלים"
                          placeholderTextColor="#8796A6"
                          style={styles.input}
                        />
                        {demoForm.formState.errors.displayName?.message ? (
                          <Text style={styles.error}>{demoForm.formState.errors.displayName.message}</Text>
                        ) : null}
                      </View>
                    )}
                  />
                  <View style={styles.chipWrap}>
                    <Text style={styles.label}>מין</Text>
                    <View style={styles.chipRow}>
                      {GENDERS.map((opt) => (
                        <Chip
                          key={opt.value}
                          label={opt.label}
                          selected={demoForm.watch('gender') === opt.value}
                          onPress={() => demoForm.setValue('gender', opt.value)}
                        />
                      ))}
                    </View>
                  </View>
                </>
              )}

              {step === 1 && (
                <>
                  <Controller
                    control={demoForm.control}
                    name="city"
                    render={({ field: { onChange, value } }) => (
                      <View style={styles.fieldWrap}>
                        <Text style={styles.label}>עיר</Text>
                        <TextInput
                          value={value}
                          onChangeText={onChange}
                          textAlign="right"
                          placeholder="איפה אתה משחק בדרך כלל"
                          placeholderTextColor="#8796A6"
                          style={styles.input}
                        />
                        {demoForm.formState.errors.city?.message ? (
                          <Text style={styles.error}>{demoForm.formState.errors.city.message}</Text>
                        ) : null}
                      </View>
                    )}
                  />
                  <View style={styles.chipWrap}>
                    <Text style={styles.label}>הרמה שלי</Text>
                    <View style={styles.chipRow}>
                      {LEVELS.map((opt) => (
                        <Chip
                          key={opt.value}
                          label={opt.label}
                          selected={demoForm.watch('level') === opt.value}
                          onPress={() => demoForm.setValue('level', opt.value)}
                        />
                      ))}
                    </View>
                  </View>
                </>
              )}

              {step === 2 && (
                <View style={styles.chipWrap}>
                  <Text style={styles.label}>סגנון משחק</Text>
                  <View style={styles.styleColumn}>
                    {STYLES.map((opt) => (
                      <Chip
                        key={opt.value}
                        label={`${opt.label} · ${opt.note}`}
                        selected={demoForm.watch('playStyle') === opt.value}
                        onPress={() => demoForm.setValue('playStyle', opt.value)}
                        fullWidth
                      />
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.actions}>
                {step > 0 ? (
                  <Pressable onPress={prevStep} style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}>
                    <Text style={styles.backBtnText}>חזרה</Text>
                  </Pressable>
                ) : (
                  <View style={styles.backBtn} />
                )}
                {step < 2 ? (
                  <Button title="המשך" onPress={nextStep} style={styles.primaryButton} />
                ) : (
                  <Button title="סיום הרשמה" loading={loading} onPress={submitDemo} style={styles.primaryButton} />
                )}
              </View>
            </BlurView>
          </Animated.View>

          <Link href="/(auth)/login" style={styles.linkWrap}>
            <Text style={styles.linkText}>כבר יש חשבון? להתחברות</Text>
          </Link>
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function Chip({
  label,
  selected,
  onPress,
  fullWidth,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  fullWidth?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        fullWidth && styles.chipFull,
        selected && styles.chipSelected,
        pressed && styles.chipPressed,
      ]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 40,
    paddingBottom: 24,
    gap: 16,
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
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    writingDirection: 'rtl',
    textAlign: 'center',
    textShadowColor: '#00000035',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 7,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 26,
    color: '#ECF6FF',
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  progressRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: 10,
  },
  progressDot: {
    width: 28,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  progressDotActive: {
    width: 48,
    backgroundColor: '#FFFFFF',
  },
  card: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#FFFFFF73',
    overflow: 'hidden',
    padding: 20,
    gap: 16,
    backgroundColor: '#FFFFFF1F',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  helperText: {
    color: '#F0F7FF',
    lineHeight: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontSize: 14,
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
    fontSize: 13,
  },
  chipWrap: { gap: 10 },
  chipRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
  },
  styleColumn: { gap: 10 },
  chip: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipFull: { alignSelf: 'stretch' },
  chipSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  chipPressed: { opacity: 0.9 },
  chipText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E8F4FF',
    writingDirection: 'rtl',
  },
  chipTextSelected: { color: '#FFFFFF' },
  actions: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  backBtn: {
    minHeight: 54,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  backBtnPressed: { opacity: 0.8 },
  backBtnText: {
    color: '#F2FAFF',
    fontSize: 16,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  primaryButton: {
    backgroundColor: '#F56A1A',
    borderColor: '#D24E00',
    shadowColor: '#FF6C1E',
  },
  loginLinkButton: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginLinkButtonPressed: { opacity: 0.85 },
  loginLinkText: {
    color: '#F2FAFF',
    fontWeight: '800',
    fontSize: 16,
    writingDirection: 'rtl',
  },
  linkWrap: { alignSelf: 'center' },
  linkText: {
    color: '#F2FAFF',
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  bottomSpacer: { height: Platform.OS === 'ios' ? 12 : 6 },
});
