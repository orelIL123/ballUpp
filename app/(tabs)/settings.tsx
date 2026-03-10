import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';
import {
  getNotificationPermissionStatusAsync,
  registerForPushNotificationsAsync,
} from '@/services/notifications.service';
import { updatePlayerSettings } from '@/services/players.service';
import { useAuthStore } from '@/stores/auth.store';

export default function SettingsScreen() {
  const profile = useAuthStore((state) => state.profile);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const [saving, setSaving] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [registering, setRegistering] = useState(false);
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

  useEffect(() => {
    getNotificationPermissionStatusAsync()
      .then((status) => setPermissionStatus(status))
      .catch(() => setPermissionStatus('undetermined'));
  }, []);

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
      Alert.alert('נשמר', 'הגדרות ההתראות עודכנו.');
    } catch (error) {
      Alert.alert('שמירה נכשלה', error instanceof Error ? error.message : 'נסה שוב בעוד רגע.');
    } finally {
      setSaving(false);
    }
  };

  const enableNotifications = async () => {
    if (!profile?.uid) {
      return;
    }

    setRegistering(true);
    try {
      const result = await registerForPushNotificationsAsync();
      setPermissionStatus(result.status);

      if (result.status !== 'granted') {
        Alert.alert('התראות לא הופעלו', result.message ?? 'המשתמש לא אישר התראות.');
        return;
      }

      await updatePlayerSettings(profile.uid, {
        notificationSettings: settings,
        fcmToken: result.token ?? '',
      });
      await refreshProfile(profile.uid);
      Alert.alert('התראות הופעלו', 'האפליקציה מוכנה לקבלת התראות במכשיר הזה.');
    } catch (error) {
      Alert.alert('הפעלה נכשלה', error instanceof Error ? error.message : 'נסה שוב בעוד רגע.');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.title}>הגדרות והתראות</Text>
        <Text style={styles.subtitle}>
          כאן מגדירים בדיוק אילו התראות נשלח, מתי נשלח אותן, ואיך המשתמש יוכל לשלוט בהן מתוך האפליקציה.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>הרשאות מערכת</Text>
        <Text style={styles.sectionBody}>
          כדי לעמוד טוב יותר בדרישות App Store, המשתמש צריך להבין למה הוא מקבל התראות ולקבל שליטה פשוטה לבטל או לשנות אותן בכל רגע.
        </Text>
        <View style={styles.permissionBox}>
          <Text style={styles.permissionLabel}>סטטוס התראות</Text>
          <Text style={styles.permissionValue}>
            {permissionStatus === 'granted'
              ? 'מאושר'
              : permissionStatus === 'denied'
                ? 'חסום'
                : 'עוד לא אושר'}
          </Text>
        </View>
        <Button title="הפעלת התראות במכשיר" loading={registering} onPress={enableNotifications} />
        <Button title="פתיחת הגדרות המכשיר" variant="secondary" onPress={() => Linking.openSettings()} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>מה נשלח?</Text>
        <SettingRow
          label="מעגלים חדשים באיזור"
          hint="רק כאשר יש התאמה לאיזורים ולשעות שבחרת במסך הזמינות"
          value={settings.nearbyCircles}
          onToggle={() => toggle('nearbyCircles')}
        />
        <SettingRow
          label="מעגלים דחופים"
          hint="דחיפה גבוהה יותר כאשר מישהו פתח מעגל דחוף"
          value={settings.urgentCircles}
          onToggle={() => toggle('urgentCircles')}
        />
        <SettingRow
          label="תזכורות לפני משחק"
          hint="תזכורת לפני מעגל שהצטרפת אליו"
          value={settings.circleReminders}
          onToggle={() => toggle('circleReminders')}
        />
        <SettingRow
          label="הודעות צ׳אט"
          hint="כאשר יש הודעה חדשה במעגלים שלך"
          value={settings.chatMessages}
          onToggle={() => toggle('chatMessages')}
        />
        <SettingRow
          label="הודעות מערכת ומנהלים"
          hint="שינויים חשובים, סגירת מגרשים, ועדכוני תפעול"
          value={settings.managerAnnouncements}
          onToggle={() => toggle('managerAnnouncements')}
        />
        <SettingRow
          label="מזג אוויר וביטולים"
          hint="התראות על רוח חזקה, גשם או ביטול חוף"
          value={settings.weatherAlerts}
          onToggle={() => toggle('weatherAlerts')}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>איך נשלח?</Text>
        <SettingRow
          label="צליל"
          hint="כאשר Push פעיל, אפשר להשמיע גם צליל"
          value={settings.soundsEnabled}
          onToggle={() => toggle('soundsEnabled')}
        />
        <SettingRow
          label="Badge על האייקון"
          hint="מונה על אייקון האפליקציה כאשר יש עדכונים שלא נקראו"
          value={settings.badgesEnabled}
          onToggle={() => toggle('badgesEnabled')}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>הכנה ל-Firebase</Text>
        <Text style={styles.sectionBody}>
          המסכים כבר שומרים את העדפות ההתראות בפרופיל המשתמש. כשנחבר Firebase Cloud Messaging נוסיף בקשת הרשאה בזמן הנכון ונשלח רק הודעות לפי ההגדרות האלה.
        </Text>
        <Button title="שמירת הגדרות" loading={saving} onPress={save} />
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
    color: theme.colors.deep,
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    color: '#65798F',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 24,
  },
  card: {
    gap: 14,
    padding: 18,
    borderRadius: 30,
    backgroundColor: '#FFFFFFC8',
    borderWidth: 1,
    borderColor: '#FFFFFFA0',
    ...theme.shadow.card,
  },
  permissionBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#F7FBFF',
    borderWidth: 1,
    borderColor: '#E3EDF7',
  },
  permissionLabel: {
    color: theme.colors.deep,
    fontWeight: '900',
    writingDirection: 'rtl',
  },
  permissionValue: {
    color: '#F36718',
    fontWeight: '900',
    writingDirection: 'rtl',
  },
  sectionTitle: {
    color: '#F36718',
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sectionBody: {
    color: '#65798F',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 22,
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
    gap: 2,
    alignItems: 'flex-end',
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
});
