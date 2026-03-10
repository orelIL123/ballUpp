import { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ScreenScroll } from '@/components/ui/Screen';
import { theme } from '@/constants/theme';
import { updatePlayerSettings } from '@/services/players.service';
import { useAuthStore } from '@/stores/auth.store';

export default function ManagerAlertsScreen() {
  const profile = useAuthStore((state) => state.profile);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const [saving, setSaving] = useState(false);
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
    </ScreenScroll>
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
});
