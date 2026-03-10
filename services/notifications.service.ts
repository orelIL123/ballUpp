import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function getProjectId() {
  return (
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    undefined
  );
}

export async function configureNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F36718',
    });
  }
}

export async function getNotificationPermissionStatusAsync() {
  const settings = await Notifications.getPermissionsAsync();
  return settings.status;
}

export async function registerForPushNotificationsAsync() {
  await configureNotificationsAsync();

  if (!Device.isDevice) {
    return {
      status: 'undetermined' as const,
      token: null,
      message: 'Push notifications דורשות מכשיר פיזי.',
    };
  }

  const existing = await Notifications.getPermissionsAsync();
  let finalStatus = existing.status;

  if (existing.status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    finalStatus = requested.status;
  }

  if (finalStatus !== 'granted') {
    return {
      status: finalStatus,
      token: null,
      message: 'המשתמש לא אישר קבלת התראות.',
    };
  }

  try {
    const projectId = getProjectId();
    const token = projectId
      ? (await Notifications.getExpoPushTokenAsync({ projectId })).data
      : (await Notifications.getExpoPushTokenAsync()).data;

    return {
      status: finalStatus,
      token,
      message: null,
    };
  } catch (error) {
    return {
      status: finalStatus,
      token: null,
      message: error instanceof Error ? error.message : 'לא הצלחנו ליצור push token.',
    };
  }
}
