import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import { WatchlistProvider } from './src/context/WatchlistContext';
import { PortfolioProvider } from './src/context/PortfolioContext';
import { AlertsProvider } from './src/context/AlertsContext';
import { RecentlyViewedProvider } from './src/context/RecentlyViewedContext';
import { registerForPushNotificationsAsync } from './src/services/NotificationService';
import { registerBackgroundFetchAsync } from './src/services/BackgroundTasks';
import { Colors } from './src/constants/theme';

export default function App() {
  useEffect(() => {
    registerForPushNotificationsAsync().catch(console.warn);
    registerBackgroundFetchAsync().catch(console.warn);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaProvider>
        <RecentlyViewedProvider>
          <WatchlistProvider>
            <PortfolioProvider>
              <AlertsProvider>
                <NavigationContainer>
                  <StatusBar style="light" />
                  <AppNavigator />
                </NavigationContainer>
              </AlertsProvider>
            </PortfolioProvider>
          </WatchlistProvider>
        </RecentlyViewedProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
