// IPO Screen — Upcoming, Open & Recently Listed IPOs in India
import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    StatusBar, ScrollView, Linking, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../constants/theme';
import { formatRupee } from '../utils/formatters';
import SEBIDisclaimer from '../components/common/SEBIDisclaimer';

interface IPOItem {
    id: string;
    company: string;
    sector: string;
    status: 'Open' | 'Upcoming' | 'Listed' | 'Closed';
    priceMin: number;
    priceMax: number;
    openDate: string;
    closeDate: string;
    listingDate: string;
    lotSize: number;
    issueSize: string;   // e.g. "₹1,200 Cr"
    gmp: number | null;  // Grey Market Premium in ₹
    subscriptionTimes: number | null;
    listingGain: number | null; // % gain on listing (for listed ones)
    type: 'Mainboard' | 'SME';
}

// Realistic mock data (updated with typical March 2026 IPO pipeline)
const MOCK_IPOS: IPOItem[] = [
    {
        id: '1',
        company: 'Swiggy Ltd',
        sector: 'Food Delivery / Tech',
        status: 'Open',
        priceMin: 390,
        priceMax: 412,
        openDate: 'Mar 14, 2026',
        closeDate: 'Mar 18, 2026',
        listingDate: 'Mar 22, 2026',
        lotSize: 36,
        issueSize: '₹4,500 Cr',
        gmp: 45,
        subscriptionTimes: 3.2,
        listingGain: null,
        type: 'Mainboard',
    },
    {
        id: '2',
        company: 'Ola Electric Mobility',
        sector: 'Electric Vehicles',
        status: 'Upcoming',
        priceMin: 260,
        priceMax: 276,
        openDate: 'Mar 22, 2026',
        closeDate: 'Mar 26, 2026',
        listingDate: 'Mar 30, 2026',
        lotSize: 54,
        issueSize: '₹6,145 Cr',
        gmp: 30,
        subscriptionTimes: null,
        listingGain: null,
        type: 'Mainboard',
    },
    {
        id: '3',
        company: 'FirstCry (Brainbees Solutions)',
        sector: 'FMCG / Retail',
        status: 'Upcoming',
        priceMin: 440,
        priceMax: 465,
        openDate: 'Apr 2, 2026',
        closeDate: 'Apr 4, 2026',
        listingDate: 'Apr 8, 2026',
        lotSize: 32,
        issueSize: '₹1,816 Cr',
        gmp: null,
        subscriptionTimes: null,
        listingGain: null,
        type: 'Mainboard',
    },
    {
        id: '4',
        company: 'Bajaj Housing Finance',
        sector: 'NBFC / Housing',
        status: 'Listed',
        priceMin: 66,
        priceMax: 70,
        openDate: 'Sep 9, 2025',
        closeDate: 'Sep 11, 2025',
        listingDate: 'Sep 16, 2025',
        lotSize: 214,
        issueSize: '₹6,560 Cr',
        gmp: null,
        subscriptionTimes: 64.0,
        listingGain: 114.3,
        type: 'Mainboard',
    },
    {
        id: '5',
        company: 'Hyundai India',
        sector: 'Automobiles',
        status: 'Listed',
        priceMin: 1865,
        priceMax: 1960,
        openDate: 'Oct 15, 2025',
        closeDate: 'Oct 17, 2025',
        listingDate: 'Oct 22, 2025',
        lotSize: 7,
        issueSize: '₹27,870 Cr',
        gmp: null,
        subscriptionTimes: 2.4,
        listingGain: -1.2,
        type: 'Mainboard',
    },
    {
        id: '6',
        company: 'TechEase Solutions',
        sector: 'SaaS / IT',
        status: 'Open',
        priceMin: 124,
        priceMax: 131,
        openDate: 'Mar 13, 2026',
        closeDate: 'Mar 17, 2026',
        listingDate: 'Mar 21, 2026',
        lotSize: 1000,
        issueSize: '₹43 Cr',
        gmp: 18,
        subscriptionTimes: 12.5,
        listingGain: null,
        type: 'SME',
    },
    {
        id: '7',
        company: 'PharmEasy India Ltd',
        sector: 'Healthtech',
        status: 'Upcoming',
        priceMin: 0,
        priceMax: 0,
        openDate: 'TBA',
        closeDate: 'TBA',
        listingDate: 'TBA',
        lotSize: 0,
        issueSize: '₹3,500 Cr',
        gmp: null,
        subscriptionTimes: null,
        listingGain: null,
        type: 'Mainboard',
    },
];

const STATUS_COLORS: Record<IPOItem['status'], { bg: string; text: string }> = {
    Open:     { bg: Colors.gainBg, text: Colors.gain },
    Upcoming: { bg: Colors.infoBg, text: Colors.info },
    Listed:   { bg: Colors.surfaceLight ?? '#F0F0F0', text: Colors.textSecondary },
    Closed:   { bg: Colors.lossBg, text: Colors.loss },
};

const TABS = ['All', 'Open', 'Upcoming', 'Listed'] as const;
type Tab = typeof TABS[number];

function IPOCard({ item }: { item: IPOItem }) {
    const statusStyle = STATUS_COLORS[item.status];
    const hasGMP = item.gmp !== null && item.gmp !== 0;

    return (
        <View style={styles.card}>
            {/* Header Row */}
            <View style={styles.cardHeader}>
                <View style={styles.cardTitleBlock}>
                    <View style={styles.companyRow}>
                        <Text style={styles.companyName} numberOfLines={1}>{item.company}</Text>
                        {item.type === 'SME' && (
                            <View style={styles.smeBadge}>
                                <Text style={styles.smeBadgeText}>SME</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.sectorText}>{item.sector}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
                </View>
            </View>

            {/* Price Band */}
            {item.priceMax > 0 && (
                <View style={styles.priceRow}>
                    <View style={styles.priceBlock}>
                        <Text style={styles.priceLabel}>Price Band</Text>
                        <Text style={styles.priceValue}>
                            ₹{item.priceMin} – ₹{item.priceMax}
                        </Text>
                    </View>
                    <View style={styles.priceBlock}>
                        <Text style={styles.priceLabel}>Issue Size</Text>
                        <Text style={styles.priceValue}>{item.issueSize}</Text>
                    </View>
                    <View style={styles.priceBlock}>
                        <Text style={styles.priceLabel}>Lot Size</Text>
                        <Text style={styles.priceValue}>{item.lotSize > 0 ? item.lotSize : 'TBA'}</Text>
                    </View>
                </View>
            )}

            {/* GMP / Listing Gain Row */}
            <View style={styles.metricsRow}>
                {hasGMP && item.status !== 'Listed' && (
                    <View style={[styles.metricPill, { backgroundColor: item.gmp! > 0 ? Colors.gainBg : Colors.lossBg }]}>
                        <Ionicons
                            name={item.gmp! > 0 ? 'trending-up' : 'trending-down'}
                            size={12}
                            color={item.gmp! > 0 ? Colors.gain : Colors.loss}
                        />
                        <Text style={[styles.metricPillText, { color: item.gmp! > 0 ? Colors.gain : Colors.loss }]}>
                            GMP ₹{item.gmp}
                        </Text>
                    </View>
                )}
                {item.subscriptionTimes !== null && (
                    <View style={styles.metricPill}>
                        <Ionicons name="layers-outline" size={12} color={Colors.primary} />
                        <Text style={[styles.metricPillText, { color: Colors.primary }]}>
                            {item.subscriptionTimes}x subscribed
                        </Text>
                    </View>
                )}
                {item.listingGain !== null && (
                    <View style={[styles.metricPill, {
                        backgroundColor: item.listingGain >= 0 ? Colors.gainBg : Colors.lossBg
                    }]}>
                        <Text style={[styles.metricPillText, {
                            color: item.listingGain >= 0 ? Colors.gain : Colors.loss
                        }]}>
                            {item.listingGain >= 0 ? '+' : ''}{item.listingGain.toFixed(1)}% listing
                        </Text>
                    </View>
                )}
            </View>

            {/* Dates Row */}
            <View style={styles.datesRow}>
                <View style={styles.dateItem}>
                    <Text style={styles.dateLabel}>Opens</Text>
                    <Text style={styles.dateValue}>{item.openDate}</Text>
                </View>
                <View style={styles.dateSep} />
                <View style={styles.dateItem}>
                    <Text style={styles.dateLabel}>Closes</Text>
                    <Text style={styles.dateValue}>{item.closeDate}</Text>
                </View>
                <View style={styles.dateSep} />
                <View style={styles.dateItem}>
                    <Text style={styles.dateLabel}>Listing</Text>
                    <Text style={styles.dateValue}>{item.listingDate}</Text>
                </View>
            </View>

            {/* Apply Button (informational) */}
            {item.status === 'Open' && (
                <TouchableOpacity
                    style={styles.applyBtn}
                    activeOpacity={0.8}
                    onPress={() => Linking.openURL('https://www.nseindia.com/invest/ipo')}
                >
                    <Text style={styles.applyBtnText}>Apply via NSE →</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

export default function IPOScreen() {
    const navigation = useNavigation<any>();
    const [activeTab, setActiveTab] = useState<Tab>('All');
    const [refreshing, setRefreshing] = useState(false);
    const [ipos, setIpos] = useState<IPOItem[]>(MOCK_IPOS);

    const filtered = activeTab === 'All'
        ? ipos
        : ipos.filter(i => i.status === activeTab);

    const openCount = ipos.filter(i => i.status === 'Open').length;
    const upcomingCount = ipos.filter(i => i.status === 'Upcoming').length;

    const onRefresh = async () => {
        setRefreshing(true);
        // In production: fetch from real IPO data provider
        await new Promise(r => setTimeout(r, 800));
        setRefreshing(false);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.headerTitle}>IPO</Text>
                    <Text style={styles.headerSubtitle}>
                        {openCount} open · {upcomingCount} upcoming
                    </Text>
                </View>
                <View style={{ width: 36 }} />
            </View>

            {/* Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabBar}
            >
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Data disclaimer */}
            <View style={styles.disclaimerBanner}>
                <Ionicons name="information-circle-outline" size={14} color={Colors.textTertiary} />
                <Text style={styles.disclaimerBannerText}>
                    Sample data for illustration. GMP is indicative. Verify on official registrar website before investing.
                </Text>
            </View>

            <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <IPOCard item={item} />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="rocket-outline" size={48} color={Colors.textTertiary} />
                        <Text style={styles.emptyTitle}>No IPOs in this category</Text>
                    </View>
                }
                ListFooterComponent={<SEBIDisclaimer />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: 56,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backBtn: { padding: Spacing.xs, width: 36 },
    headerText: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
    headerSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
    tabBar: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        gap: Spacing.sm,
        backgroundColor: Colors.surface,
    },
    tab: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    tabActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
    tabText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
    tabTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
    disclaimerBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.warningBg,
    },
    disclaimerBannerText: { fontSize: FontSize.xs, color: Colors.textSecondary, flex: 1 },
    listContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 40, gap: Spacing.md },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        ...Shadow.md,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
    cardTitleBlock: { flex: 1, marginRight: Spacing.sm },
    companyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
    companyName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, flexShrink: 1 },
    smeBadge: {
        backgroundColor: Colors.infoBg,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    smeBadgeText: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.info },
    sectorText: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
    statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full },
    statusText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
    priceRow: { flexDirection: 'row', marginBottom: Spacing.sm, gap: Spacing.xs },
    priceBlock: { flex: 1 },
    priceLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, marginBottom: 2 },
    priceValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
    metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm },
    metricPill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: Spacing.sm, paddingVertical: 4,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.primaryGlow,
    },
    metricPillText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
    datesRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
        paddingTop: Spacing.sm,
        marginTop: Spacing.xs,
    },
    dateItem: { flex: 1, alignItems: 'center' },
    dateSep: { width: 1, backgroundColor: Colors.border, marginVertical: 2 },
    dateLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, marginBottom: 2 },
    dateValue: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textPrimary, textAlign: 'center' },
    applyBtn: {
        marginTop: Spacing.md,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.sm,
        alignItems: 'center',
    },
    applyBtnText: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
    emptyState: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
    emptyTitle: { fontSize: FontSize.md, color: Colors.textSecondary },
});
