import { zodResolver } from '@hookform/resolvers/zod';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';
import { createCircle } from '@/services/circles.service';
import { useAuthStore } from '@/stores/auth.store';
import type { CircleGenderRestriction, CircleRequiredLevel, CourtType } from '@/types/models';

const LEVELS: CircleRequiredLevel[] = ['any', 'beginner', 'intermediate', 'expert'];
const GENDER_OPTIONS: { value: CircleGenderRestriction; label: string }[] = [
  { value: 'any', label: 'כולם' },
  { value: 'female', label: 'בנות בלבד' },
  { value: 'male', label: 'בנים בלבד' },
];
const COURTS: CourtType[] = ['beach', 'asphalt', 'grass'];
const MISSING_OPTIONS = [1, 2, 3, 4, 5] as const;

const schema = z.object({
  title: z.string().min(3, 'יש להזין כותרת.'),
  locationName: z.string().min(3, 'יש להזין מיקום.'),
  city: z.string().min(2, 'יש להזין עיר.'),
  area: z.string().min(2, 'יש להזין אזור.'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'פורמט תאריך: YYYY-MM-DD'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'פורמט שעה: HH:mm'),
  maxPlayers: z.number().min(2).max(12),
  courtType: z.enum(['beach', 'asphalt', 'grass']),
  requiredLevel: z.enum(['any', 'beginner', 'intermediate', 'expert']),
  genderRestriction: z.enum(['any', 'female', 'male']),
});

type CreateCircleForm = z.infer<typeof schema>;

export default function CreateCircleScreen() {
  const profile = useAuthStore((state) => state.profile);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [circleType, setCircleType] = useState<'footchibol' | 'fuchivoli'>('footchibol');
  const [currentPlayers, setCurrentPlayers] = useState(3);
  const [missingPlayers, setMissingPlayers] = useState(1);
  const [isUrgent, setIsUrgent] = useState(false);
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateCircleForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: 'מעגל ערב',
      locationName: 'חוף גורדון',
      city: profile?.location?.city ?? profile?.city ?? 'תל אביב',
      area: profile?.location?.area ?? 'חוף',
      date: '',
      time: '',
      maxPlayers: 4,
      courtType: 'beach',
      requiredLevel: 'any',
      genderRestriction: 'any',
    },
  });

  const selectedLevel = watch('requiredLevel');
  const selectedCourt = watch('courtType');
  const selectedGenderRestriction = watch('genderRestriction');
  const locationName = watch('locationName');
  const city = watch('city');

  const totalPlayers = useMemo(() => {
    return Math.max(2, Math.min(12, currentPlayers + missingPlayers));
  }, [currentPlayers, missingPlayers]);

  useEffect(() => {
    setValue('maxPlayers', totalPlayers, { shouldValidate: true });
  }, [setValue, totalPlayers]);

  const useCurrentLocation = async () => {
    try {
      setLocating(true);
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        Alert.alert('אין הרשאת מיקום', 'כדי להשתמש במיקום נוכחי צריך לאשר גישה למיקום.');
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const place = await Location.reverseGeocodeAsync({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });

      const first = place[0];
      const nextCity = first?.city || first?.subregion || city || 'האזור שלי';
      const nextArea = first?.district || first?.street || first?.name || 'מיקום נוכחי';
      const nextLocation = first?.street || first?.name || 'מיקום נוכחי';

      setCoordinates({
        lat: current.coords.latitude,
        lng: current.coords.longitude,
      });
      setValue('city', nextCity, { shouldValidate: true });
      setValue('area', nextArea, { shouldValidate: true });
      setValue('locationName', nextLocation, { shouldValidate: true });
    } catch (error) {
      Alert.alert('מיקום נוכחי לא זמין', error instanceof Error ? error.message : 'נסה שוב בעוד רגע.');
    } finally {
      setLocating(false);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!profile?.uid) {
      Alert.alert('אין משתמש מחובר', 'יש להתחבר מחדש.');
      return;
    }

    if (circleType === 'fuchivoli') {
      Alert.alert('בקרוב', "מצב פוצ'יוולי ייפתח בגרסה הבאה.");
      return;
    }

    setLoading(true);
    try {
      const circleId = await createCircle({
        ...values,
        creatorId: profile.uid,
        creatorName: profile.displayName,
        creatorPhotoURL: profile.photoURL,
        isUrgent,
        lat: coordinates.lat,
        lng: coordinates.lng,
      });
      router.replace(`/circle/${circleId}`);
    } catch (error) {
      Alert.alert('יצירת מעגל נכשלה', error instanceof Error ? error.message : 'נסה שוב בעוד רגע.');
    } finally {
      setLoading(false);
    }
  });

  return (
    <LinearGradient colors={['#D9F0FF', '#B7E0FF', '#F9E5D7', '#FFF8F2']} style={styles.root}>
      <View style={[styles.glow, styles.glowBlue]} />
      <View style={[styles.glow, styles.glowSun]} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.navBtn}>
            <SymbolView name="arrow.right" size={24} tintColor={theme.colors.deep} />
          </Pressable>
          <Text style={styles.title}>יצירת מעגל חברים</Text>
          <Pressable
            onPress={() => Alert.alert('התראות', 'כאן יוצגו התראות על פתיחות ועדכוני מעגלים.')}
            style={styles.navBtn}
          >
            <SymbolView name="bell.fill" size={18} tintColor="#EF6A1A" />
          </Pressable>
        </View>

        <BlurView intensity={42} tint="light" style={styles.panel}>
          <View style={styles.typeGrid}>
            <Pressable
              onPress={() => setCircleType('footchibol')}
              style={[styles.typeCard, circleType === 'footchibol' && styles.typeCardActive]}
            >
              <View style={[styles.typeIcon, styles.typeIconOrange]}>
                <SymbolView name="circle.grid.2x2.fill" size={24} tintColor="#FFFFFF" />
              </View>
              <Text style={[styles.typeText, circleType === 'footchibol' && styles.typeTextActive]}>מעגל הקפצות</Text>
            </Pressable>

            <Pressable
              onPress={() => setCircleType('fuchivoli')}
              style={[styles.typeCard, styles.typeCardMuted, circleType === 'fuchivoli' && styles.typeCardActive]}
            >
              <View style={[styles.typeIcon, styles.typeIconMuted]}>
                <SymbolView name="square.grid.2x2.fill" size={22} tintColor="#8094AF" />
              </View>
              <Text style={[styles.typeText, styles.typeTextMuted, circleType === 'fuchivoli' && styles.typeTextActive]}>
                פוצ'יוולי (בקרוב)
              </Text>
            </Pressable>
          </View>
        </BlurView>

        <View style={styles.sectionTopRow}>
          <Text style={styles.sectionLabel}>איפה נפגשים?</Text>
          <Pressable onPress={useCurrentLocation} style={styles.locationAction}>
            <SymbolView name="location.fill" size={14} tintColor="#EF6A1A" />
            <Text style={styles.locationActionText}>{locating ? 'מאתר...' : 'מיקום נוכחי'}</Text>
          </Pressable>
        </View>

        <BlurView intensity={36} tint="light" style={styles.mapCard}>
          <LinearGradient colors={['#89C8EC', '#B6E3FF', '#F3D9BE']} style={styles.mapMock}>
            <View style={styles.locationPill}>
              <SymbolView name="mappin.and.ellipse" size={14} tintColor="#EF6A1A" />
              <Text style={styles.locationPillText}>
                {locationName || 'מיקום'}, {city || 'עיר'}
              </Text>
            </View>
          </LinearGradient>
        </BlurView>

        <View style={styles.grid2}>
          <Controller
            control={control}
            name="locationName"
            render={({ field: { onChange, value } }) => (
              <Field label="מיקום" value={value} onChangeText={onChange} placeholder="חוף גורדון" error={errors.locationName?.message} />
            )}
          />
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, value } }) => (
              <Field label="שם המעגל" value={value} onChangeText={onChange} placeholder="מעגל ערב" error={errors.title?.message} />
            )}
          />
        </View>

        <View style={styles.grid2}>
          <Controller
            control={control}
            name="city"
            render={({ field: { onChange, value } }) => (
              <Field label="עיר" value={value} onChangeText={onChange} placeholder="תל אביב" error={errors.city?.message} />
            )}
          />
          <Controller
            control={control}
            name="area"
            render={({ field: { onChange, value } }) => (
              <Field label="אזור" value={value} onChangeText={onChange} placeholder="חוף" error={errors.area?.message} />
            )}
          />
        </View>

        <View style={styles.grid2}>
          <Controller
            control={control}
            name="date"
            render={({ field: { onChange, value } }) => (
              <Field label="תאריך" value={value} onChangeText={onChange} placeholder="2026-03-10" error={errors.date?.message} />
            )}
          />
          <Controller
            control={control}
            name="time"
            render={({ field: { onChange, value } }) => (
              <Field label="שעה" value={value} onChangeText={onChange} placeholder="18:30" error={errors.time?.message} />
            )}
          />
        </View>

        <BlurView intensity={42} tint="light" style={styles.counterCard}>
          <View style={styles.counterBlock}>
            <View style={styles.counterInfo}>
              <Text style={styles.counterHeading}>כמה אנחנו?</Text>
              <Text style={styles.counterSubheading}>שחקנים שכבר נמצאים</Text>
            </View>
            <View style={styles.counterRow}>
              <Pressable style={[styles.counterBtn, styles.counterBtnAccent]} onPress={() => setCurrentPlayers((prev) => Math.min(8, prev + 1))}>
                <Text style={styles.counterBtnAccentText}>+</Text>
              </Pressable>
              <View style={styles.counterCenter}>
                <Text style={styles.counterCenterText}>{currentPlayers}</Text>
              </View>
              <Pressable style={styles.counterBtn} onPress={() => setCurrentPlayers((prev) => Math.max(1, prev - 1))}>
                <Text style={styles.counterBtnText}>-</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.counterBlock}>
            <View style={styles.counterInfo}>
              <Text style={styles.counterHeading}>כמה חסרים?</Text>
              <Text style={styles.counterSubheading}>לסגירת המעגל המלא</Text>
            </View>
            <View style={styles.counterRow}>
              <Pressable style={[styles.counterBtn, styles.counterBtnPurple]} onPress={() => setMissingPlayers((prev) => Math.min(5, prev + 1))}>
                <Text style={styles.counterBtnAccentText}>+</Text>
              </Pressable>
              <View style={styles.counterCenter}>
                <Text style={styles.counterCenterText}>{missingPlayers}</Text>
              </View>
              <Pressable style={styles.counterBtn} onPress={() => setMissingPlayers((prev) => Math.max(1, prev - 1))}>
                <Text style={styles.counterBtnText}>-</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.quickLabel}>בחירה מהירה לחסרים</Text>
          <View style={styles.missingRow}>
            {MISSING_OPTIONS.map((count) => (
              <Pressable
                key={count}
                onPress={() => setMissingPlayers(count)}
                style={[styles.missingChip, missingPlayers === count && styles.missingChipActive]}
              >
                <Text style={[styles.missingChipText, missingPlayers === count && styles.missingChipTextActive]}>
                  {count === 5 ? '+5' : count}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.totalText}>סה"כ שחקנים במעגל: {totalPlayers}</Text>
        </BlurView>

        <BlurView intensity={42} tint="light" style={styles.panel}>
          <Pressable onPress={() => setIsUrgent((prev) => !prev)} style={[styles.urgentToggle, isUrgent && styles.urgentToggleActive]}>
            <View style={styles.urgentTextWrap}>
              <Text style={styles.urgentTitle}>דחיפות</Text>
              <Text style={styles.urgentBody}>
                כאשר הדחיפות פעילה, נציג למטה את מי שפתח את המעגל עם תמונה ושם.
              </Text>
            </View>
            <View style={[styles.toggleKnob, isUrgent && styles.toggleKnobActive]}>
              <SymbolView name={isUrgent ? 'flame.fill' : 'clock'} size={16} tintColor={isUrgent ? '#FFFFFF' : '#EF6A1A'} />
            </View>
          </Pressable>

          {isUrgent ? (
            <View style={styles.creatorPreview}>
              <View style={styles.creatorPreviewText}>
                <Text style={styles.creatorPreviewLabel}>מי פתח את המעגל</Text>
                <Text style={styles.creatorPreviewName}>{profile?.displayName || 'שחקן'}</Text>
              </View>
              <Avatar uri={profile?.photoURL} name={profile?.displayName || 'שחקן'} size={44} />
            </View>
          ) : null}
        </BlurView>

        <View style={styles.optionBlock}>
          <Text style={styles.optionLabel}>סוג מגרש</Text>
          <View style={styles.optionRow}>
            {COURTS.map((court) => (
              <Button
                key={court}
                title={court === 'beach' ? 'חוף' : court === 'asphalt' ? 'אספלט' : 'דשא'}
                variant={selectedCourt === court ? 'primary' : 'secondary'}
                onPress={() => setValue('courtType', court)}
                style={styles.optionBtn}
              />
            ))}
          </View>
        </View>

        <View style={styles.optionBlock}>
          <Text style={styles.optionLabel}>הרכב המעגל</Text>
          <View style={styles.optionRow}>
            {GENDER_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                title={opt.label}
                variant={selectedGenderRestriction === opt.value ? 'primary' : 'secondary'}
                onPress={() => setValue('genderRestriction', opt.value)}
                style={styles.optionBtn}
              />
            ))}
          </View>
        </View>

        <View style={styles.optionBlock}>
          <Text style={styles.optionLabel}>רמה נדרשת</Text>
          <View style={styles.optionRow}>
            {LEVELS.map((level) => (
              <Button
                key={level}
                title={level === 'any' ? 'הכל' : level === 'beginner' ? 'מתחיל' : level === 'intermediate' ? 'בינוני' : 'מתקדם'}
                variant={selectedLevel === level ? 'primary' : 'secondary'}
                onPress={() => setValue('requiredLevel', level)}
                style={styles.optionBtn}
              />
            ))}
          </View>
        </View>

        <Button title="פתיחת מעגל עכשיו" loading={loading} onPress={onSubmit} style={styles.submitBtn} />
      </ScrollView>
    </LinearGradient>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  error?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8B97A8"
        style={styles.fieldInput}
        textAlign="right"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.45,
  },
  glowBlue: {
    width: 320,
    height: 320,
    top: -90,
    left: -60,
    backgroundColor: '#92D7FF',
  },
  glowSun: {
    width: 360,
    height: 260,
    bottom: -90,
    right: -80,
    backgroundColor: '#FFD1A9',
  },
  container: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 130,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  navBtn: {
    width: 46,
    height: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FFFFFF82',
    backgroundColor: '#FFFFFF55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#14253A',
    fontSize: 33,
    fontWeight: '900',
    writingDirection: 'rtl',
  },
  panel: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#FFFFFF88',
    overflow: 'hidden',
    padding: 14,
    backgroundColor: '#FFFFFF28',
  },
  typeGrid: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  typeCard: {
    flex: 1,
    minHeight: 94,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#FFFFFF8A',
    backgroundColor: '#FFFFFF82',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  typeCardActive: {
    backgroundColor: '#F36618',
    borderColor: '#F36618',
    shadowColor: '#F36618',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 7,
  },
  typeCardMuted: {
    backgroundColor: '#FFFFFF5E',
  },
  typeIcon: {
    width: 46,
    height: 46,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconOrange: {
    backgroundColor: '#F58648',
  },
  typeIconMuted: {
    backgroundColor: '#E9EFF6',
  },
  typeText: {
    color: '#23354B',
    fontSize: 16,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  typeTextActive: {
    color: '#FFFFFF',
  },
  typeTextMuted: {
    color: '#7A8699',
  },
  sectionTopRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    color: '#EF6A1A',
    fontSize: 27,
    fontWeight: '900',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  locationAction: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF8A',
    borderWidth: 1,
    borderColor: '#FFFFFFA2',
  },
  locationActionText: {
    color: '#EF6A1A',
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  mapCard: {
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFFFFF88',
  },
  mapMock: {
    aspectRatio: 21 / 9,
    justifyContent: 'flex-end',
    padding: 12,
  },
  locationPill: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFFE8',
    borderWidth: 1,
    borderColor: '#E8EEF7',
  },
  locationPillText: {
    color: '#1A2A41',
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  grid2: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  fieldWrap: {
    flex: 1,
    gap: 6,
  },
  fieldLabel: {
    color: '#EF6A1A',
    fontWeight: '800',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  fieldInput: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5EBF4',
    backgroundColor: '#FFFFFFE8',
    color: '#26364A',
    paddingHorizontal: 14,
  },
  errorText: {
    color: '#C94A3E',
    fontSize: 12,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  counterCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#FFFFFF88',
    padding: 16,
    gap: 14,
    backgroundColor: '#FFFFFF2D',
    overflow: 'hidden',
  },
  counterBlock: {
    gap: 10,
  },
  counterInfo: {
    alignItems: 'flex-end',
  },
  counterHeading: {
    color: '#16263D',
    fontSize: 19,
    fontWeight: '900',
    writingDirection: 'rtl',
  },
  counterSubheading: {
    color: '#8190A5',
    fontSize: 13,
    writingDirection: 'rtl',
  },
  counterRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  counterBtn: {
    width: 66,
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E7EF',
    backgroundColor: '#FFFFFFD6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnAccent: {
    backgroundColor: '#F36618',
    borderColor: '#F36618',
  },
  counterBtnPurple: {
    backgroundColor: '#642A76',
    borderColor: '#642A76',
  },
  counterBtnText: {
    color: '#22344A',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '800',
  },
  counterBtnAccentText: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '800',
  },
  counterCenter: {
    flex: 1,
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E7EF',
    backgroundColor: '#F2F5FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterCenterText: {
    color: '#16263D',
    fontSize: 32,
    fontWeight: '900',
  },
  quickLabel: {
    color: '#51647C',
    textAlign: 'right',
    writingDirection: 'rtl',
    fontWeight: '700',
  },
  missingRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 8,
  },
  missingChip: {
    width: 52,
    height: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F1C0A1',
    backgroundColor: '#FFFFFFBF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingChipActive: {
    backgroundColor: '#F36618',
    borderColor: '#F36618',
  },
  missingChipText: {
    color: '#F07B35',
    fontSize: 22,
    fontWeight: '800',
  },
  missingChipTextActive: {
    color: '#FFFFFF',
  },
  totalText: {
    color: '#6A7890',
    textAlign: 'center',
    writingDirection: 'rtl',
    fontSize: 15,
    fontWeight: '600',
  },
  urgentToggle: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    padding: 14,
    borderRadius: 22,
    backgroundColor: '#FFFFFF96',
    borderWidth: 1,
    borderColor: '#FFFFFFAA',
  },
  urgentToggleActive: {
    backgroundColor: '#FFE3D0',
    borderColor: '#F8B38B',
  },
  urgentTextWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  urgentTitle: {
    color: '#16263D',
    fontSize: 18,
    fontWeight: '900',
    writingDirection: 'rtl',
  },
  urgentBody: {
    color: '#6F7E91',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  toggleKnob: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3C3A3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleKnobActive: {
    backgroundColor: '#EF6A1A',
    borderColor: '#EF6A1A',
  },
  creatorPreview: {
    marginTop: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFFA8',
  },
  creatorPreviewText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  creatorPreviewLabel: {
    color: '#7E8EA2',
    fontSize: 12,
    writingDirection: 'rtl',
  },
  creatorPreviewName: {
    color: '#16263D',
    fontSize: 15,
    fontWeight: '900',
    writingDirection: 'rtl',
  },
  optionBlock: {
    gap: 10,
  },
  optionLabel: {
    color: '#EF6A1A',
    fontWeight: '800',
    fontSize: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  optionRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionBtn: {
    minWidth: 92,
  },
  submitBtn: {
    minHeight: 62,
    borderRadius: 22,
    backgroundColor: '#F25F13',
    borderColor: '#D74E00',
    marginTop: 6,
    shadowColor: '#F56B1B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 9,
  },
});
