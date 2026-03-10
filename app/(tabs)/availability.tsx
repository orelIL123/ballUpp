import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';
import { updatePlayerSettings } from '@/services/players.service';
import { useAuthStore } from '@/stores/auth.store';
import { useCirclesStore } from '@/stores/circles.store';

const DAY_OPTIONS = [
  { key: 'sun', label: 'א׳' },
  { key: 'mon', label: 'ב׳' },
  { key: 'tue', label: 'ג׳' },
  { key: 'wed', label: 'ד׳' },
  { key: 'thu', label: 'ה׳' },
  { key: 'fri', label: 'ו׳' },
  { key: 'sat', label: 'ש׳' },
] as const;

export default function AvailabilityScreen() {
  const profile = useAuthStore((state) => state.profile);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const circles = useCirclesStore((state) => state.circles);
  const [saving, setSaving] = useState(false);
  const [customArea, setCustomArea] = useState('');
  const [settings, setSettings] = useState(
    profile?.notificationSettings ?? {
      nearbyCircles: true,
      circleReminders: true,
      chatMessages: true,
      managerAnnouncements: true,
      weatherAlerts: false,
      urgentCircles: true,
      soundsEnabled: true,
      badgesEnabled: true,
      selectedAreas: [],
      activeDays: ['sun', 'mon', 'tue', 'wed', 'thu'],
      timeFrom: '17:00',
      timeTo: '22:00',
    },
  );

  useEffect(() => {
    if (profile?.notificationSettings) {
      setSettings(profile.notificationSettings);
    }
  }, [profile?.notificationSettings]);

  const suggestedAreas = Array.from(
    new Set(
      [
        profile?.location?.area,
        ...circles.map((circle) => circle.area),
      ].filter((item): item is string => Boolean(item && item.trim())),
    ),
  ).slice(0, 10);

  const toggleArea = (area: string) => {
    setSettings((current) => ({
      ...current,
      selectedAreas: current.selectedAreas.includes(area)
        ? current.selectedAreas.filter((item) => item !== area)
        : [...current.selectedAreas, area],
    }));
  };

  const toggleDay = (day: string) => {
    setSettings((current) => ({
      ...current,
      activeDays: current.activeDays.includes(day)
        ? current.activeDays.filter((item) => item !== day)
        : [...current.activeDays, day],
    }));
  };

  const addCustomArea = () => {
    const next = customArea.trim();
    if (!next) {
      return;
    }

    if (!settings.selectedAreas.includes(next)) {
      setSettings((current) => ({
        ...current,
        selectedAreas: [...current.selectedAreas, next],
      }));
    }
    setCustomArea('');
  };

  const save = async () => {
    if (!profile?.uid) {
      return;
    }

    setSaving(true);
    try {
      await updatePlayerSettings(profile.uid, { notificationSettings: settings });
      await refreshProfile(profile.uid);
      Alert.alert('נשמר', 'העדפות הזמינות וההתראות עודכנו.');
    } catch (error) {
      Alert.alert('שמירה נכשלה', error instanceof Error ? error.message : 'נסה שוב בעוד רגע.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.title}>התראות לפי זמינות</Text>
        <Text style={styles.subtitle}>
          בוחרים איפה, מתי ובאילו ימים תרצה לקבל התראות על מעגלים חדשים באזור שלך.
        </Text>
      </View>

      <View style={styles.card}>
        <SettingRow
          label="התראות על מעגלים באזור"
          hint="הפעל רק אם אתה רוצה לקבל push על מעגלים חדשים לפי ההתאמות למטה"
          value={settings.nearbyCircles}
          onToggle={() => setSettings((current) => ({ ...current, nearbyCircles: !current.nearbyCircles }))}
        />

        <View style={styles.block}>
          <Text style={styles.blockTitle}>חופים, שכונות ואזורים ספציפיים</Text>
          <View style={styles.chipsWrap}>
            {suggestedAreas.map((area) => {
              const active = settings.selectedAreas.includes(area);
              return (
                <Pressable
                  key={area}
                  onPress={() => toggleArea(area)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{area}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.customRow}>
            <Button title="הוספה" onPress={addCustomArea} style={styles.addButton} />
            <TextInput
              value={customArea}
              onChangeText={setCustomArea}
              placeholder="להוסיף איזור ידנית"
              placeholderTextColor="#8C96A7"
              style={styles.input}
              textAlign="right"
            />
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>באילו ימים?</Text>
          <View style={styles.daysRow}>
            {DAY_OPTIONS.map((day) => {
              const active = settings.activeDays.includes(day.key);
              return (
                <Pressable
                  key={day.key}
                  onPress={() => toggleDay(day.key)}
                  style={[styles.dayChip, active && styles.dayChipActive]}
                >
                  <Text style={[styles.dayText, active && styles.dayTextActive]}>{day.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>טווח שעות</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={styles.timeLabel}>עד</Text>
              <TextInput
                value={settings.timeTo}
                onChangeText={(value) => setSettings((current) => ({ ...current, timeTo: value }))}
                placeholder="22:00"
                placeholderTextColor="#8C96A7"
                style={styles.input}
                textAlign="center"
              />
            </View>
            <View style={styles.timeField}>
              <Text style={styles.timeLabel}>מ־</Text>
              <TextInput
                value={settings.timeFrom}
                onChangeText={(value) => setSettings((current) => ({ ...current, timeFrom: value }))}
                placeholder="17:00"
                placeholderTextColor="#8C96A7"
                style={styles.input}
                textAlign="center"
              />
            </View>
          </View>
        </View>

        <Button title="שמירת זמינות" loading={saving} onPress={save} />
      </View>
    </ScrollView>
  );
}

function SettingRow({
  label,
  hint,
  value,
  onToggle,
}: {
  label: string;
  hint: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable onPress={onToggle} style={[styles.settingRow, value && styles.settingRowActive]}>
      <View style={[styles.toggle, value && styles.toggleActive]} />
      <View style={styles.settingText}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingHint}>{hint}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 120,
    gap: 16,
  },
  hero: {
    gap: 8,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: theme.colors.deep,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    color: '#5F7288',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 24,
  },
  card: {
    gap: 16,
    padding: 18,
    borderRadius: 30,
    backgroundColor: '#FFFFFFC8',
    borderWidth: 1,
    borderColor: '#FFFFFFA0',
    ...theme.shadow.card,
  },
  settingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: '#F7FBFF',
    borderWidth: 1,
    borderColor: '#E3EDF7',
  },
  settingRowActive: {
    backgroundColor: '#EAF6FF',
    borderColor: '#B9DFFF',
  },
  toggle: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#C9D5E3',
    backgroundColor: '#FFFFFF',
  },
  toggleActive: {
    backgroundColor: '#F36718',
    borderColor: '#F36718',
  },
  settingText: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  settingLabel: {
    color: theme.colors.deep,
    fontWeight: '900',
    writingDirection: 'rtl',
  },
  settingHint: {
    color: '#6D7F93',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  block: {
    gap: 10,
  },
  blockTitle: {
    color: '#F36718',
    fontWeight: '900',
    fontSize: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  chipsWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#F5F8FC',
    borderWidth: 1,
    borderColor: '#E3EAF3',
  },
  chipActive: {
    backgroundColor: '#F36718',
    borderColor: '#F36718',
  },
  chipText: {
    color: '#32445A',
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  customRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    alignItems: 'center',
  },
  addButton: {
    minWidth: 90,
  },
  input: {
    flex: 1,
    minHeight: 50,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E3EAF3',
    backgroundColor: '#FFFFFFE6',
    color: '#23364D',
    paddingHorizontal: 14,
  },
  daysRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayChip: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: '#F5F8FC',
    borderWidth: 1,
    borderColor: '#E3EAF3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipActive: {
    backgroundColor: '#6A2B79',
    borderColor: '#6A2B79',
  },
  dayText: {
    color: '#32445A',
    fontWeight: '900',
    writingDirection: 'rtl',
  },
  dayTextActive: {
    color: '#FFFFFF',
  },
  timeRow: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  timeField: {
    flex: 1,
    gap: 6,
    alignItems: 'flex-end',
  },
  timeLabel: {
    color: theme.colors.deep,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
});
