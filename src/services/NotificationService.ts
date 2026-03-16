import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications behave when the app is in the foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Request user permission and initialize notification channels for Android.
 * Returns the Expo push token if successful, undefined otherwise.
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('alerts', {
            name: 'Market Alerts',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#6366F1',
        });

        await Notifications.setNotificationChannelAsync('reminders', {
            name: 'Daily Reminders',
            importance: Notifications.AndroidImportance.DEFAULT,
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return undefined;
        }

        try {
            token = (await Notifications.getExpoPushTokenAsync({
                projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'dummy-project-id' // Optional for local
            })).data;
        } catch (e) {
            console.log('Error getting push token', e);
        }
    } else {
        console.log('Must use physical device for Push Notifications (Tokens)');
    }

    return token;
}

/**
 * Schedule a local notification to fire immediately
 */
export async function scheduleInstantNotification(title: string, body: string, data: any = {}) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data,
            sound: true,
        },
        trigger: null, // null trigger means fire immediately
    });
}

/**
 * Schedule daily market open/close reminders
 */
export async function scheduleMarketReminders(enabled: boolean) {
    // First, clear existing scheduled reminders
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
        if (notif.content.data?.type === 'market_reminder') {
            await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
    }

    if (!enabled) return;

    // Market Open: 9:15 AM
    await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Market is Open! 🔔',
            body: 'The Indian stock market has just opened. Check your watchlist for early movers.',
            data: { type: 'market_reminder' },
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: 9,
            minute: 15,
        },
    });

    // Market Close: 3:30 PM (15:30)
    await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Market Closed 🛑',
            body: 'The trading day has ended. Review your portfolio performance.',
            data: { type: 'market_reminder' },
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: 15,
            minute: 30,
        },
    });
}
