import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { PassPrediction } from '../../types/satellite.ts';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

export class PassNotifier {
  private static isInitialized = false;

  public static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Schedules a local notification alert N minutes prior to Acquisition of Signal (AOS).
   */
  public static async schedulePassNotification(
    pass: PassPrediction,
    minutesBefore: number = 5
  ): Promise<string | null> {
    if (Platform.OS === 'web') return null;

    const notifyTimeMs = pass.aosTimestamp - minutesBefore * 60 * 1000;
    const now = Date.now();

    if (notifyTimeMs <= now) {
      // Pass is already starting or passed
      return null;
    }

    const triggerSeconds = Math.max(1, Math.round((notifyTimeMs - now) / 1000));

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🛰️ Satellite Pass: ${pass.satelliteName}`,
          body: `AOS starting in ${minutesBefore} min at Azimuth ${pass.aosAzimuthDeg}°. Max elevation: ${pass.maxElevationDeg}° (${pass.visibilityType}).`,
          data: {
            noradId: pass.noradId,
            passId: pass.id
          },
          sound: 'default'
        },
        trigger: {
          seconds: triggerSeconds,
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL
        }
      });

      return id;
    } catch {
      return null;
    }
  }

  public static async cancelNotification(notificationId: string): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch {
      // Suppress error
    }
  }
}

