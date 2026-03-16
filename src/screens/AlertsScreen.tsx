// Alerts Screen — Manages technical and price triggers
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, StatusBar, Modal, TextInput, Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../constants/theme';
import { PriceAlert } from '../types';
import EmptyState from '../components/common/EmptyState';
import { useAlerts } from '../context/AlertsContext';
import { scheduleInstantNotification } from '../services/NotificationService';
import { formatRupee } from '../utils/formatters';
import { searchStocks } from '../api/marketApi';
import { StockQuote } from '../types';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

const ALERTS_STORAGE_KEY = '@investcompanion_alerts'; // This is now managed by AlertsContext, but keeping for reference if needed elsewhere.

export default function AlertsScreen() {
    const navigation = useNavigation<any>();
    const {
        alerts,
        addAlert,
        toggleAlert,
        removeAlert,
        marketRemindersEnabled,
        toggleMarketReminders
    } = useAlerts();

    const [activeTab, setActiveTab] = useState<'Active' | 'Triggered'>('Active');

    React.useEffect(() => {
        // loadAlerts(); // Alerts are now loaded via context

        const requestPermissions = async () => {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                console.log('Notification permissions not granted');
            }
        };
        requestPermissions();
    }, []);

    // loadAlerts and saveAlerts are now handled by AlertsContext
    // const loadAlerts = async () => {

    const [showAddModal, setShowAddModal] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [searchResults, setSearchResults] = React.useState<StockQuote[]>([]);
    const [isSearching, setIsSearching] = React.useState(false);
    const [selectedSymbol, setSelectedSymbol] = React.useState('');
    const [selectedType, setSelectedType] = React.useState<PriceAlert['type']>('price_above');
    const [targetValue, setTargetValue] = React.useState('');

    React.useEffect(() => {
        const fetchResults = async () => {
            if (search.length < 2) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }
            setIsSearching(true);
            const data = await searchStocks(search);
            setSearchResults(data);
            setIsSearching(false);
        };
        const timeoutId = setTimeout(fetchResults, 500);
        return () => clearTimeout(timeoutId);
    }, [search]);

    const displayedAlerts = alerts.filter(a => activeTab === 'Active' ? a.enabled && !a.triggeredAt : a.triggeredAt || !a.enabled);

    // toggleAlert and deleteAlert are now handled by context
    // const toggleAlert = (id: string) => {
    //     const newAlerts = alerts.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a);
    //     setAlerts(newAlerts);
    //     saveAlerts(newAlerts);
    // };

    // const deleteAlert = (id: string) => {
    //     const newAlerts = alerts.filter(a => a.id !== id);
    //     setAlerts(newAlerts);
    //     saveAlerts(newAlerts);
    // };

    const getAlertIcon = (type: string) => {
        if (type.includes('price_above')) return 'trending-up';
        if (type.includes('price_below')) return 'trending-down';
        if (type.includes('rsi')) return 'pulse';
        if (type.includes('volume')) return 'bar-chart';
        return 'notifications';
    };

    const formatAlertCondition = (alert: PriceAlert) => {
        switch (alert.type) {
            case 'price_above': return `Price rises above ${formatRupee(alert.targetValue)}`;
            case 'price_below': return `Price falls below ${formatRupee(alert.targetValue)}`;
            case 'rsi_overbought': return `RSI goes above ${alert.targetValue}`;
            case 'rsi_oversold': return `RSI falls below ${alert.targetValue}`;
            case 'volume_spike': return `Volume exceeds ${alert.targetValue} in a day`;
            default: return `Condition met for ${alert.targetValue}`;
        }
    };

    const renderAlertCard = ({ item }: { item: PriceAlert }) => {
        const isTriggered = !!item.triggeredAt;
        const alertIcon = getAlertIcon(item.type);

        return (
            <View style={[styles.alertCard, isTriggered && styles.cardTriggered]}>
                <View style={styles.alertHeader}>
                    <View style={styles.symbolContainer}>
                        <View style={styles.iconBox}>
                            <Ionicons name={alertIcon} size={18} color={isTriggered ? Colors.textTertiary : Colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.symbolText}>{item.symbol}</Text>
                            <Text style={styles.companyName}>{item.name}</Text>
                        </View>
                    </View>

                    <View style={styles.actionContainer}>
                        {!isTriggered && (
                            <Switch
                                value={item.enabled}
                                onValueChange={() => toggleAlert(item.id)}
                                trackColor={{ false: Colors.border, true: Colors.primary }}
                                thumbColor={Colors.white}
                            />
                        )}
                        {isTriggered && (
                            <View style={styles.triggeredBadge}>
                                <Ionicons name="checkmark-circle" size={12} color={Colors.gain} />
                                <Text style={styles.triggeredText}>Triggered</Text>
                            </View>
                        )}
                        <TouchableOpacity
                            onPress={() => removeAlert(item.id)}
                            style={{ marginLeft: Spacing.sm }}
                        >
                            <Ionicons name="trash-outline" size={20} color={Colors.textTertiary} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.conditionBox}>
                    <Text style={[styles.conditionText, isTriggered && { color: Colors.textTertiary }]}>
                        {formatAlertCondition(item)}
                    </Text>
                </View>

                <View style={styles.footerRow}>
                    <Text style={styles.timeText}>Created {new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
            </View>
        );
    };

    const renderCreateModal = () => (
        <Modal visible={showAddModal} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Create New Alert</Text>
                        <TouchableOpacity onPress={() => setShowAddModal(false)}>
                            <Ionicons name="close" size={24} color={Colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ padding: Spacing.xl }}>
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={18} color={Colors.textTertiary} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search stock..."
                                placeholderTextColor={Colors.textTertiary}
                                value={search}
                                onChangeText={setSearch}
                            />
                        </View>

                        {isSearching && search.length >= 2 && (
                            <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
                                <Text style={{ color: Colors.textSecondary }}>Searching...</Text>
                            </View>
                        )}

                        {!isSearching && search.length > 0 && (
                            <View style={styles.searchResults}>
                                {searchResults.slice(0, 3).map(s => (
                                    <TouchableOpacity
                                        key={s.symbol}
                                        style={[styles.searchRow, selectedSymbol === s.symbol && styles.searchRowActive]}
                                        onPress={() => {
                                            setSelectedSymbol(s.symbol);
                                            setSearch('');
                                        }}
                                    >
                                        <Text style={styles.searchSymbol}>{s.symbol}</Text>
                                        {s.ltp > 0 && <Text style={styles.searchPrice}>{formatRupee(s.ltp)}</Text>}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {selectedSymbol ? (
                            <View style={styles.formContainer}>
                                <View style={styles.selectedChip}>
                                    <Text style={styles.chipText}>{selectedSymbol}</Text>
                                    <TouchableOpacity onPress={() => setSelectedSymbol('')}>
                                        <Ionicons name="close-circle" size={16} color={Colors.primary} />
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.label}>Alert Type</Text>
                                <View style={styles.typeGrid}>
                                    {[
                                        { label: 'Price Above', value: 'price_above' },
                                        { label: 'Price Below', value: 'price_below' },
                                        { label: 'RSI Overbought', value: 'rsi_overbought' },
                                        { label: 'Volume Spike', value: 'volume_spike' }
                                    ].map(t => (
                                        <TouchableOpacity
                                            key={t.value}
                                            style={[styles.typeBox, selectedType === t.value && { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow }]}
                                            onPress={() => setSelectedType(t.value as PriceAlert['type'])}
                                        >
                                            <Text style={[styles.typeText, selectedType === t.value && { color: Colors.primary, fontWeight: FontWeight.bold }]}>{t.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={styles.label}>Target Value</Text>
                                <TextInput
                                    style={styles.inputField}
                                    keyboardType="numeric"
                                    placeholder="e.g. 1500"
                                    placeholderTextColor={Colors.textTertiary}
                                    value={targetValue}
                                    onChangeText={setTargetValue}
                                />

                                <TouchableOpacity
                                    style={[styles.saveBtn, !targetValue && { opacity: 0.5 }]}
                                    disabled={!targetValue}
                                    onPress={() => {
                                        const val = parseFloat(targetValue);
                                        if (isNaN(val)) return;

                                        const stock = searchResults.find((s: StockQuote) => s.symbol === selectedSymbol);
                                        const newAlert: PriceAlert = {
                                            id: Date.now().toString(),
                                            symbol: selectedSymbol,
                                            name: stock?.name || selectedSymbol,
                                            type: selectedType,
                                            targetValue: val,
                                            currentValue: stock?.ltp || 0,
                                            enabled: true,
                                            createdAt: new Date().toISOString()
                                        };

                                        addAlert(newAlert); // Use context's addAlert

                                        setShowAddModal(false);
                                        setSelectedSymbol('');
                                        setTargetValue('');
                                    }}
                                >
                                    <Text style={styles.saveBtnText}>Set Alert</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Smart Alerts</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
                    <Ionicons name="add" size={20} color={Colors.white} />
                </TouchableOpacity>
            </View>

            <View style={styles.tabsRow}>
                {(['Active', 'Triggered'] as const).map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={displayedAlerts}
                keyExtractor={item => item.id}
                renderItem={renderAlertCard}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <EmptyState
                        iconName="notifications-off-outline"
                        title={`No ${activeTab.toLowerCase()} alerts`}
                        description={activeTab === 'Active' ? "Set up an alert to monitor a stock." : "You have no triggered alerts."}
                        actionLabel={activeTab === 'Active' ? "Create Alert" : undefined}
                        onAction={activeTab === 'Active' ? () => setShowAddModal(true) : undefined}
                    />
                }
            />

            {renderCreateModal()}

            {/* Test Notifications & Settings */}
            <View style={{ padding: Spacing.md, borderTopWidth: 1, borderColor: Colors.border }}>
                <View style={[styles.alertCard, { marginBottom: Spacing.md }]}>
                    <View style={styles.alertHeader}>
                        <View style={styles.symbolContainer}>
                            <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
                            <Text style={styles.symbolText}>Market Reminders</Text>
                        </View>
                        <Switch
                            value={marketRemindersEnabled}
                            onValueChange={toggleMarketReminders}
                            trackColor={{ false: Colors.border, true: Colors.primary }}
                            thumbColor={Colors.white}
                        />
                    </View>
                    <Text style={[styles.conditionText, { marginTop: Spacing.xs }]}>
                        Get daily pushes at 9:15 AM and 3:30 PM.
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.testButton}
                    onPress={() => {
                        scheduleInstantNotification(
                            "🚨 Breaking News Alert",
                            "Reliance Industries announces major Q3 dividends. Stock up 5%."
                        );
                    }}
                >
                    <Ionicons name="megaphone-outline" size={20} color={Colors.white} />
                    <Text style={styles.testButtonText}>Test Push Notification</Text>
                </TouchableOpacity>
            </View>
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
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        padding: Spacing.xs,
        marginLeft: -Spacing.xs,
        marginRight: Spacing.sm,
    },
    headerTitle: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    addBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabsRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        marginBottom: Spacing.md,
    },
    tab: {
        flex: 1,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: Colors.primary,
    },
    tabText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        color: Colors.textSecondary,
    },
    tabTextActive: {
        color: Colors.primary,
        fontWeight: FontWeight.bold,
    },
    listContent: {
        padding: Spacing.xl,
        gap: Spacing.lg,
    },
    alertCard: { // Renamed from 'card'
        backgroundColor: Colors.surface,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cardTriggered: {
        backgroundColor: Colors.surfaceLight,
        opacity: 0.8,
    },
    alertHeader: { // Renamed from 'cardHeader'
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.md,
    },
    symbolContainer: { // Renamed from 'titleRow'
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        flex: 1,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    symbolText: { // Renamed from 'symbol'
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    companyName: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    actionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    toggleOn: {
        backgroundColor: Colors.primary,
        alignItems: 'flex-end',
    },
    toggleOff: {
        backgroundColor: Colors.surfaceLight,
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    toggleNob: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.white,
    },
    nobOn: {},
    nobOff: {
        backgroundColor: Colors.textTertiary,
    },
    triggeredBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.gainBg,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
        gap: 4,
    },
    triggeredText: {
        fontSize: FontSize.xs - 2,
        fontWeight: FontWeight.bold,
        color: Colors.gain,
    },
    conditionBox: {
        backgroundColor: Colors.background,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.md,
    },
    conditionText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        color: Colors.textPrimary,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeText: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
    },
    delBtn: {
        padding: Spacing.xs,
    },
    testButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        gap: Spacing.sm
    },
    testButtonText: {
        color: Colors.white,
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: Colors.overlay,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        height: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    modalTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceLight,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    searchInput: {
        flex: 1,
        paddingVertical: Spacing.md,
        color: Colors.textPrimary,
    },
    searchResults: {
        backgroundColor: Colors.surfaceLight,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    searchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    searchRowActive: {
        backgroundColor: Colors.primaryGlow,
    },
    searchSymbol: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    searchPrice: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },
    formContainer: {
        marginTop: Spacing.md,
    },
    selectedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: Colors.primaryGlow,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    chipText: {
        color: Colors.primary,
        fontWeight: FontWeight.bold,
        fontSize: FontSize.sm,
    },
    label: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    typeBox: {
        flexBasis: '47%',
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    typeText: {
        color: Colors.textPrimary,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
    },
    inputField: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        color: Colors.textPrimary,
        fontSize: FontSize.md,
        marginBottom: Spacing.xl,
    },
    saveBtn: {
        backgroundColor: Colors.primary,
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    saveBtnText: {
        color: Colors.white,
        fontWeight: FontWeight.bold,
        fontSize: FontSize.md,
    },
});
