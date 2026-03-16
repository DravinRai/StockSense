// Intraday Screen — Real data: volume + price momentum, RSI, support/resistance
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    StatusBar, ScrollView, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../constants/theme';
import { formatRupee, formatPercent, formatVolume, getChangeColor } from '../utils/formatters';
import { calculateRSI } from '../utils/indicators';
import LoadingShimmer from '../components/common/LoadingShimmer';
import MiniSparkline from '../components/common/MiniSparkline';
import CompanyLogo from '../components/common/CompanyLogo';
import SEBIDisclaimer from '../components/common/SEBIDisclaimer';
import { getQuotes, getBatchSparklines } from '../api/marketApi';
import { StockQuote } from '../types';

const INTRADAY_WATCHLIST = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'SBIN',
    'TATAMOTORS', 'TATASTEEL', 'ICICIBANK', 'BHARTIARTL', 'AXISBANK',
    'WIPRO', 'ADANIENT', 'KOTAKBANK', 'HINDUNILVR', 'BAJFINANCE',
    'SUNPHARMA', 'NTPC', 'POWERGRID', 'ONGC', 'COALINDIA',
    'TECHM', 'HCLTECH', 'MARUTI', 'TITAN', 'NESTLEIND',
];

interface IntradayStock extends StockQuote {
    signal: 'Bullish' | 'Bearish' | 'Neutral';
    rsi: number;
    volumeRatio: number;   // volume / typical avg
    momentum: 'Strong' | 'Moderate' | 'Weak';
    nearSupport: boolean;
    nearResistance: boolean;
    sparkline: number[];
}

type FilterType = 'All' | 'Bullish' | 'Bearish' | 'High Volume' | 'RSI Neutral';

function computeSignal(stock: StockQuote, rsi: number, volumeRatio: number): IntradayStock['signal'] {
    if (stock.changePercent > 1.5 && rsi < 70 && volumeRatio > 1.5) return 'Bullish';
    if (stock.changePercent < -1.5 && rsi > 30 && volumeRatio > 1.5) return 'Bearish';
    if (stock.changePercent > 0.5 && rsi < 65) return 'Bullish';
    if (stock.changePercent < -0.5 && rsi > 35) return 'Bearish';
    return 'Neutral';
}

function computeMomentum(pct: number): IntradayStock['momentum'] {
    const abs = Math.abs(pct);
    if (abs > 2) return 'Strong';
    if (abs > 0.8) return 'Moderate';
    return 'Weak';
}

function StockCard({ item, onPress }: { item: IntradayStock; onPress: () => void }) {
    const changeColor = getChangeColor(item.changePercent);
    const isPositive = item.changePercent >= 0;
    const signalColor = item.signal === 'Bullish' ? Colors.gain : item.signal === 'Bearish' ? Colors.loss : Colors.textSecondary;
    const signalBg = item.signal === 'Bullish' ? Colors.gainBg : item.signal === 'Bearish' ? Colors.lossBg : Colors.surfaceLight;

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
            {/* Top Row: Logo + Name + Signal badge */}
            <View style={styles.cardTop}>
                <CompanyLogo symbol={item.symbol} size={40} />
                <View style={styles.cardInfo}>
                    <Text style={styles.symbolText}>{item.symbol}</Text>
                    <Text style={styles.nameText} numberOfLines={1}>{item.name}</Text>
                </View>
                <View style={[styles.signalBadge, { backgroundColor: signalBg }]}>
                    <Ionicons
                        name={item.signal === 'Bullish' ? 'trending-up' : item.signal === 'Bearish' ? 'trending-down' : 'remove'}
                        size={12}
                        color={signalColor}
                    />
                    <Text style={[styles.signalText, { color: signalColor }]}>{item.signal}</Text>
                </View>
            </View>

            {/* Middle Row: Price + Sparkline */}
            <View style={styles.cardMid}>
                <View>
                    <Text style={styles.priceText}>{formatRupee(item.ltp)}</Text>
                    <View style={[styles.changePill, { backgroundColor: isPositive ? Colors.gainBg : Colors.lossBg }]}>
                        <Text style={[styles.changeText, { color: changeColor }]}>
                            {isPositive ? '▲' : '▼'} {formatPercent(item.changePercent)}
                        </Text>
                    </View>
                </View>
                <MiniSparkline
                    data={item.sparkline}
                    width={80}
                    height={36}
                    isPositive={isPositive}
                />
            </View>

            {/* Bottom Row: Metrics */}
            <View style={styles.cardMetrics}>
                <MetricChip label="RSI" value={item.rsi.toFixed(0)} color={
                    item.rsi > 70 ? Colors.loss : item.rsi < 30 ? Colors.gain : Colors.info
                } />
                <MetricChip
                    label="Volume"
                    value={`${item.volumeRatio.toFixed(1)}x`}
                    color={item.volumeRatio >= 2 ? Colors.warning : Colors.textSecondary}
                />
                <MetricChip label="Momentum" value={item.momentum} color={
                    item.momentum === 'Strong' ? Colors.primary
                    : item.momentum === 'Moderate' ? Colors.warning
                    : Colors.textTertiary
                } />
                {item.nearSupport && (
                    <MetricChip label="Near Support" value="↓" color={Colors.gain} />
                )}
                {item.nearResistance && (
                    <MetricChip label="Near Resistance" value="↑" color={Colors.loss} />
                )}
            </View>
        </TouchableOpacity>
    );
}

function MetricChip({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <View style={[styles.metricChip, { borderColor: color + '40' }]}>
            <Text style={[styles.metricLabel, { color: Colors.textTertiary }]}>{label} </Text>
            <Text style={[styles.metricValue, { color }]}>{value}</Text>
        </View>
    );
}

export default function IntradayScreen() {
    const navigation = useNavigation<any>();
    const [stocks, setStocks] = useState<IntradayStock[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterType>('All');
    const [error, setError] = useState<string | null>(null);

    const FILTERS: FilterType[] = ['All', 'Bullish', 'Bearish', 'High Volume', 'RSI Neutral'];

    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const [quotes, sparklines] = await Promise.all([
                getQuotes(INTRADAY_WATCHLIST),
                getBatchSparklines(INTRADAY_WATCHLIST),
            ]);

            const enriched: IntradayStock[] = quotes.map(q => {
                const sparkData: number[] = sparklines[q.symbol] || [];
                const rsi = sparkData.length > 14 ? calculateRSI(sparkData) : 50;
                // Estimate volume ratio: use volume vs. a rough "normal" based on market cap tier
                const expectedVol = q.marketCap && q.marketCap > 500000000000 ? 8000000 : 2000000;
                const volumeRatio = q.volume > 0 ? q.volume / expectedVol : 1;

                // Support = low of day, Resistance = high of day
                const range = q.high - q.low;
                const nearSupport = range > 0 && (q.ltp - q.low) / range < 0.15;
                const nearResistance = range > 0 && (q.high - q.ltp) / range < 0.15;

                return {
                    ...q,
                    signal: computeSignal(q, rsi, volumeRatio),
                    rsi,
                    volumeRatio,
                    momentum: computeMomentum(q.changePercent),
                    nearSupport,
                    nearResistance,
                    sparkline: sparkData,
                };
            });

            // Sort by absolute change % desc
            enriched.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
            setStocks(enriched);
        } catch (e) {
            setError('Failed to load intraday data. Check your connection.');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = stocks.filter(s => {
        switch (activeFilter) {
            case 'Bullish': return s.signal === 'Bullish';
            case 'Bearish': return s.signal === 'Bearish';
            case 'High Volume': return s.volumeRatio >= 2;
            case 'RSI Neutral': return s.rsi >= 40 && s.rsi <= 60;
            default: return true;
        }
    });

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const bullishCount = stocks.filter(s => s.signal === 'Bullish').length;
    const bearishCount = stocks.filter(s => s.signal === 'Bearish').length;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Intraday Screener</Text>
                    {!isLoading && (
                        <Text style={styles.headerSubtitle}>
                            <Text style={{ color: Colors.gain }}>▲ {bullishCount} Bullish</Text>
                            {'  '}
                            <Text style={{ color: Colors.loss }}>▼ {bearishCount} Bearish</Text>
                        </Text>
                    )}
                </View>
                <TouchableOpacity style={styles.refreshBtn} onPress={() => { setIsLoading(true); fetchData(); }}>
                    <Ionicons name="refresh-outline" size={20} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
                {FILTERS.map(f => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
                        onPress={() => setActiveFilter(f)}
                    >
                        <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Info Banner */}
            <View style={styles.infoBanner}>
                <Ionicons name="information-circle-outline" size={14} color={Colors.info} />
                <Text style={styles.infoBannerText}>
                    Signals based on price momentum, RSI and volume ratio vs average. Not buy/sell recommendations.
                </Text>
            </View>

            {isLoading ? (
                <View style={{ padding: Spacing.xl, gap: Spacing.md }}>
                    {[1, 2, 3, 4].map(k => (
                        <LoadingShimmer key={k} width="100%" height={120} borderRadius={BorderRadius.lg} />
                    ))}
                </View>
            ) : error ? (
                <View style={styles.errorBox}>
                    <Ionicons name="cloud-offline-outline" size={40} color={Colors.textTertiary} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={() => { setIsLoading(true); fetchData(); }} style={styles.retryBtn}>
                        <Text style={styles.retryBtnText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.symbol}
                    renderItem={({ item }) => (
                        <StockCard
                            item={item}
                            onPress={() => navigation.navigate('StockDetail', { symbol: item.symbol })}
                        />
                    )}
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
                        <View style={styles.emptyBox}>
                            <Ionicons name="search-outline" size={40} color={Colors.textTertiary} />
                            <Text style={styles.emptyText}>No stocks match this filter</Text>
                        </View>
                    }
                    ListFooterComponent={<SEBIDisclaimer />}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingTop: 56, paddingBottom: Spacing.md,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    backBtn: { padding: Spacing.xs, width: 36 },
    refreshBtn: { padding: Spacing.xs, width: 36, alignItems: 'flex-end' },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
    headerSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
    filterBar: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, gap: Spacing.sm, backgroundColor: Colors.surface },
    filterChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
    filterChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
    filterText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
    filterTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
    infoBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, backgroundColor: Colors.infoBg },
    infoBannerText: { fontSize: FontSize.xs, color: Colors.textSecondary, flex: 1 },
    listContent: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 40 },
    card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, ...Shadow.sm },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
    cardInfo: { flex: 1, marginLeft: Spacing.sm },
    symbolText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
    nameText: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 1 },
    signalBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full },
    signalText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
    cardMid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
    priceText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 4 },
    changePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full, alignSelf: 'flex-start' },
    changeText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
    cardMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
    metricChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 3, borderRadius: BorderRadius.sm, borderWidth: 1 },
    metricLabel: { fontSize: 10 },
    metricValue: { fontSize: 10, fontWeight: FontWeight.bold },
    errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.huge },
    errorText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
    retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
    retryBtnText: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
    emptyBox: { alignItems: 'center', gap: Spacing.md, padding: Spacing.huge },
    emptyText: { fontSize: FontSize.md, color: Colors.textSecondary },
});
