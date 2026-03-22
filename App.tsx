import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppState, AppStateStatus } from 'react-native';

import AppNavigator from './src/navigation/AppNavigator';
import { WatchlistProvider } from './src/context/WatchlistContext';
import { PortfolioProvider } from './src/context/PortfolioContext';
import { AlertsProvider } from './src/context/AlertsContext';
import { RecentlyViewedProvider } from './src/context/RecentlyViewedContext';
import { registerForPushNotificationsAsync } from './src/services/NotificationService';
import { registerBackgroundFetchAsync } from './src/services/BackgroundTasks';
import { Colors } from './src/constants/theme';
import PINLockScreen from './src/screens/PINLockScreen';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export default function App() {
  const [isLocked, setIsLocked] = useState(true);
  const appState = useRef(AppState.currentState);
  const lastBackgroundTime = useRef<number | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().catch(console.warn);
    registerBackgroundFetchAsync().catch(console.warn);

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current.match(/active/) && nextAppState === 'background') {
      lastBackgroundTime.current = Date.now();
    }

    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      if (lastBackgroundTime.current && Date.now() - lastBackgroundTime.current > INACTIVITY_TIMEOUT) {
        setIsLocked(true);
      }
    }

    appState.current = nextAppState;
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaProvider>
        <RecentlyViewedProvider>
          <WatchlistProvider>
            <PortfolioProvider>
              <AlertsProvider>
                <NavigationContainer>
                  <StatusBar style="light" />
                  {isLocked ? (
                    <PINLockScreen onUnlock={() => setIsLocked(false)} />
                  ) : (
                    <AppNavigator />
                  )}
                </NavigationContainer>
              </AlertsProvider>
            </PortfolioProvider>
          </WatchlistProvider>
        </RecentlyViewedProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
