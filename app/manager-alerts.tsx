import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ScreenScroll } from '@/components/ui/Screen';
import { theme } from '@/constants/theme';
import {
  subscribeToHomeBulletins,
  updateHomeBulletin,
  type HomeBulletin,
} from '@/services/bulletins.service';
import { updatePlayerSettings } from '@/services/players.service';
import { useAuthStore } from '@/stores/auth.store';

export default function ManagerAlertsScreen() {
  const profile = useAuthStore((state) => state.profile);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const [saving, setSaving] = useState(false);
  const [bulletins, setBulletins] = useState<HomeBulletin[]>([]);
  const [savingBulletinId, setSavingBulletinId] = useState<string | null>(null);
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

  const toggle = (key: keyof typeof settings) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
  };

  useEffect(() => {
    const unsubscribe = subscribeToHomeBulletins(
      (nextBulletins) => setBulletins(nextBulletins),
      (error) => Alert.alert('טעינת מודעות נכשלה', error.message),
    );

    return unsubscribe;
  }, []);

  const save = async () => {
    if (!profile?.uid) {
      return;
    }

    setSaving(true);
    try {
      await updatePlayerSettings(profile.uid, { notificationSettings: settings });
      await refreshProfile(profile.uid);
      Alert.alert('נשמר', 'העדפות ההתראות עודכנו.');
    } catch (error) {
      Alert.alert('שמירה נכשלה', error instanceof Error ? error.message : 'נסה שוב בעוד רגע.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenScroll contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>התראות ושליטה למנהלים</Text>
        <Text style={styles.subtitle}>מסך ראשון לניהול הודעות מערכת, מעגלים באזור, ומזג אוויר. כרגע זמין גם במצב דמו.</Text>
        <SettingRow
          label="מעגלים באיזורי"
          hint="קבל התראה כשנפתח מעגל בעיר או באזור שלך"
          value={settings.nearbyCircles}
          onValueChange={() => toggle('nearbyCircles')}
        />
        <SettingRow
          label="תזכורות לפני משחק"
          hint="התראה לפני שעת ההגעה למעגל"
          value={settings.circleReminders}
          onValueChange={() => toggle('circleReminders')}
        />
        <SettingRow
          label="הודעות צ׳אט"
          hint="התראות על הודעות חדשות במעגלים שלך"
          value={settings.chatMessages}
          onValueChange={() => toggle('chatMessages')}
        />
        <SettingRow
          label="הודעות מנהלים"
          hint="שדרי מערכת, סגירת מגרשים, עדכונים מיוחדים"
          value={settings.managerAnnouncements}
          onValueChange={() => toggle('managerAnnouncements')}
        />
        <SettingRow
          label="אזהרות מזג אוויר"
          hint="רוח חזקה, גשם, או ביטולי חוף"
          value={settings.weatherAlerts}
          onValueChange={() => toggle('weatherAlerts')}
        />
        <Button title="שמירת הגדרות" loading={saving} onPress={save} />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>שליטה על מודעות הבית</Text>
        <Text style={styles.subtitle}>
          כן. לאדמין יש עכשיו שליטה על המודעות שמופיעות במסך הבית: אפשר להפעיל, להסתיר ולעדכן טקסט בלי לגעת בקוד.
        </Text>
        {bulletins.map((bulletin) => (
          <View key={bulletin.id} style={styles.bulletinCard}>
            <View style={styles.bulletinToggleRow}>
              <Switch
                value={bulletin.active}
                onValueChange={async (value) => {
                  setSavingBulletinId(bulletin.id);
                  try {
                    await updateHomeBulletin(bulletin.id, { active: value });
                  } catch (error) {
                    Alert.alert('עדכון מודעה נכשל', error instanceof Error ? error.message : 'נסה שוב בעוד רגע.');
                  } finally {
                    setSavingBulletinId((current) => (current === bulletin.id ? null : current));
                  }
                }}
                trackColor={{ false: '#E8D7E8', true: '#F66A86' }}
                thumbColor="#FFFFFF"
              />
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>{bulletin.title}</Text>
                <Text style={styles.settingHint}>{bulletin.tag}</Text>
              </View>
            </View>

            <ManagerField
              label="כותרת"
              value={bulletin.title}
              onChangeText={(value) =>
                setBulletins((current) =>
                  current.map((item) => (item.id === bulletin.id ? { ...item, title: value } : item)),
                )
              }
            />
            <ManagerField
              label="תגית"
              value={bulletin.tag}
              onChangeText={(value) =>
                setBulletins((current) =>
                  current.map((item) => (item.id === bulletin.id ? { ...item, tag: value } : item)),
                )
              }
            />
            <ManagerField
              label="תוכן"
              value={bulletin.body}
              multiline
              onChangeText={(value) =>
                setBulletins((current) =>
                  current.map((item) => (item.id === bulletin.id ? { ...item, body: value } : item)),
                )
              }
            />
            <ManagerField
              label="טקסט כפתור"
              value={bulletin.ctaLabel}
              onChangeText={(value) =>
                setBulletins((current) =>
                  current.map((item) => (item.id === bulletin.id ? { ...item, ctaLabel: value } : item)),
                )
              }
            />

            <Button
              title="שמירת מודעה"
              loading={savingBulletinId === bulletin.id}
              onPress={async () => {
                setSavingBulletinId(bulletin.id);
                try {
                  await updateHomeBulletin(bulletin.id, {
                    title: bulletin.title.trim(),
                    tag: bulletin.tag.trim(),
                    body: bulletin.body.trim(),
                    ctaLabel: bulletin.ctaLabel.trim(),
                  });
                  Alert.alert('המודעה נשמרה', 'מסך הבית יתעדכן מיידית.');
                } catch (error) {
                  Alert.alert('שמירת מודעה נכשלה', error instanceof Error ? error.message : 'נסה שוב בעוד רגע.');
                } finally {
                  setSavingBulletinId((current) => (current === bulletin.id ? null : current));
                }
              }}
            />
          </View>
        ))}
      </View>
    </ScreenScroll>
  );
}

function ManagerField({
  label,
  value,
  onChangeText,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        textAlign="right"
        placeholderTextColor="#8C96A7"
        style={[styles.input, multiline && styles.inputMultiline]}
      />
    </View>
  );
}

function SettingRow({
  label,
  hint,
  value,
  onValueChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onValueChange: () => void;
}) {
  return (
    <View style={styles.settingRow}>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E8D7E8', true: '#F66A86' }}
        thumbColor="#FFFFFF"
      />
      <View style={styles.settingContent}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingHint}>{hint}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
  },
  card: {
    gap: 14,
    padding: 22,
    borderRadius: 32,
    backgroundColor: '#FFF9FC',
    borderWidth: 1,
    borderColor: theme.colors.line,
    ...theme.shadow.card,
  },
  title: {
    color: theme.colors.deep,
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    color: theme.colors.muted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  settingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 8,
  },
  bulletinCard: {
    gap: 10,
    padding: 14,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EED6E8',
  },
  bulletinToggleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 14,
  },
  settingContent: {
    flex: 1,
    gap: 4,
    alignItems: 'flex-end',
  },
  settingLabel: {
    color: theme.colors.deep,
    fontWeight: '900',
    writingDirection: 'rtl',
  },
  settingHint: {
    color: theme.colors.muted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    color: theme.colors.deep,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  input: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E3EDF7',
    backgroundColor: '#F7FBFF',
    paddingHorizontal: 14,
    color: theme.colors.deep,
    writingDirection: 'rtl',
  },
  inputMultiline: {
    minHeight: 90,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
});
