import { Link, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenScroll } from '@/components/ui/Screen';
import { theme } from '@/constants/theme';
import { registerWithEmail } from '@/services/auth.service';
import { isFirebaseConfigured } from '@/services/firebase';
import { useAuthStore } from '@/stores/auth.store';
import type { Gender, PlayStyle, PlayerLevel } from '@/types/models';

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'איש' },
  { value: 'female', label: 'אשה' },
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

const firebaseSchema = z
  .object({
    email: z.email('יש להזין אימייל תקין.'),
    password: z.string().min(6, 'הסיסמה חייבת להכיל לפחות 6 תווים.'),
    confirmPassword: z.string().min(6, 'יש לאשר את הסיסמה.'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'הסיסמאות אינן תואמות.',
    path: ['confirmPassword'],
  });

type DemoRegisterForm = z.infer<typeof demoSchema>;
type FirebaseRegisterForm = z.infer<typeof firebaseSchema>;

export default function RegisterScreen() {
  const createDemoAccount = useAuthStore((state) => state.createDemoAccount);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
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

  const firebaseForm = useForm<FirebaseRegisterForm>({
    resolver: zodResolver(firebaseSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 0.2,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 360,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, step]);

  const nextStep = async () => {
    if (step === 0) {
      const valid = await demoForm.trigger(['displayName', 'gender']);
      if (!valid) {
        return;
      }
    }

    if (step === 1) {
      const valid = await demoForm.trigger(['city', 'level']);
      if (!valid) {
        return;
      }
    }

    setStep((current) => Math.min(current + 1, 2));
  };

  const previousStep = () => {
    setStep((current) => Math.max(current - 1, 0));
  };

  const submitDemo = demoForm.handleSubmit(async (values) => {
    setLoading(true);
    try {
      createDemoAccount(values);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('הרשמת דמו נכשלה', error instanceof Error ? error.message : 'נסה שוב בעוד רגע.');
    } finally {
      setLoading(false);
    }
  });

  const submitFirebase = firebaseForm.handleSubmit(async (values) => {
    setLoading(true);
    try {
      await registerWithEmail(values.email, values.password);
      router.replace('/onboarding');
    } catch (error) {
      Alert.alert('הרשמה נכשלה', error instanceof Error ? error.message : 'לא הצלחנו ליצור חשבון.');
    } finally {
      setLoading(false);
    }
  });

  if (isFirebaseConfigured) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScreenScroll contentContainerStyle={styles.container}>
          <View style={styles.hero}>
            <Text style={styles.title}>פותחים חשבון חדש</Text>
            <Text style={styles.subtitle}>כשה-Firebase מוגדר, ההרשמה תחזור למסלול האמיתי.</Text>
          </View>
          <View style={styles.card}>
            <Controller
              control={firebaseForm.control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="אימייל"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={firebaseForm.formState.errors.email?.message}
                />
              )}
            />
            <Controller
              control={firebaseForm.control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="סיסמה"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  error={firebaseForm.formState.errors.password?.message}
                />
              )}
            />
            <Controller
              control={firebaseForm.control}
              name="confirmPassword"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="אישור סיסמה"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  error={firebaseForm.formState.errors.confirmPassword?.message}
                />
              )}
            />
            <Button title="להרשמה" loading={loading} onPress={submitFirebase} />
          </View>
        </ScreenScroll>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScreenScroll contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <View style={styles.brandChip}>
            <Text style={styles.brandChipText}>DEMO FLOW</Text>
          </View>
          <Text style={styles.title}>הרשמה מדורגת</Text>
          <Text style={styles.subtitle}>מסך אחרי מסך, עם פרופיל דמו מלא וכניסה ישירה לאפליקציה.</Text>
        </View>

        <View style={styles.progressRow}>
          {[0, 1, 2].map((item) => (
            <View key={item} style={[styles.progressDot, item <= step && styles.progressDotActive]} />
          ))}
        </View>

        <Animated.View style={[styles.card, { opacity }]}>
          {step === 0 ? (
            <>
              <Text style={styles.stepTitle}>מי נכנס לשחק?</Text>
              <Text style={styles.stepBody}>בחר זהות ותן לנו שם שיופיע במעגלים ובצ׳אט.</Text>
              <Controller
                control={demoForm.control}
                name="displayName"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="שם תצוגה"
                    value={value}
                    onChangeText={onChange}
                    error={demoForm.formState.errors.displayName?.message}
                  />
                )}
              />
              <Controller
                control={demoForm.control}
                name="gender"
                render={({ field: { value, onChange } }) => (
                  <SegmentedOptions
                    label="אני"
                    options={GENDERS}
                    value={value}
                    onChange={onChange}
                  />
                )}
              />
            </>
          ) : null}

          {step === 1 ? (
            <>
              <Text style={styles.stepTitle}>מה הסטייל שלך?</Text>
              <Text style={styles.stepBody}>מיקום ורמה יעזרו להראות לך את המעגלים הנכונים.</Text>
              <Controller
                control={demoForm.control}
                name="city"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="עיר"
                    value={value}
                    onChangeText={onChange}
                    error={demoForm.formState.errors.city?.message}
                  />
                )}
              />
              <Controller
                control={demoForm.control}
                name="level"
                render={({ field: { value, onChange } }) => (
                  <SegmentedOptions
                    label="רמת משחק"
                    options={LEVELS}
                    value={value}
                    onChange={onChange}
                  />
                )}
              />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Text style={styles.stepTitle}>איזה vibe אתה מביא לחוף?</Text>
              <Text style={styles.stepBody}>הצעד האחרון. בוחרים אופי משחק ויוצאים לפיד.</Text>
              <Controller
                control={demoForm.control}
                name="playStyle"
                render={({ field: { value, onChange } }) => (
                  <View style={styles.styleStack}>
                    <Text style={styles.optionLabel}>סגנון משחק</Text>
                    {STYLES.map((option) => (
                      <Button
                        key={option.value}
                        title={`${option.label} · ${option.note}`}
                        variant={value === option.value ? 'primary' : 'secondary'}
                        onPress={() => onChange(option.value)}
                        style={styles.styleButton}
                      />
                    ))}
                  </View>
                )}
              />
            </>
          ) : null}

          <View style={styles.actions}>
            {step > 0 ? <Button title="חזרה" variant="ghost" onPress={previousStep} /> : <View />}
            {step < 2 ? (
              <Button title="המשך" onPress={nextStep} />
            ) : (
              <Button title="כניסה לדמו" loading={loading} onPress={submitDemo} />
            )}
          </View>
        </Animated.View>

        <Link href="/(auth)/login" style={styles.link}>
          <Text style={styles.linkText}>יש לך כבר חשבון? להתחברות</Text>
        </Link>
      </ScreenScroll>
    </KeyboardAvoidingView>
  );
}

function SegmentedOptions<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmentBlock}>
      <Text style={styles.optionLabel}>{label}</Text>
      <View style={styles.segmentRow}>
        {options.map((option) => (
          <Button
            key={option.value}
            title={option.label}
            variant={value === option.value ? 'primary' : 'secondary'}
            onPress={() => onChange(option.value)}
            style={styles.segmentButton}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 22,
    paddingVertical: 30,
  },
  hero: {
    alignItems: 'flex-end',
    gap: 10,
  },
  brandChip: {
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFFC9',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  brandChipText: {
    color: theme.colors.coral,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: theme.colors.deep,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.muted,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 25,
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
    backgroundColor: '#F2DBED',
  },
  progressDotActive: {
    width: 54,
    backgroundColor: theme.colors.coral,
  },
  card: {
    gap: 18,
    padding: 24,
    borderRadius: 34,
    backgroundColor: '#FFF9FC',
    borderWidth: 1,
    borderColor: theme.colors.line,
    ...theme.shadow.card,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'right',
    writingDirection: 'rtl',
    color: theme.colors.deep,
  },
  stepBody: {
    color: theme.colors.muted,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 24,
  },
  segmentBlock: {
    gap: 10,
  },
  optionLabel: {
    color: theme.colors.deep,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  segmentRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  segmentButton: {
    minWidth: 92,
  },
  styleStack: {
    gap: 10,
  },
  styleButton: {
    justifyContent: 'flex-end',
  },
  actions: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  link: {
    alignSelf: 'center',
  },
  linkText: {
    color: theme.colors.teal,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
});
