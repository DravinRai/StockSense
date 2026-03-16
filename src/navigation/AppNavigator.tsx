import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';

import DashboardScreen from '../screens/DashboardScreen';
import WatchlistScreen from '../screens/WatchlistScreen';
import StockDetailScreen from '../screens/StockDetailScreen';
import PortfolioScreen from '../screens/PortfolioScreen';
import MoreMenuScreen from '../screens/MoreMenuScreen';
import CalculatorScreen from '../screens/CalculatorScreen';
import PatternScannerScreen from '../screens/PatternScannerScreen';
import NewsScreen from '../screens/NewsScreen';
import AlertsScreen from '../screens/AlertsScreen';
import InsiderTrackerScreen from '../screens/InsiderTrackerScreen';
import LearnHubScreen from '../screens/LearnHubScreen';
import IPOScreen from '../screens/IPOScreen';
import ETFScreenerScreen from '../screens/ETFScreenerScreen';
import IntradayScreen from '../screens/IntradayScreen';
import StocksSIPScreen from '../screens/StocksSIPScreen';
import EventsCalendarScreen from '../screens/EventsCalendarScreen';
import ProfileSettingsScreen from '../screens/ProfileSettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BottomTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: Colors.surface,
                    borderTopWidth: 0,
                    elevation: 10,
                    shadowColor: Colors.textPrimary,
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    height: 65,
                    paddingBottom: 10,
                    paddingTop: 10,
                },
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textTertiary,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 4,
                },
                tabBarIcon: ({ focused, color }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'help-circle';

                    if (route.name === 'Dashboard') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Watchlist') {
                        iconName = focused ? 'bookmark' : 'bookmark-outline';
                    } else if (route.name === 'Portfolio') {
                        iconName = focused ? 'pie-chart' : 'pie-chart-outline';
                    } else if (route.name === 'Learn') {
                        iconName = focused ? 'book' : 'book-outline';
                    } else if (route.name === 'More') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    // Scaling up slightly when focused
                    return <Ionicons name={iconName} size={focused ? 24 : 22} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
            <Tab.Screen name="Watchlist" component={WatchlistScreen} options={{ tabBarLabel: 'Watchlist' }} />
            <Tab.Screen name="Portfolio" component={PortfolioScreen} options={{ tabBarLabel: 'Portfolio' }} />
            <Tab.Screen name="Learn" component={LearnHubScreen} options={{ tabBarLabel: 'Learn' }} />
            <Tab.Screen name="More" component={MoreMenuScreen} options={{ tabBarLabel: 'Profile' }} />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    return (
        <Stack.Navigator 
            initialRouteName="MainTabs"
            screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
        >
            <Stack.Screen name="MainTabs" component={BottomTabs} />
            <Stack.Screen name="StockDetail" component={StockDetailScreen} />
            <Stack.Screen name="Calculator" component={CalculatorScreen} />
            <Stack.Screen name="News" component={NewsScreen} />
            <Stack.Screen name="Alerts" component={AlertsScreen} />
            <Stack.Screen name="Insider" component={InsiderTrackerScreen} />
            <Stack.Screen name="Scanner" component={PatternScannerScreen} />
            <Stack.Screen name="IPO" component={IPOScreen} />
            <Stack.Screen name="ETFScreener" component={ETFScreenerScreen} />
            <Stack.Screen name="Intraday" component={IntradayScreen} />
            <Stack.Screen name="StocksSIP" component={StocksSIPScreen} />
            <Stack.Screen name="Events" component={EventsCalendarScreen} />
            <Stack.Screen name="Settings" component={ProfileSettingsScreen} />
        </Stack.Navigator>
    );
}
