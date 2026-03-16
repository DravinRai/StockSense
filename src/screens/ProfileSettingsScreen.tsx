// Profile & Settings Screen — App preferences, notifications, and information
import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch,
    StatusBar, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../constants/theme';
import { useAlerts } from '../context/AlertsContext';
import SEBIDisclaimer from '../components/common/SEBIDisclaimer';

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '100';

// ─── Row Components ──────────────────────────────────────
function SettingRow({
    icon,
    label,
    sublabel,
    value,
    onPress,
    rightElement,
    iconColor = Colors.primary,
}: {
    icon: string;
    label: string;
    sublabel?: string;
    value?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    iconColor?: string;
}) {
    return (
        <TouchableOpacity
            style={styles.row}
            onPress={onPress}
            disabled={!onPress && !rightElement}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <View style={[styles.rowIcon, { backgroundColor: iconColor + '18' }]}>
                <Ionicons name={icon as any} size={20} color={iconColor} />
            </View>
            <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>{label}</Text>
                {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
            </View>
            {rightElement ?? (
                value ? (
                    <Text style={styles.rowValue}>{value}</Text>
                ) : onPress ? (
                    <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
                ) : null
            )}
        </TouchableOpacity>
    );
}

function SectionHeader({ title }: { title: string }) {
    return <Text style={styles.sectionHeader}>{title}</Text>;
}

function Divider() {
    return <View style={styles.divider} />;
}

// ─── Main Screen ──────────────────────────────────────────
export default function ProfileSettingsScreen() {
    const navigation = useNavigation<any>();
    const { marketRemindersEnabled, toggleMarketReminders } = useAlerts();
    const [clearingCache, setClearingCache] = useState(false);

    const handleClearCache = useCallback(async () => {
        Alert.alert(
            'Clear Cache',
            'This will clear all locally cached market data. Your portfolio, watchlist, and alerts will not be affected.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        setClearingCache(true);
                        try {
                            const allKeys = await AsyncStorage.getAllKeys();
                            // Only remove cache keys, not user data
                            const cacheKeys = allKeys.filter(k =>
                                k.startsWith('@cache_') || k.startsWith('@market_')
                            );
                            if (cacheKeys.length > 0) await AsyncStorage.multiRemove(cacheKeys);
                            Alert.alert('Done', 'Cache cleared successfully.');
                        } catch {
                            Alert.alert('Error', 'Could not clear cache. Please try again.');
                        } finally {
                            setClearingCache(false);
                        }
                    },
                },
            ]
        );
    }, []);

    const handleOpenLink = (url: string) => {
        Linking.openURL(url).catch(() =>
            Alert.alert('Error', 'Could not open link.')
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings & Profile</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* ─── Profile / App Identity ─── */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarCircle}>
                        <Ionicons name="person" size={36} color={Colors.primary} />
                    </View>
                    <View>
                        <Text style={styles.profileName}>Investment Companion</Text>
                        <Text style={styles.profileSub}>Your personal market assistant</Text>
                    </View>
                </View>

                {/* ─── Notifications ─── */}
                <SectionHeader title="NOTIFICATIONS" />
                <View style={styles.card}>
                    <SettingRow
                        icon="alarm-outline"
                        label="Market Reminders"
                        sublabel="9:15 AM open & 3:30 PM close alerts"
                        iconColor={Colors.primary}
                        rightElement={
                            <Switch
                                value={marketRemindersEnabled}
                                onValueChange={toggleMarketReminders}
                                trackColor={{ false: Colors.border, true: Colors.primary }}
                                thumbColor={Colors.surface}
                            />
                        }
                    />
                    <Divider />
                    <SettingRow
                        icon="pricetag-outline"
                        label="Price Alerts"
                        sublabel="Manage your stock price triggers"
                        iconColor="#F59E0B"
                        onPress={() => navigation.navigate('Alerts')}
                    />
                </View>

                {/* ─── Data ─── */}
                <SectionHeader title="DATA & STORAGE" />
                <View style={styles.card}>
                    <SettingRow
                        icon="refresh-outline"
                        label="Clear Market Cache"
                        sublabel="Frees locally cached quotes and charts"
                        iconColor={Colors.loss}
                        onPress={clearingCache ? undefined : handleClearCache}
                        value={clearingCache ? 'Clearing…' : undefined}
                    />
                </View>

                {/* ─── About ─── */}
                <SectionHeader title="ABOUT" />
                <View style={styles.card}>
                    <SettingRow
                        icon="information-circle-outline"
                        label="App Version"
                        value={`v${APP_VERSION} (${BUILD_NUMBER})`}
                        iconColor={Colors.textSecondary}
                    />
                    <Divider />
                    <SettingRow
                        icon="shield-checkmark-outline"
                        label="Privacy Policy"
                        iconColor="#6366F1"
                        onPress={() => handleOpenLink('https://www.sebi.gov.in')}
                    />
                    <Divider />
                    <SettingRow
                        icon="document-text-outline"
                        label="Terms of Use"
                        iconColor="#6366F1"
                        onPress={() => handleOpenLink('https://www.sebi.gov.in')}
                    />
                    <Divider />
                    <SettingRow
                        icon="logo-github"
                        label="Open Source Libraries"
                        sublabel="React Native, Expo, Yahoo Finance API"
                        iconColor={Colors.textSecondary}
                        onPress={() => handleOpenLink('https://github.com')}
                    />
                </View>

                {/* ─── Data Sources ─── */}
                <SectionHeader title="DATA SOURCES" />
                <View style={styles.card}>
                    <SettingRow
                        icon="globe-outline"
                        label="Market Data"
                        sublabel="Yahoo Finance (query1.finance.yahoo.com)"
                        iconColor={Colors.primary}
                    />
                    <Divider />
                    <SettingRow
                        icon="newspaper-outline"
                        label="News"
                        sublabel="NewsAPI.org"
                        iconColor={Colors.primary}
                    />
                    <Divider />
                    <SettingRow
                        icon="sparkles-outline"
                        label="AI Insights"
                        sublabel="Google Gemini API"
                        iconColor="#8B5CF6"
                    />
                </View>

                {/* ─── SEBI Disclaimer ─── */}
                <SEBIDisclaimer />

                <Text style={styles.footerText}>
                    This app is intended for educational purposes only. It does not constitute
                    financial advice. Past performance is not indicative of future results.
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingTop: 56,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        padding: Spacing.xs,
        marginLeft: -Spacing.xs,
    },
    headerTitle: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    scrollContent: {
        paddingBottom: Spacing.xl * 3,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.lg,
        padding: Spacing.xl,
        backgroundColor: Colors.surface,
        marginBottom: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    avatarCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.primaryGlow,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileName: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    profileSub: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    sectionHeader: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: Colors.textTertiary,
        letterSpacing: 0.8,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.sm,
    },
    card: {
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
        ...Shadow.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        gap: Spacing.md,
    },
    rowIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowContent: {
        flex: 1,
    },
    rowLabel: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        color: Colors.textPrimary,
    },
    rowSublabel: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    rowValue: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        fontWeight: FontWeight.medium,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginLeft: Spacing.lg + 36 + Spacing.md,
    },
    footerText: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        textAlign: 'center',
        paddingHorizontal: Spacing.xl * 2,
        paddingBottom: Spacing.xl,
        lineHeight: 18,
    },
});
