// Stocks SIP Screen — Stock-specific SIP calculator with projected value
import React, { useState, useMemo, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
    StatusBar, Modal, FlatList, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../constants/theme';
import { formatRupee, cleanTicker } from '../utils/formatters';
import { calculateSIP } from '../utils/calculations';
import SEBIDisclaimer from '../components/common/SEBIDisclaimer';
import CompanyLogo from '../components/common/CompanyLogo';
import { searchStocks, getQuotes } from '../api/marketApi';
import { StockQuote } from '../types';

const { width } = Dimensions.get('window');

// Quality large-cap suggestions suitable for long-term SIP
const SUGGESTED_SIP_STOCKS = [
    { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Conglomerate', avgCagr: 14 },
    { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', avgCagr: 18 },
    { symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banking', avgCagr: 16 },
    { symbol: 'INFY', name: 'Infosys', sector: 'IT', avgCagr: 15 },
    { symbol: 'TITAN', name: 'Titan Company', sector: 'Consumer', avgCagr: 20 },
    { symbol: 'BAJFINANCE', name: 'Bajaj Finance', sector: 'NBFC', avgCagr: 22 },
    { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG', avgCagr: 13 },
    { symbol: 'NESTLEIND', name: 'Nestle India', sector: 'FMCG', avgCagr: 14 },
    { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Banking', avgCagr: 17 },
    { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', sector: 'Pharma', avgCagr: 13 },
];

const AMOUNT_PRESETS = [500, 1000, 2000, 5000, 10000];
const YEAR_PRESETS = [1, 3, 5, 10, 15, 20];
const CAGR_PRESETS = [8, 10, 12, 15, 18, 20];

interface SIPSummary {
    futureValue: number;
    totalInvested: number;
    totalReturns: number;
    monthlyAmount: number;
    years: number;
    cagr: number;
}

function SIPGauge({ invested, returns }: { invested: number; returns: number }) {
    const total = invested + returns;
    const investedPct = total > 0 ? (invested / total) * 100 : 50;
    const returnsPct = 100 - investedPct;
    return (
        <View style={styles.gaugeContainer}>
            <View style={styles.gaugeBar}>
                <View style={[styles.gaugeInvested, { width: `${investedPct}%` as any }]} />
                <View style={[styles.gaugeReturns, { width: `${returnsPct}%` as any }]} />
            </View>
            <View style={styles.gaugeLegend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.info }]} />
                    <Text style={styles.legendText}>Invested ({investedPct.toFixed(0)}%)</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.gain }]} />
                    <Text style={styles.legendText}>Returns ({returnsPct.toFixed(0)}%)</Text>
                </View>
            </View>
        </View>
    );
}

function ResultCard({ summary }: { summary: SIPSummary }) {
    const multiplier = summary.totalInvested > 0 ? summary.futureValue / summary.totalInvested : 1;
    return (
        <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Projected Value</Text>
            <Text style={styles.resultValue}>{formatRupee(summary.futureValue)}</Text>
            <View style={styles.resultRow}>
                <View style={styles.resultItem}>
                    <Text style={styles.resultItemLabel}>Total Invested</Text>
                    <Text style={styles.resultItemValue}>{formatRupee(summary.totalInvested)}</Text>
                </View>
                <View style={styles.resultDivider} />
                <View style={styles.resultItem}>
                    <Text style={styles.resultItemLabel}>Est. Returns</Text>
                    <Text style={[styles.resultItemValue, { color: Colors.gain }]}>
                        +{formatRupee(summary.totalReturns)}
                    </Text>
                </View>
                <View style={styles.resultDivider} />
                <View style={styles.resultItem}>
                    <Text style={styles.resultItemLabel}>Multiplier</Text>
                    <Text style={[styles.resultItemValue, { color: Colors.primary }]}>
                        {multiplier.toFixed(1)}x
                    </Text>
                </View>
            </View>
            <SIPGauge invested={summary.totalInvested} returns={summary.totalReturns} />
        </View>
    );
}

export default function StocksSIPScreen() {
    const navigation = useNavigation<any>();
    const [selectedStock, setSelectedStock] = useState<{ symbol: string; name: string } | null>(null);
    const [monthlyAmount, setMonthlyAmount] = useState('5000');
    const [years, setYears] = useState('10');
    const [cagr, setCagr] = useState('12');
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<StockQuote[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const summary: SIPSummary = useMemo(() => {
        const amt = Math.max(0, Number(monthlyAmount) || 0);
        const yr = Math.max(1, Math.min(50, Number(years) || 1));
        const rate = Math.max(1, Math.min(50, Number(cagr) || 1));
        const { futureValue, totalInvested, totalReturns } = calculateSIP(amt, rate, yr);
        return { futureValue, totalInvested, totalReturns, monthlyAmount: amt, years: yr, cagr: rate };
    }, [monthlyAmount, years, cagr]);

    const handleSearch = useCallback(async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) { setSearchResults([]); return; }
        setIsSearching(true);
        const results = await searchStocks(query);
        setSearchResults(results.slice(0, 8));
        setIsSearching(false);
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Stocks SIP</Text>
                <View style={{ width: 36 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    {/* Stock Selector */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Select Stock</Text>
                        <TouchableOpacity style={styles.stockSelector} onPress={() => setShowSearch(true)}>
                            {selectedStock ? (
                                <View style={styles.selectedStockRow}>
                                    <CompanyLogo symbol={selectedStock.symbol} size={36} />
                                    <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                                        <Text style={styles.selectedSymbol}>{selectedStock.symbol}</Text>
                                        <Text style={styles.selectedName} numberOfLines={1}>{selectedStock.name}</Text>
                                    </View>
                                    <Ionicons name="swap-horizontal" size={18} color={Colors.primary} />
                                </View>
                            ) : (
                                <View style={styles.stockPlaceholderRow}>
                                    <Ionicons name="search" size={18} color={Colors.textTertiary} />
                                    <Text style={styles.stockPlaceholderText}>Search for a stock...</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Monthly Amount */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Monthly SIP Amount (₹)</Text>
                        <TextInput
                            style={styles.inputField}
                            keyboardType="numeric"
                            value={monthlyAmount}
                            onChangeText={setMonthlyAmount}
                            placeholder="e.g. 5000"
                            placeholderTextColor={Colors.textTertiary}
                        />
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
                            {AMOUNT_PRESETS.map(p => (
                                <TouchableOpacity
                                    key={p}
                                    style={[styles.preset, monthlyAmount === String(p) && styles.presetActive]}
                                    onPress={() => setMonthlyAmount(String(p))}
                                >
                                    <Text style={[styles.presetText, monthlyAmount === String(p) && styles.presetTextActive]}>
                                        ₹{p >= 1000 ? `${p / 1000}K` : p}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Duration */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Duration: <Text style={styles.sectionValue}>{years} years</Text></Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
                            {YEAR_PRESETS.map(y => (
                                <TouchableOpacity
                                    key={y}
                                    style={[styles.preset, years === String(y) && styles.presetActive]}
                                    onPress={() => setYears(String(y))}
                                >
                                    <Text style={[styles.presetText, years === String(y) && styles.presetTextActive]}>
                                        {y}yr
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Expected CAGR */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Expected CAGR: <Text style={styles.sectionValue}>{cagr}%</Text></Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
                            {CAGR_PRESETS.map(r => (
                                <TouchableOpacity
                                    key={r}
                                    style={[styles.preset, cagr === String(r) && styles.presetActive]}
                                    onPress={() => setCagr(String(r))}
                                >
                                    <Text style={[styles.presetText, cagr === String(r) && styles.presetTextActive]}>
                                        {r}%
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Result */}
                    <ResultCard summary={summary} />

                    {/* Suggested SIP Stocks */}
                    <View style={styles.suggestedSection}>
                        <Text style={styles.suggestedTitle}>Suggested SIP Stocks</Text>
                        <Text style={styles.suggestedSubtitle}>Quality large-caps with strong long-term track record</Text>
                        {SUGGESTED_SIP_STOCKS.map(stock => (
                            <TouchableOpacity
                                key={stock.symbol}
                                style={styles.suggestedRow}
                                onPress={() => {
                                    setSelectedStock({ symbol: stock.symbol, name: stock.name });
                                    setCagr(String(stock.avgCagr));
                                }}
                                activeOpacity={0.7}
                            >
                                <CompanyLogo symbol={stock.symbol} size={40} />
                                <View style={styles.suggestedInfo}>
                                    <Text style={styles.suggestedSymbol}>{stock.symbol}</Text>
                                    <Text style={styles.suggestedName} numberOfLines={1}>{stock.name}</Text>
                                    <Text style={styles.suggestedSector}>{stock.sector}</Text>
                                </View>
                                <View style={styles.suggestedCagr}>
                                    <Text style={styles.suggestedCagrLabel}>Hist. CAGR</Text>
                                    <Text style={[styles.suggestedCagrValue, { color: Colors.gain }]}>~{stock.avgCagr}%</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <SEBIDisclaimer />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Search Modal */}
            <Modal visible={showSearch} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Stock</Text>
                            <TouchableOpacity onPress={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}>
                                <Ionicons name="close" size={24} color={Colors.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search stock name or symbol..."
                            placeholderTextColor={Colors.textTertiary}
                            value={searchQuery}
                            onChangeText={handleSearch}
                            autoFocus
                        />
                        <FlatList
                            data={searchResults.length > 0 ? searchResults : (searchQuery.length < 2 ? SUGGESTED_SIP_STOCKS.map(s => ({ symbol: s.symbol, name: s.name } as any)) : [])}
                            keyExtractor={item => item.symbol}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.searchResultRow}
                                    onPress={() => {
                                        setSelectedStock({ symbol: item.symbol, name: item.name });
                                        setShowSearch(false);
                                        setSearchQuery('');
                                        setSearchResults([]);
                                    }}
                                >
                                    <CompanyLogo symbol={item.symbol} size={36} />
                                    <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
                                        <Text style={styles.searchResultSymbol}>{cleanTicker(item.symbol)}</Text>
                                        <Text style={styles.searchResultName} numberOfLines={1}>{item.name}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={{ paddingBottom: 40 }}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </View>
            </Modal>
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
    headerTitle: { flex: 1, textAlign: 'center', fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
    scrollContent: { paddingBottom: 60 },
    section: {
        backgroundColor: Colors.surface, marginTop: Spacing.sm,
        paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
    },
    sectionLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium, marginBottom: Spacing.sm },
    sectionValue: { color: Colors.textPrimary, fontWeight: FontWeight.bold },
    stockSelector: {
        borderWidth: 1, borderColor: Colors.border,
        borderRadius: BorderRadius.lg, padding: Spacing.md,
    },
    selectedStockRow: { flexDirection: 'row', alignItems: 'center' },
    selectedSymbol: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
    selectedName: { fontSize: FontSize.xs, color: Colors.textSecondary },
    stockPlaceholderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    stockPlaceholderText: { color: Colors.textTertiary, fontSize: FontSize.md },
    inputField: {
        borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
        fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    presetRow: { gap: Spacing.sm, paddingVertical: Spacing.xs },
    preset: {
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border,
    },
    presetActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
    presetText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
    presetTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
    resultCard: {
        backgroundColor: Colors.surface, marginTop: Spacing.sm,
        padding: Spacing.xl, ...Shadow.sm,
    },
    resultTitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xs },
    resultValue: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: Colors.primary, marginBottom: Spacing.md },
    resultRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
    resultItem: { flex: 1, alignItems: 'center' },
    resultItemLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, marginBottom: 4 },
    resultItemValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
    resultDivider: { width: 1, height: 30, backgroundColor: Colors.border },
    gaugeContainer: { gap: Spacing.sm },
    gaugeBar: { flexDirection: 'row', height: 12, borderRadius: BorderRadius.full, overflow: 'hidden', backgroundColor: Colors.surfaceLight },
    gaugeInvested: { height: '100%', backgroundColor: Colors.info },
    gaugeReturns: { height: '100%', backgroundColor: Colors.gain },
    gaugeLegend: { flexDirection: 'row', justifyContent: 'space-around' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: FontSize.xs, color: Colors.textSecondary },
    suggestedSection: { backgroundColor: Colors.surface, marginTop: Spacing.sm, paddingBottom: Spacing.md },
    suggestedTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, marginBottom: 4 },
    suggestedSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
    suggestedRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight },
    suggestedInfo: { flex: 1, marginLeft: Spacing.sm },
    suggestedSymbol: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
    suggestedName: { fontSize: FontSize.xs, color: Colors.textSecondary },
    suggestedSector: { fontSize: FontSize.xs, color: Colors.primary, marginTop: 2 },
    suggestedCagr: { alignItems: 'flex-end', marginRight: Spacing.sm },
    suggestedCagrLabel: { fontSize: FontSize.xs, color: Colors.textTertiary },
    suggestedCagrValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
    modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
    modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: Spacing.xl, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
    modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
    searchInput: { marginHorizontal: Spacing.xl, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.md, color: Colors.textPrimary },
    searchResultRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    searchResultSymbol: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
    searchResultName: { fontSize: FontSize.xs, color: Colors.textSecondary },
});
