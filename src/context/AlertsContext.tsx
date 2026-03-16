import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PriceAlert } from '../types';
import { scheduleMarketReminders, registerForPushNotificationsAsync } from '../services/NotificationService';
import { registerBackgroundFetchAsync, unregisterBackgroundFetchAsync } from '../services/BackgroundTasks';

interface AlertsContextType {
    alerts: PriceAlert[];
    addAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt'>) => void;
    removeAlert: (id: string) => void;
    toggleAlert: (id: string) => void;
    marketRemindersEnabled: boolean;
    toggleMarketReminders: () => void;
    isInitialized: boolean;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

const ALERTS_STORAGE_KEY = '@investment_companion_alerts';
const SETTINGS_STORAGE_KEY = '@investment_companion_settings';

export const AlertsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [alerts, setAlerts] = useState<PriceAlert[]>([]);
    const [marketRemindersEnabled, setMarketRemindersEnabled] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const storedAlerts = await AsyncStorage.getItem(ALERTS_STORAGE_KEY);
            if (storedAlerts) {
                setAlerts(JSON.parse(storedAlerts));
            }

            const storedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
            if (storedSettings) {
                const parsed = JSON.parse(storedSettings);
                setMarketRemindersEnabled(parsed.marketRemindersEnabled || false);

                // If they previously enabled reminders, re-schedule them on boot
                if (parsed.marketRemindersEnabled) {
                    await registerForPushNotificationsAsync();
                    await scheduleMarketReminders(true);
                }
            }

            // Register background task if there are active alerts
            if (storedAlerts) {
                const parsedAlerts: PriceAlert[] = JSON.parse(storedAlerts);
                const hasActiveAlerts = parsedAlerts.some(a => a.enabled && !a.triggeredAt);
                if (hasActiveAlerts) {
                    await registerBackgroundFetchAsync();
                }
            }

        } catch (error) {
            console.error('Failed to load alerts from storage:', error);
        } finally {
            setIsInitialized(true);
        }
    };

    const saveAlerts = async (newAlerts: PriceAlert[]) => {
        try {
            setAlerts(newAlerts);
            await AsyncStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(newAlerts));

            // Manage background task registration
            const hasActiveAlerts = newAlerts.some(a => a.enabled && !a.triggeredAt);
            if (hasActiveAlerts) {
                await registerBackgroundFetchAsync().catch(console.warn);
            } else {
                await unregisterBackgroundFetchAsync().catch(console.warn);
            }

        } catch (error) {
            console.error('Failed to save alerts to storage:', error);
        }
    };

    const saveSettings = async (settings: { marketRemindersEnabled: boolean }) => {
        try {
            await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save settings to storage:', error);
        }
    };

    const addAlert = (alertData: Omit<PriceAlert, 'id' | 'createdAt'>) => {
        const newAlert: PriceAlert = {
            ...alertData,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
        };
        saveAlerts([newAlert, ...alerts]);
    };

    const removeAlert = (id: string) => {
        saveAlerts(alerts.filter(a => a.id !== id));
    };

    const toggleAlert = (id: string) => {
        saveAlerts(alerts.map(a => {
            if (a.id === id) {
                return { ...a, enabled: !a.enabled, triggeredAt: undefined };
            }
            return a;
        }));
    };

    const toggleMarketReminders = async () => {
        const newValue = !marketRemindersEnabled;
        setMarketRemindersEnabled(newValue);

        // Request token on first toggle
        if (newValue) {
            await registerForPushNotificationsAsync();
        }

        await scheduleMarketReminders(newValue);
        saveSettings({ marketRemindersEnabled: newValue });
    };

    return (
        <AlertsContext.Provider
            value={{
                alerts,
                addAlert,
                removeAlert,
                toggleAlert,
                marketRemindersEnabled,
                toggleMarketReminders,
                isInitialized,
            }}
        >
            {children}
        </AlertsContext.Provider>
    );
};

export const useAlerts = () => {
    const context = useContext(AlertsContext);
    if (context === undefined) {
        throw new Error('useAlerts must be used within an AlertsProvider');
    }
    return context;
};
