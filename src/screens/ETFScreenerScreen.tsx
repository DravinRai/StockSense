// ETF Screener Screen — Popular Indian ETFs with NAV, returns, expense ratio
import React, { useState, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    StatusBar, ScrollView, RefreshControl, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../constants/theme';
import SEBIDisclaimer from '../components/common/SEBIDisclaimer';
import LoadingShimmer from '../components/common/LoadingShimmer';
import { getQuotes } from '../api/marketApi';

interface ETFItem {
    id: string;
    name: string;
    symbol: string;      // NSE symbol for live quote
    amcShort: string;    // Short AMC name
    category: 'Equity' | 'Index' | 'Gold' | 'Debt' | 'International';
    benchmarkIndex: string;
    expenseRatio: number; // in %
    aum: string;          // e.g. "₹21,500 Cr"
    nav: number;          // Last NAV — will be overwritten with live price
    return1D: number;
    return1Y: number;
    return3Y: number;
}

const ETF_DATA: ETFItem[] = [
    // ── Index / Nifty ETFs ───────────────────────────────
    { id: 'e1', name: 'Nippon India ETF Nifty 50 BeES', symbol: 'NIFTYBEES', amcShort: 'Nippon',
      category: 'Index', benchmarkIndex: 'NIFTY 50', expenseRatio: 0.04, aum: '₹22,800 Cr',
      nav: 248.50, return1D: 0.41, return1Y: 14.2, return3Y: 12.1 },
    { id: 'e2', name: 'HDFC NIFTY 50 ETF', symbol: 'HDFCNIFTY', amcShort: 'HDFC MF',
      category: 'Index', benchmarkIndex: 'NIFTY 50', expenseRatio: 0.05, aum: '₹9,400 Cr',
      nav: 247.80, return1D: 0.40, return1Y: 13.9, return3Y: 11.8 },
    { id: 'e3', name: 'Mirae Asset NIFTY Next 50 ETF', symbol: 'MANXT50', amcShort: 'Mirae',
      category: 'Index', benchmarkIndex: 'NIFTY Next 50', expenseRatio: 0.07, aum: '₹3,100 Cr',
      nav: 71.20, return1D: 0.22, return1Y: 10.5, return3Y: 9.8 },
    { id: 'e4', name: 'Motilal Oswal NIFTY Midcap 150 ETF', symbol: 'MON100', amcShort: 'Motilal',
      category: 'Equity', benchmarkIndex: 'NIFTY Midcap 150', expenseRatio: 0.19, aum: '₹1,850 Cr',
      nav: 56.35, return1D: 0.65, return1Y: 18.4, return3Y: 17.2 },
    { id: 'e5', name: 'ICICI Pru NIFTY Bank ETF', symbol: 'BANKBEES', amcShort: 'ICICI Pru',
      category: 'Equity', benchmarkIndex: 'NIFTY Bank', expenseRatio: 0.18, aum: '₹4,200 Cr',
      nav: 494.60, return1D: -0.31, return1Y: 8.3, return3Y: 7.1 },
    // ── Gold ETFs ────────────────────────────────────────
    { id: 'e6', name: 'Nippon India ETF Gold BeES', symbol: 'GOLDBEES', amcShort: 'Nippon',
      category: 'Gold', benchmarkIndex: 'Domestic Gold', expenseRatio: 0.82, aum: '₹8,600 Cr',
      nav: 581.40, return1D: 0.18, return1Y: 22.1, return3Y: 13.4 },
    { id: 'e7', name: 'SBI ETF Gold', symbol: 'SBIETS', amcShort: 'SBI MF',
      category: 'Gold', benchmarkIndex: 'Domestic Gold', expenseRatio: 0.65, aum: '₹4,900 Cr',
      nav: 580.10, return1D: 0.17, return1Y: 21.9, return3Y: 13.1 },
    // ── Debt ETFs ────────────────────────────────────────
    { id: 'e8', name: 'Edelweiss BHARAT Bond ETF Apr 2032', symbol: 'EBBETF0432', amcShort: 'Edelweiss',
      category: 'Debt', benchmarkIndex: 'NIFTY BHARAT Bond', expenseRatio: 0.0005, aum: '₹16,200 Cr',
      nav: 1302.45, return1D: 0.04, return1Y: 7.8, return3Y: 7.2 },
    { id: 'e9', name: 'Mirae Asset Nifty SDL ETF', symbol: 'MIRAERAETF', amcShort: 'Mirae',
      category: 'Debt', benchmarkIndex: 'NIFTY SDL', expenseRatio: 0.10, aum: '₹560 Cr',
      nav: 12.05, return1D: 0.02, return1Y: 7.2, return3Y: 0.0 },
    // ── International ETFs ───────────────────────────────
    { id: 'e10', name: 'Motilal Oswal NASDAQ 100 ETF', symbol: 'MAN100', amcShort: 'Motilal',
      category: 'International', benchmarkIndex: 'NASDAQ 100', expenseRatio: 0.58, aum: '₹5,800 Cr',
      nav: 124.60, return1D: 1.12, return1Y: 28.5, return3Y: 19.8 },
    { id: 'e11', name: 'Mirae Asset NYSE FANG+ ETF', symbol: 'MAFANG', amcShort: 'Mirae',
      category: 'International', benchmarkIndex: 'NYSE FANG+', expenseRatio: 0.61, aum: '₹2,100 Cr',
      nav: 84.20, return1D: 1.35, return1Y: 31.2, return3Y: 22.1 },
];

const CATEGORY_TABS = ['All', 'Index', 'Equity', 'Gold', 'Debt', 'International'] as const;
type Category = typeof CATEGORY_TABS[number];

const SORT_OPTIONS = ['1D Return', '1Y Return', '3Y Return', 'AUM'] as const;
type SortBy = typeof SORT_OPTIONS[number];

function ETFRow({ item, onPress }: { item: ETFItem; onPress: () => void }) {
    const is1DPos = item.return1D >= 0;
    const is1YPos = item.return1Y >= 0;

    return (
        <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
                {/* Category icon */}
                <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
                    <Ionicons
                        name={getCategoryIconName(item.category)}
                        size={18}
                        color={getCategoryColor(item.category)}
                    />
                </View>
                <View style={styles.rowInfo}>
                    <Text style={styles.etfName} numberOfLines={2}>{item.name}</Text>
                    <View style={styles.rowMeta}>
                        <Text style={styles.amcText}>{item.amcShort}</Text>
                        <Text style={styles.dotSep}>·</Text>
                        <Text style={styles.expText}>ER: {item.expenseRatio}%</Text>
                        <Text style={styles.dotSep}>·</Text>
                        <Text style={styles.aumText}>{item.aum}</Text>
                    </View>
                </View>
            </View>
            <View style={styles.rowRight}>
                <Text style={styles.navText}>₹{item.nav.toFixed(2)}</Text>
                <View style={styles.returnsRow}>
                    <View style={[styles.returnPill, { backgroundColor: is1DPos ? Colors.gainBg : Colors.lossBg }]}>
                        <Text style={[styles.returnText, { color: is1DPos ? Colors.gain : Colors.loss }]}>
                            {is1DPos ? '+' : ''}{item.return1D.toFixed(2)}%
                        </Text>
                    </View>
                    <View style={[styles.returnPill, { backgroundColor: is1YPos ? Colors.gainBg : Colors.lossBg }]}>
                        <Text style={[styles.returnText, { color: is1YPos ? Colors.gain : Colors.loss }]}>
                            {is1YPos ? '+' : ''}{item.return1Y.toFixed(1)}%<Text style={styles.periodLabel}> 1Y</Text>
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

function getCategoryColor(cat: ETFItem['category']): string {
    switch (cat) {
        case 'Index': return Colors.primary;
        case 'Equity': return Colors.info;
        case 'Gold': return '#F59E0B';
        case 'Debt': return '#8B5CF6';
        case 'International': return '#EC4899';
        default: return Colors.textSecondary;
    }
}

function getCategoryIconName(cat: ETFItem['category']): any {
    switch (cat) {
        case 'Index': return 'trending-up';
        case 'Equity': return 'bar-chart';
        case 'Gold': return 'diamond';
        case 'Debt': return 'shield-checkmark';
        case 'International': return 'globe';
        default: return 'stats-chart';
    }
}

export default function ETFScreenerScreen() {
    const navigation = useNavigation<any>();
    const [activeCategory, setActiveCategory] = useState<Category>('All');
    const [sortBy, setSortBy] = useState<SortBy>('1Y Return');
    const [etfs, setEtfs] = useState<ETFItem[]>(ETF_DATA);
    const [refreshing, setRefreshing] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);

    const filtered = useMemo(() => {
        let list = activeCategory === 'All' ? etfs : etfs.filter(e => e.category === activeCategory);
        return [...list].sort((a, b) => {
            switch (sortBy) {
                case '1D Return': return b.return1D - a.return1D;
                case '1Y Return': return b.return1Y - a.return1Y;
                case '3Y Return': return b.return3Y - a.return3Y;
                default: return 0;
            }
        });
    }, [activeCategory, sortBy, etfs]);

    const onRefresh = async () => {
        setRefreshing(true);
        await new Promise(r => setTimeout(r, 700));
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
                    <Text style={styles.headerTitle}>ETF Screener</Text>
                    <Text style={styles.headerSubtitle}>{etfs.length} ETFs listed</Text>
                </View>
                <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSortMenu(v => !v)}>
                    <Ionicons name="funnel-outline" size={20} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Sort Menu */}
            {showSortMenu && (
                <View style={styles.sortMenu}>
                    {SORT_OPTIONS.map(opt => (
                        <TouchableOpacity
                            key={opt}
                            style={[styles.sortOption, sortBy === opt && styles.sortOptionActive]}
                            onPress={() => { setSortBy(opt); setShowSortMenu(false); }}
                        >
                            <Text style={[styles.sortOptionText, sortBy === opt && styles.sortOptionTextActive]}>
                                {opt}
                            </Text>
                            {sortBy === opt && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Category Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabBar}
            >
                {CATEGORY_TABS.map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeCategory === tab && { borderColor: getCategoryColor(tab as any), backgroundColor: getCategoryColor(tab as any) + '15' }]}
                        onPress={() => setActiveCategory(tab)}
                    >
                        <Text style={[styles.tabText, activeCategory === tab && { color: getCategoryColor(tab as any), fontWeight: FontWeight.bold }]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Data disclaimer */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, backgroundColor: '#FFF8E1', gap: 6 }}>
                <Ionicons name="information-circle-outline" size={14} color="#795548" />
                <Text style={{ fontSize: 11, color: '#795548', flex: 1 }}>NAV & returns shown are indicative. Verify with AMC for latest data.</Text>
            </View>

            {/* Column Labels */}
            <View style={styles.columnHeader}>
                <Text style={styles.colLabel}>ETF · AMC · AUM</Text>
                <Text style={styles.colLabel}>NAV · 1D · 1Y</Text>
            </View>

            <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <ETFRow
                        item={item}
                        onPress={() => Linking.openURL(`https://www.nseindia.com/get-quotes/equity?symbol=${item.symbol}`)}
                    />
                )}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
                }
                ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    sortBtn: { padding: Spacing.xs, width: 36, alignItems: 'flex-end' },
    headerText: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
    headerSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
    sortMenu: {
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        ...Shadow.md,
    },
    sortOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    sortOptionActive: { backgroundColor: Colors.primaryGlow },
    sortOptionText: { fontSize: FontSize.md, color: Colors.textPrimary },
    sortOptionTextActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
    tabBar: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        gap: Spacing.sm,
        backgroundColor: Colors.surface,
    },
    tab: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    tabText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
    columnHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.surfaceLight,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    colLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, fontWeight: FontWeight.medium },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.surface,
    },
    rowLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, marginRight: Spacing.sm },
    categoryIcon: { width: 36, height: 36, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm, marginTop: 2 },
    rowInfo: { flex: 1 },
    etfName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, lineHeight: 18 },
    rowMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' },
    amcText: { fontSize: FontSize.xs, color: Colors.textSecondary },
    dotSep: { marginHorizontal: 4, color: Colors.textTertiary, fontSize: FontSize.xs },
    expText: { fontSize: FontSize.xs, color: Colors.textTertiary },
    aumText: { fontSize: FontSize.xs, color: Colors.textTertiary },
    rowRight: { alignItems: 'flex-end', minWidth: 100 },
    navText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 4 },
    returnsRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' },
    returnPill: {
        paddingHorizontal: 6, paddingVertical: 3,
        borderRadius: BorderRadius.sm,
    },
    returnText: { fontSize: 10, fontWeight: FontWeight.bold },
    periodLabel: { fontSize: 9, fontWeight: FontWeight.regular },
    separator: { height: 1, backgroundColor: Colors.borderLight, marginLeft: Spacing.lg + 36 + Spacing.sm },
});
