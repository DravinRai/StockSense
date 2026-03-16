import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getQuotes } from '../api/marketApi';
import { scheduleInstantNotification } from './NotificationService';
import { PriceAlert } from '../types';

const BACKGROUND_FETCH_TASK = 'background-fetch-alerts';

// 1. Define the task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    try {

        const alertsData = await AsyncStorage.getItem('@investment_companion_alerts');
        if (!alertsData) return BackgroundFetch.BackgroundFetchResult.NoData;

        const alerts: PriceAlert[] = JSON.parse(alertsData);
        const activeAlerts = alerts.filter(a => a.enabled && !a.triggeredAt);

        if (activeAlerts.length === 0) {
            return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        // Get unique symbols to fetch
        const symbolsToFetch = Array.from(new Set(activeAlerts.map(a => a.symbol)));
        const quotes = await getQuotes(symbolsToFetch);

        if (!quotes || quotes.length === 0) {
            return BackgroundFetch.BackgroundFetchResult.Failed;
        }

        let alertsTriggered = 0;
        const updatedAlerts = [...alerts];

        for (const quote of quotes) {
            const symbolAlerts = activeAlerts.filter(a => a.symbol === quote.symbol);

            for (const alert of symbolAlerts) {
                let triggered = false;
                let body = '';

                switch (alert.type) {
                    case 'price_above':
                        if (quote.ltp >= alert.targetValue) {
                            triggered = true;
                            body = `${quote.symbol} is up to ₹${quote.ltp}, hitting your target of ₹${alert.targetValue}.`;
                        }
                        break;
                    case 'price_below':
                        if (quote.ltp <= alert.targetValue) {
                            triggered = true;
                            body = `${quote.symbol} has dropped to ₹${quote.ltp}, below your target of ₹${alert.targetValue}.`;
                        }
                        break;
                    case 'volume_spike':
                        // Simple volume check
                        if (quote.volume >= alert.targetValue) {
                            triggered = true;
                            body = `${quote.symbol} is experiencing high volume: ${quote.volume.toLocaleString()}.`;
                        }
                        break;
                }

                // Wait for RSI check since it requires historic data, maybe later expand `getStockChart` here if needed exactly in BG.
                // For now, handling price and volume primarily in background fetch to save battery.

                if (triggered) {
                    await scheduleInstantNotification(
                        'Target Hit! 🎯',
                        body,
                        { symbol: quote.symbol, alertId: alert.id }
                    );

                    alertsTriggered++;

                    // Mark as triggered in storage
                    const index = updatedAlerts.findIndex(a => a.id === alert.id);
                    if (index >= 0) {
                        updatedAlerts[index] = { ...updatedAlerts[index], enabled: false, triggeredAt: new Date().toISOString() };
                    }
                }
            }
        }

        if (alertsTriggered > 0) {
            await AsyncStorage.setItem('@investment_companion_alerts', JSON.stringify(updatedAlerts));
            return BackgroundFetch.BackgroundFetchResult.NewData;
        }

        return BackgroundFetch.BackgroundFetchResult.NoData;

    } catch (error) {
        console.error('[Background Fetch] Error:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
});

// 2. Register task
export async function registerBackgroundFetchAsync() {
    return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false, // android only
        startOnBoot: true,      // android only
    });
}

// 3. Unregister task (if user turns off all alerts globally)
export async function unregisterBackgroundFetchAsync() {
    return BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
}
