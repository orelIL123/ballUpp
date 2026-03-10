import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { LevelBadge } from '@/components/player/LevelBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenScroll } from '@/components/ui/Screen';
import { theme } from '@/constants/theme';
import { completeUserProfile } from '@/services/players.service';
import { useAuthStore } from '@/stores/auth.store';
import type { CourtType, Gender, PlayerLevel } from '@/types/models';

const LEVELS: PlayerLevel[] = ['beginner', 'intermediate', 'expert'];
const GENDERS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'אישה' },
  { value: 'male', label: 'גבר' },
  { value: 'other', label: 'אחר' },
];
const COURTS: CourtType[] = ['beach', 'asphalt', 'grass'];

const schema = z.object({
  displayName: z.string().min(2, 'יש להזין שם תצוגה.'),
  city: z.string().min(2, 'יש להזין עיר.'),
  area: z.string().min(2, 'יש להזין אזור.'),
  level: z.enum(['beginner', 'intermediate', 'expert']),
  gender: z.enum(['male', 'female', 'other']),
});

type OnboardingForm = z.infer<typeof schema>;

export default function OnboardingScreen() {
  const firebaseUser = useAuthStore((state) => state.firebaseUser);
  const profile = useAuthStore((state) => state.profile);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const isGuest = useAuthStore((state) => state.isGuest);
  const [photoUri, setPhotoUri] = useState<string | null>(profile?.photoURL ?? null);
  const [videoUri, setVideoUri] = useState<string | null>(profile?.videoURL ?? null);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OnboardingForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: profile?.displayName ?? '',
      city: profile?.city ?? '',
      area: profile?.location?.area ?? '',
      level: profile?.level ?? 'beginner',
      gender: profile?.gender ?? 'other',
    },
  });

  const currentLevel = watch('level');
  const currentGender = watch('gender');
  const [favoriteCourtTypes, setFavoriteCourtTypes] = useState<CourtType[]>(
    profile?.favoriteCourtTypes ?? ['beach'],
  );

  const pickMedia = async (kind: 'image' | 'video') => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('אין הרשאה', 'צריך לאשר גישה לגלריה כדי להעלות קובץ.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: kind === 'image' ? ['images'] : ['videos'],
      quality: 0.8,
      videoMaxDuration: 60,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    if (kind === 'image') {
      setPhotoUri(asset.uri);
    } else {
      setVideoUri(asset.uri);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!firebaseUser && !isGuest && !profile?.uid) {
      Alert.alert('אין משתמש מחובר', 'יש להתחבר מחדש.');
      return;
    }

    setLoading(true);
    try {
      await completeUserProfile({
        uid: firebaseUser?.uid ?? profile!.uid,
        email: firebaseUser?.email ?? profile?.email ?? null,
        displayName: values.displayName,
        city: values.city,
        area: values.area,
        level: values.level,
        gender: values.gender,
        favoriteCourtTypes,
        notificationSettings: profile?.notificationSettings,
        role: profile?.role,
        playStyle: profile?.playStyle,
        photoUri,
        videoUri,
        currentPhotoURL: profile?.photoURL,
        currentVideoURL: profile?.videoURL,
      });

      await refreshProfile(firebaseUser?.uid ?? profile?.uid);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('שמירה נכשלה', error instanceof Error ? error.message : 'לא הצלחנו לשמור את הפרופיל.');
    } finally {
      setLoading(false);
    }
  });

  return (
    <ScreenScroll contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>השלמת פרופיל</Text>
        <Text style={styles.subtitle}>עוד דקה ואתה בפנים עם פרופיל שנראה כמו שחקן שבא לשחק באמת.</Text>
        <Controller
          control={control}
          name="displayName"
          render={({ field: { onChange, value } }) => (
            <Input label="שם תצוגה" value={value} onChangeText={onChange} error={errors.displayName?.message} />
          )}
        />
        <Controller
          control={control}
          name="city"
          render={({ field: { onChange, value } }) => (
            <Input label="עיר" value={value} onChangeText={onChange} error={errors.city?.message} />
          )}
        />
        <Controller
          control={control}
          name="area"
          render={({ field: { onChange, value } }) => (
            <Input label="אזור / שכונה" value={value} onChangeText={onChange} error={errors.area?.message} />
          )}
        />
        <View style={styles.levelSection}>
          <Text style={styles.label}>מין</Text>
          <View style={styles.levelRow}>
            {GENDERS.map((opt) => (
              <Button
                key={opt.value}
                title={opt.label}
                variant={currentGender === opt.value ? 'primary' : 'secondary'}
                onPress={() => setValue('gender', opt.value)}
                style={styles.levelButton}
              />
            ))}
          </View>
          <Text style={styles.helper}>נדרש כדי להצטרף למעגלים של בנות בלבד או בנים בלבד</Text>
        </View>
        <View style={styles.levelSection}>
          <Text style={styles.label}>רמה</Text>
          <View style={styles.levelRow}>
            {LEVELS.map((level) => (
              <Button
                key={level}
                title={
                  level === 'beginner' ? 'מתחיל' : level === 'intermediate' ? 'בינוני' : 'מתקדם'
                }
                variant={currentLevel === level ? 'primary' : 'secondary'}
                onPress={() => setValue('level', level)}
                style={styles.levelButton}
              />
            ))}
          </View>
          {errors.level?.message ? <Text style={styles.error}>{errors.level.message}</Text> : null}
          <LevelBadge level={currentLevel} />
        </View>
        <View style={styles.levelSection}>
          <Text style={styles.label}>סוגי מגרש מועדפים</Text>
          <View style={styles.levelRow}>
            {COURTS.map((court) => {
              const selected = favoriteCourtTypes.includes(court);
              return (
                <Button
                  key={court}
                  title={court === 'beach' ? 'חוף' : court === 'asphalt' ? 'אספלט' : 'דשא'}
                  variant={selected ? 'primary' : 'secondary'}
                  onPress={() =>
                    setFavoriteCourtTypes((current) =>
                      selected ? current.filter((item) => item !== court) : [...current, court],
                    )
                  }
                  style={styles.levelButton}
                />
              );
            })}
          </View>
        </View>
        <View style={styles.mediaBlock}>
          <Text style={styles.label}>תמונת פרופיל</Text>
          {photoUri ? <Image source={{ uri: photoUri }} style={styles.imagePreview} /> : null}
          <Button title="בחירת תמונה" variant="secondary" onPress={() => pickMedia('image')} />
        </View>
        <View style={styles.mediaBlock}>
          <Text style={styles.label}>וידאו ביצועים (אופציונלי)</Text>
          <Text style={styles.helper}>{videoUri ? 'וידאו נבחר ומוכן להעלאה.' : 'אפשר להעלות סרטון עד 60 שניות.'}</Text>
          <Button title="בחירת וידאו" variant="secondary" onPress={() => pickMedia('video')} />
        </View>
        <Button title="שמירת פרופיל" loading={loading} onPress={onSubmit} />
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
  },
  card: {
    gap: 18,
    padding: 22,
    borderRadius: 32,
    backgroundColor: '#FFF9F0',
    borderWidth: 1,
    borderColor: theme.colors.line,
    ...theme.shadow.card,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'right',
    writingDirection: 'rtl',
    color: theme.colors.deep,
  },
  subtitle: {
    color: theme.colors.muted,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 24,
  },
  label: {
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
    color: theme.colors.deep,
  },
  levelSection: {
    gap: 12,
    alignItems: 'flex-end',
  },
  levelRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  levelButton: {
    minWidth: 96,
  },
  mediaBlock: {
    gap: 10,
    alignItems: 'flex-end',
  },
  imagePreview: {
    width: 112,
    height: 112,
    borderRadius: 20,
    alignSelf: 'flex-end',
  },
  helper: {
    color: theme.colors.muted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  error: {
    color: theme.colors.danger,
  },
});
