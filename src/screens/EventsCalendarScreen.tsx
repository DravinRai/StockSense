// Events Calendar Screen — RBI policy, Budget, F&O expiry, earnings, market holidays
import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, SectionList, TouchableOpacity, StatusBar, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../constants/theme';

interface MarketEvent {
    id: string;
    title: string;
    description: string;
    date: string;        // Display date
    dateTs: number;      // timestamp for sorting
    type: 'RBI' | 'Budget' | 'FnO' | 'Earnings' | 'Holiday' | 'IPO' | 'Economic';
    importance: 'High' | 'Medium' | 'Low';
    symbol?: string;     // for earnings events
}

const EVENT_COLORS: Record<MarketEvent['type'], { bg: string; text: string; icon: any }> = {
    RBI:      { bg: '#7C3AED20', text: '#7C3AED', icon: 'business-outline' },
    Budget:   { bg: '#DC262620', text: '#DC2626', icon: 'document-text-outline' },
    FnO:      { bg: Colors.warningBg, text: Colors.warning, icon: 'timer-outline' },
    Earnings: { bg: Colors.infoBg, text: Colors.info, icon: 'stats-chart-outline' },
    Holiday:  { bg: Colors.gainBg, text: Colors.gain, icon: 'sunny-outline' },
    IPO:      { bg: '#F59E0B20', text: '#F59E0B', icon: 'rocket-outline' },
    Economic: { bg: Colors.primaryGlow, text: Colors.primary, icon: 'trending-up-outline' },
};

const IMPORTANCE_BORDER: Record<MarketEvent['importance'], string> = {
    High:   Colors.loss,
    Medium: Colors.warning,
    Low:    Colors.border,
};

// Comprehensive market events for 2026
const ALL_EVENTS: MarketEvent[] = [
    // ── March 2026 ─────────────────────────────────────
    { id: 'e1',  title: 'NSE F&O Expiry – March 2026', description: 'Monthly contracts expiry for Nifty, BankNifty and all stocks.', date: 'Mar 26, 2026', dateTs: 1743033600, type: 'FnO', importance: 'High' },
    { id: 'e2',  title: 'RBI MPC Meeting (Day 2)', description: 'Reserve Bank of India announces bi-monthly monetary policy. Watch for repo rate changes.', date: 'Mar 27, 2026', dateTs: 1743120000, type: 'RBI', importance: 'High' },
    { id: 'e3',  title: 'Infosys Q4 FY26 Results', description: 'Quarterly earnings announcement with guidance for next year.', date: 'Apr 17, 2026', dateTs: 1745107200, type: 'Earnings', importance: 'High', symbol: 'INFY' },
    { id: 'e4',  title: 'TCS Q4 FY26 Results', description: 'One of the most watched quarterly results in India.', date: 'Apr 10, 2026', dateTs: 1744502400, type: 'Earnings', importance: 'High', symbol: 'TCS' },
    { id: 'e5',  title: 'NSE F&O Expiry – April 2026', description: 'Monthly contracts expiry for Nifty, BankNifty and all stocks.', date: 'Apr 30, 2026', dateTs: 1746057600, type: 'FnO', importance: 'High' },
    { id: 'e6',  title: 'Market Holiday – Ram Navami', description: 'NSE & BSE closed.', date: 'Apr 6, 2026', dateTs: 1744070400, type: 'Holiday', importance: 'Medium' },
    // ── May 2026 ───────────────────────────────────────
    { id: 'e7',  title: 'NSE F&O Expiry – May 2026', description: 'Monthly contracts expiry for Nifty, BankNifty and all stocks.', date: 'May 28, 2026', dateTs: 1748390400, type: 'FnO', importance: 'High' },
    { id: 'e8',  title: 'Reliance Q4 FY26 Results', description: 'Quarterly results for India\'s largest company by market cap.', date: 'May 5, 2026', dateTs: 1746489600, type: 'Earnings', importance: 'High', symbol: 'RELIANCE' },
    { id: 'e9',  title: 'India GDP Data – Q4 FY26', description: 'Ministry of Statistics releases quarterly GDP growth data.', date: 'May 29, 2026', dateTs: 1748476800, type: 'Economic', importance: 'High' },
    { id: 'e10', title: 'Market Holiday – Maharashtra Day', description: 'NSE & BSE closed for Maharashtra State Foundation Day.', date: 'May 1, 2026', dateTs: 1746057600, type: 'Holiday', importance: 'Medium' },
    // ── June 2026 ──────────────────────────────────────
    { id: 'e11', title: 'RBI MPC Meeting (Day 2)', description: 'Reserve Bank of India announces bi-monthly monetary policy.', date: 'Jun 5, 2026', dateTs: 1749168000, type: 'RBI', importance: 'High' },
    { id: 'e12', title: 'NSE F&O Expiry – June 2026', description: 'Monthly contracts expiry for all derivatives. Also quarterly expiry.', date: 'Jun 25, 2026', dateTs: 1750896000, type: 'FnO', importance: 'High' },
    { id: 'e13', title: 'India CPI Inflation – May 2026', description: 'Consumer Price Index data released by MOSPI.', date: 'Jun 12, 2026', dateTs: 1749772800, type: 'Economic', importance: 'Medium' },
    { id: 'e14', title: 'HDFC Bank Q1 FY27 Results', description: 'Quarterly earnings from India\'s largest private sector bank.', date: 'Jul 19, 2026', dateTs: 1752364800, type: 'Earnings', importance: 'High', symbol: 'HDFCBANK' },
    // ── July 2026 ──────────────────────────────────────
    { id: 'e15', title: 'Union Budget FY27 Presentation', description: 'Finance Minister presents the Annual Union Budget in Parliament.', date: 'Jul 1, 2026', dateTs: 1751414400, type: 'Budget', importance: 'High' },
    { id: 'e16', title: 'NSE F&O Expiry – July 2026', description: 'Monthly contracts expiry for Nifty, BankNifty and all stocks.', date: 'Jul 30, 2026', dateTs: 1753920000, type: 'FnO', importance: 'High' },
    { id: 'e17', title: 'Market Holiday – Muharram', description: 'NSE & BSE closed.', date: 'Jul 27, 2026', dateTs: 1753660800, type: 'Holiday', importance: 'Low' },
    // ── August 2026 ────────────────────────────────────
    { id: 'e18', title: 'RBI MPC Meeting (Day 2)', description: 'Reserve Bank of India announces bi-monthly monetary policy.', date: 'Aug 6, 2026', dateTs: 1754524800, type: 'RBI', importance: 'High' },
    { id: 'e19', title: 'NSE F&O Expiry – August 2026', description: 'Monthly contracts expiry for Nifty, BankNifty and all stocks.', date: 'Aug 27, 2026', dateTs: 1756425600, type: 'FnO', importance: 'High' },
    { id: 'e20', title: 'Market Holiday – Independence Day', description: 'NSE & BSE closed for Independence Day.', date: 'Aug 15, 2026', dateTs: 1755388800, type: 'Holiday', importance: 'Medium' },
];

// Group events into sections by month
function groupByMonth(events: MarketEvent[]): { title: string; data: MarketEvent[] }[] {
    const now = Date.now() / 1000;
    const sorted = [...events].sort((a, b) => a.dateTs - b.dateTs);
    const groups: Record<string, MarketEvent[]> = {};
    for (const ev of sorted) {
        const d = new Date(ev.dateTs * 1000);
        const key = d.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!groups[key]) groups[key] = [];
        groups[key].push(ev);
    }
    return Object.entries(groups).map(([title, data]) => ({ title, data }));
}

const FILTER_TABS = ['All', 'RBI', 'FnO', 'Earnings', 'Holiday', 'Budget', 'Economic'] as const;
type FilterTab = typeof FILTER_TABS[number];

function EventCard({ item }: { item: MarketEvent }) {
    const meta = EVENT_COLORS[item.type];
    const borderColor = IMPORTANCE_BORDER[item.importance];

    return (
        <View style={[styles.eventCard, { borderLeftColor: borderColor }]}>
            <View style={styles.eventLeft}>
                <View style={[styles.typeIconWrap, { backgroundColor: meta.bg }]}>
                    <Ionicons name={meta.icon} size={16} color={meta.text} />
                </View>
            </View>
            <View style={styles.eventContent}>
                <View style={styles.eventTitleRow}>
                    <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
                    {item.importance === 'High' && (
                        <View style={styles.importanceBadge}>
                            <Text style={styles.importanceText}>!</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.eventDesc} numberOfLines={2}>{item.description}</Text>
                <View style={styles.eventFooter}>
                    <View style={[styles.typeBadge, { backgroundColor: meta.bg }]}>
                        <Text style={[styles.typeText, { color: meta.text }]}>{item.type}</Text>
                    </View>
                    <Text style={styles.eventDate}>{item.date}</Text>
                </View>
            </View>
        </View>
    );
}

export default function EventsCalendarScreen() {
    const navigation = useNavigation<any>();
    const [activeFilter, setActiveFilter] = useState<FilterTab>('All');

    const filtered = useMemo(() => {
        const events = activeFilter === 'All' ? ALL_EVENTS : ALL_EVENTS.filter(e => e.type === activeFilter);
        return groupByMonth(events);
    }, [activeFilter]);

    const totalHigh = ALL_EVENTS.filter(e => e.importance === 'High').length;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Events Calendar</Text>
                    <Text style={styles.headerSubtitle}>{totalHigh} major events upcoming</Text>
                </View>
                <View style={{ width: 36 }} />
            </View>

            {/* Legend */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.legend}>
                {(Object.entries(EVENT_COLORS) as [MarketEvent['type'], { bg: string; text: string; icon: any }][]).map(([type, meta]) => (
                    <View key={type} style={[styles.legendChip, { backgroundColor: meta.bg }]}>
                        <Ionicons name={meta.icon} size={11} color={meta.text} />
                        <Text style={[styles.legendText, { color: meta.text }]}>{type}</Text>
                    </View>
                ))}
            </ScrollView>

            {/* Filter Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
                {FILTER_TABS.map(tab => {
                    const meta = tab !== 'All' ? EVENT_COLORS[tab as MarketEvent['type']] : null;
                    const isActive = activeFilter === tab;
                    return (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, isActive && { borderColor: meta?.text ?? Colors.primary, backgroundColor: meta?.bg ?? Colors.primaryGlow }]}
                            onPress={() => setActiveFilter(tab)}
                        >
                            <Text style={[styles.tabText, isActive && { color: meta?.text ?? Colors.primary, fontWeight: FontWeight.bold }]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Importance Legend */}
            <View style={styles.importanceLegend}>
                <View style={styles.impItem}>
                    <View style={[styles.impDot, { backgroundColor: Colors.loss }]} />
                    <Text style={styles.impLabel}>High impact</Text>
                </View>
                <View style={styles.impItem}>
                    <View style={[styles.impDot, { backgroundColor: Colors.warning }]} />
                    <Text style={styles.impLabel}>Medium</Text>
                </View>
                <View style={styles.impItem}>
                    <View style={[styles.impDot, { backgroundColor: Colors.border }]} />
                    <Text style={styles.impLabel}>Low</Text>
                </View>
            </View>

            <SectionList
                sections={filtered}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <EventCard item={item} />}
                renderSectionHeader={({ section: { title } }) => (
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionHeaderText}>{title}</Text>
                    </View>
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingTop: 56, paddingBottom: Spacing.md,
        backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    backBtn: { padding: Spacing.xs, width: 36 },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
    headerSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
    legend: {
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, gap: Spacing.xs,
        backgroundColor: Colors.surface,
    },
    legendChip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full,
    },
    legendText: { fontSize: 10, fontWeight: FontWeight.semibold },
    tabBar: {
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, gap: Spacing.sm,
        backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    tab: {
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border,
    },
    tabText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
    importanceLegend: {
        flexDirection: 'row', gap: Spacing.lg,
        paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
        backgroundColor: Colors.surfaceLight,
    },
    impItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    impDot: { width: 10, height: '100%', borderRadius: 2 },
    impLabel: { fontSize: FontSize.xs, color: Colors.textTertiary },
    sectionHeader: {
        backgroundColor: Colors.surfaceLight, paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    sectionHeaderText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary },
    listContent: { paddingBottom: 60 },
    eventCard: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
        borderLeftWidth: 4,
    },
    eventLeft: { marginRight: Spacing.md, paddingTop: 2 },
    typeIconWrap: {
        width: 32, height: 32, borderRadius: BorderRadius.md,
        justifyContent: 'center', alignItems: 'center',
    },
    eventContent: { flex: 1 },
    eventTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs, marginBottom: 4 },
    eventTitle: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
    importanceBadge: {
        backgroundColor: Colors.lossBg, width: 18, height: 18,
        borderRadius: 9, justifyContent: 'center', alignItems: 'center',
    },
    importanceText: { fontSize: 11, fontWeight: FontWeight.extrabold, color: Colors.loss },
    eventDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: Spacing.sm, lineHeight: 16 },
    eventFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full },
    typeText: { fontSize: 10, fontWeight: FontWeight.bold },
    eventDate: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
});
