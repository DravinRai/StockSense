// Pattern Scanner Screen — Live pattern detection via Yahoo Finance historical data
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Modal, ScrollView, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../constants/theme';
import { mockPatternResults, mockGlossary } from '../data/mockData';
import { formatRupee, formatPercent, formatTimeAgo, cleanTicker } from '../utils/formatters';
import { PatternResult } from '../types';
import EmptyState from '../components/common/EmptyState';
import { getQuotes, getStockChart } from '../api/marketApi';
import { calculateRSI, calculateMACD, calculateBollingerBands } from '../utils/indicators';

// Stocks to scan for patterns
const SCAN_STOCKS = [
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
    'SBIN.NS', 'AXISBANK.NS', 'BAJFINANCE.NS', 'MARUTI.NS', 'TATASTEEL.NS',
    'WIPRO.NS', 'NTPC.NS', 'POWERGRID.NS', 'SUNPHARMA.NS', 'DRREDDY.NS',
    'TATAMOTORS.NS', 'ADANIPORTS.NS', 'ULTRACEMCO.NS', 'TECHM.NS', 'HCLTECH.NS',
];

function sma(data: number[], period: number): number {
    if (data.length < period) return 0;
    const slice = data.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
}

export default function PatternScannerScreen() {
    const navigation = useNavigation<any>();
    const [activeFilter, setActiveFilter] = useState<string>('All');
    const [selectedPattern, setSelectedPattern] = useState<any>(null);
    const [patterns, setPatterns] = useState<any[]>([]);
    const [isScanning, setIsScanning] = useState(true);
    const [scanProgress, setScanProgress] = useState({ current: 0, total: 20 });
    const [scanError, setScanError] = useState<string | null>(null);
    const [lastScan, setLastScan] = useState<Date | null>(null);

    const filters = ['All', 'Bullish', 'Bearish', 'Volume', 'Value'];

    const runScan = useCallback(async () => {
        setIsScanning(true);
        setScanError(null);
        setScanProgress({ current: 0, total: SCAN_STOCKS.length });
        try {
            const quotes = await getQuotes(SCAN_STOCKS);
            const detected: any[] = [];

            for (let i = 0; i < SCAN_STOCKS.length; i++) {
                const sym = SCAN_STOCKS[i];
                setScanProgress({ current: i + 1, total: SCAN_STOCKS.length });
                try {
                    const hist = await getStockChart(sym, '1Y');
                    const quote = quotes.find(q =>
                        cleanTicker(q.symbol) === cleanTicker(sym) || q.symbol === sym
                    );
                    if (!hist || hist.length < 20) continue;

                    const closes = hist.map(c => c.close).filter(c => c > 0);
                    const volumes = hist.map(c => c.volume ?? 0);
                    if (closes.length < 20) continue;

                    const ltp = quote?.ltp || closes[closes.length - 1];
                    const rsi = calculateRSI(closes, 14);
                    const sma50 = sma(closes, Math.min(50, closes.length));
                    const sma200 = closes.length >= 200 ? sma(closes, 200) : 0;
                    
                    const sma50_prev = closes.length >= 53 ? sma(closes.slice(0, -3), 50) : sma50;
                    const sma200_prev = closes.length >= 203 ? sma(closes.slice(0, -3), 200) : sma200;

                    const avgVol20 = sma(volumes, Math.min(20, volumes.length));
                    const todayVol = quote?.volume || volumes[volumes.length - 1] || 0;
                    const week52High = quote?.week52High || Math.max(...closes);
                    const week52Low = quote?.week52Low || Math.min(...closes);
                    const changePercent = quote?.changePercent || 0;

                    const add = (
                        patternName: string,
                        sentiment: 'Bullish' | 'Bearish' | 'Volume' | 'Value',
                        reliability: 'High' | 'Medium' | 'Low',
                        desc: string
                    ) => {
                        detected.push({
                            id: `${sym}_${patternName.replace(/\s+/g, '_')}_${Date.now()}`,
                            symbol: sym,
                            patternName,
                            sentiment,
                            reliability,
                            targetPrice: Math.round(ltp * (sentiment === 'Bearish' ? 0.95 : 1.05)),
                            stopLoss: Math.round(ltp * (sentiment === 'Bearish' ? 1.05 : 0.95)),
                            detectedAt: new Date().toISOString(),
                            description: desc,
                            changePercent
                        });
                    };

                    // Golden Cross
                    if (sma200 > 0 && sma50 > sma200 && sma50_prev <= sma200_prev) {
                        add('Golden Cross', 'Bullish', 'High', '50-day SMA crossed above 200-day SMA');
                    }
                    // Death Cross
                    if (sma200 > 0 && sma50 < sma200 && sma50_prev >= sma200_prev) {
                        add('Death Cross', 'Bearish', 'High', '50-day SMA crossed below 200-day SMA');
                    }
                    // RSI Oversold
                    if (rsi < 30) {
                        add('RSI Oversold', 'Bullish', 'Medium', `RSI is ${Math.round(rsi)} (< 30)`);
                    }
                    // RSI Overbought
                    if (rsi > 70) {
                        add('RSI Overbought', 'Bearish', 'Medium', `RSI is ${Math.round(rsi)} (> 70)`);
                    }
                    // Volume Spike
                    if (avgVol20 > 0 && todayVol > avgVol20 * 2.0) {
                        add('Volume Spike', 'Volume', 'Medium', `Today's volume is > 2x the 20-day avg`);
                    }
                    // Near 52W High
                    if (week52High > 0 && ltp >= week52High * 0.97 && ltp <= week52High * 1.03) {
                        add('Near 52W High', 'Value', 'High', `Price is within 3% of 52-week high`);
                    }
                    // Near 52W Low
                    if (week52Low > 0 && ltp <= week52Low * 1.05 && ltp >= week52Low * 0.95) {
                        add('Near 52W Low', 'Value', 'Medium', `Price is within 5% of 52-week low`);
                    }
                } catch (e) {
                    console.warn(`Failed to scan ${sym}`);
                }
            }

            detected.sort((a, b) => {
                const isCrossA = a.patternName.includes('Cross') ? 1 : 0;
                const isCrossB = b.patternName.includes('Cross') ? 1 : 0;
                return isCrossB - isCrossA;
            });

            setPatterns(detected);
            setLastScan(new Date());
        } catch {
            setScanError('Scan failed — please check connection.');
            setPatterns([]);
        } finally {
            setIsScanning(false);
        }
    }, []);

    useEffect(() => { runScan(); }, [runScan]);

    const filteredResults = patterns.filter(item => {
        if (activeFilter === 'All') return true;
        return item.sentiment === activeFilter;
    });

    const getSentimentIcon = (sentiment: string) => {
        switch (sentiment) {
            case 'Bullish': return 'trending-up';
            case 'Bearish': return 'trending-down';
            case 'Volume': return 'bar-chart';
            case 'Value': return 'pricetag';
            default: return 'remove-outline';
        }
    };

    const renderPatternCard = ({ item }: { item: any }) => {
        let color = Colors.textSecondary;
        let bg = Colors.surfaceLight;
        if (item.sentiment === 'Bullish') { color = Colors.gain; bg = Colors.gainBg; }
        else if (item.sentiment === 'Bearish') { color = Colors.loss; bg = Colors.lossBg; }
        else if (item.sentiment === 'Volume') { color = Colors.warning; bg = Colors.warningBg; }
        else if (item.sentiment === 'Value') { color = Colors.primary; bg = Colors.primaryGlow; }

        const cp = item.changePercent || 0;
        const cpColor = cp >= 0 ? Colors.gain : Colors.loss;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => setSelectedPattern(item)}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.titleRow}>
                        <Text style={styles.symbol}>{item.symbol}</Text>
                        <Text style={[styles.symbolChange, { color: cpColor, paddingLeft: 4, fontWeight: '600' }]}>
                            {cp >= 0 ? '+' : ''}{cp.toFixed(2)}%
                        </Text>
                    </View>
                    <View style={[styles.sentimentBadge, { backgroundColor: bg }]}>
                        <Ionicons name={getSentimentIcon(item.sentiment)} size={12} color={color} />
                        <Text style={[styles.sentimentText, { color }]}>{item.sentiment}</Text>
                    </View>
                </View>

                <View style={[styles.cardBody, { flexDirection: 'column', gap: 6 }]}>
                    <Text style={styles.value}>{item.patternName}</Text>
                    <Text style={{ fontSize: FontSize.xs, color: Colors.textSecondary }}>{item.description}</Text>
                </View>

                <View style={styles.cardFooter}>
                    <Text style={styles.reliabilityLabel}>Strength:</Text>
                    <View style={styles.dotsRow}>
                        {[1, 2, 3].map(i => {
                            let fill = false;
                            if (item.reliability === 'High') fill = true;
                            else if (item.reliability === 'Medium' && i <= 2) fill = true;
                            else if (item.reliability === 'Low' && i === 1) fill = true;

                            return (
                                <View
                                    key={i}
                                    style={[styles.dot, fill && styles.dotFilled]}
                                />
                            );
                        })}
                    </View>
                    <Text style={styles.reliabilityText}>{item.reliability}</Text>
                    <Text style={[styles.timeAgo, { marginLeft: 'auto' }]}>{formatTimeAgo(item.detectedAt)}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderDetailModal = () => {
        if (!selectedPattern) return null;

        // Find matching glossary term for explanation
        // Using simple substring match to find generic terms inside specific patterns
        // e.g. matching "Head & Shoulders" to "Head & Shoulders Top"
        const explanation = mockGlossary.find(g =>
            selectedPattern.patternName.toLowerCase().includes(g.term.toLowerCase())
        );

        const isBull = selectedPattern.sentiment === 'Bullish';
        const color = isBull ? Colors.gain : Colors.loss;

        return (
            <Modal visible={!!selectedPattern} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{selectedPattern.patternName}</Text>
                            <TouchableOpacity onPress={() => setSelectedPattern(null)}>
                                <Ionicons name="close" size={24} color={Colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.modalScroll}>
                            <View style={styles.symbolHeader}>
                                <Text style={styles.modalSymbol}>{selectedPattern.symbol}</Text>
                                <View style={[styles.sentimentBadgeXL, { backgroundColor: isBull ? Colors.gainBg : Colors.lossBg }]}>
                                    <Ionicons name={getSentimentIcon(selectedPattern.sentiment)} size={16} color={color} />
                                    <Text style={[styles.sentimentTextXL, { color }]}>{selectedPattern.sentiment}</Text>
                                </View>
                            </View>

                            <View style={styles.targetBox}>
                                <View style={styles.targetCol}>
                                    <Text style={styles.targetLabel}>Target Price</Text>
                                    <Text style={[styles.targetValue, { color }]}>{formatRupee(selectedPattern.targetPrice)}</Text>
                                </View>
                                <View style={styles.targetDivider} />
                                <View style={styles.targetCol}>
                                    <Text style={styles.targetLabel}>Stop Loss</Text>
                                    <Text style={styles.targetValueSL}>{formatRupee(selectedPattern.stopLoss)}</Text>
                                </View>
                            </View>

                            <View style={styles.explanationBox}>
                                <Text style={styles.detailTitle}>What does this mean?</Text>
                                <Text style={styles.detailText}>
                                    {explanation?.shortDefinition || `A ${selectedPattern.sentiment.toLowerCase()} technical formation indicating potential price movement towards ${formatRupee(selectedPattern.targetPrice)}.`}
                                </Text>

                                {explanation?.example && (
                                    <View style={styles.exampleBox}>
                                        <Text style={styles.exampleTitle}>Example:</Text>
                                        <Text style={styles.exampleText}>{explanation.example}</Text>
                                    </View>
                                )}
                            </View>

                            <TouchableOpacity
                                style={styles.tradeBtn}
                                onPress={() => {
                                    setSelectedPattern(null);
                                    navigation.navigate('StockDetail', { symbol: selectedPattern.symbol });
                                }}
                            >
                                <Text style={styles.tradeBtnText}>View Chart for {selectedPattern.symbol}</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Pattern Scanner</Text>
                    {lastScan && !isScanning && (
                        <Text style={styles.headerSub}>
                            Scanned {SCAN_STOCKS.length} stocks · {lastScan.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    )}
                </View>
                <TouchableOpacity
                    onPress={runScan}
                    disabled={isScanning}
                    style={{ padding: Spacing.xs }}
                >
                    {isScanning
                        ? <ActivityIndicator size="small" color={Colors.primary} />
                        : <Ionicons name="refresh-outline" size={22} color={Colors.primary} />
                    }
                </TouchableOpacity>
            </View>

            {/* Scan status / error */}
            {scanError && (
                <View style={styles.errorBanner}>
                    <Ionicons name="warning-outline" size={14} color={Colors.warning} />
                    <Text style={styles.errorBannerText}>{scanError}</Text>
                </View>
            )}
            {isScanning && (
                <View style={styles.scanBanner}>
                    <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 8 }} />
                    <Text style={styles.scanBannerText}>
                        Scanning {scanProgress.current}/{scanProgress.total} stocks...
                    </Text>
                </View>
            )}
            
            {!isScanning && patterns.length > 0 && (
                <View style={{ paddingHorizontal: Spacing.xl, marginBottom: Spacing.sm }}>
                    <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' }}>
                        Found {patterns.length} patterns across {SCAN_STOCKS.length} stocks
                    </Text>
                </View>
            )}

            {/* Filters */}
            <View style={styles.filtersWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
                    {filters.map(filter => (
                        <TouchableOpacity
                            key={filter}
                            style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
                            onPress={() => setActiveFilter(filter)}
                        >
                            <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                                {filter}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* List */}
            <FlatList
                data={filteredResults}
                keyExtractor={item => item.id}
                renderItem={renderPatternCard}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <EmptyState
                        iconName="search"
                        title="No patterns found"
                        description="Try selecting a different filter."
                    />
                }
                ListFooterComponent={
                    <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
                        <Text style={{ fontSize: FontSize.xs, color: Colors.textTertiary, textAlign: 'center' }}>
                            Pattern detection is for informational purposes only. Not investment advice.
                        </Text>
                    </View>
                }
            />

            {renderDetailModal()}
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
    backButton: {
        padding: Spacing.xs,
        marginLeft: -Spacing.xs,
    },
    headerTitle: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    headerSub: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        marginTop: 2,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.warningBg,
        borderRadius: BorderRadius.md,
    },
    errorBannerText: {
        fontSize: FontSize.xs,
        color: Colors.warning,
        flex: 1,
    },
    scanBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.primaryGlow,
        borderRadius: BorderRadius.md,
    },
    scanBannerText: {
        fontSize: FontSize.xs,
        color: Colors.primary,
        fontWeight: FontWeight.medium,
    },
    filtersWrapper: {
        marginBottom: Spacing.md,
    },
    filtersContainer: {
        paddingHorizontal: Spacing.xl,
        gap: Spacing.sm,
    },
    filterChip: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    filterChipActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryGlow,
    },
    filterText: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        fontWeight: FontWeight.medium,
    },
    filterTextActive: {
        color: Colors.primary,
        fontWeight: FontWeight.bold,
    },
    listContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xl * 2,
        gap: Spacing.md,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    symbol: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    symbolChange: {
        fontSize: FontSize.md,
    },
    sentimentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
        gap: 4,
    },
    sentimentText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
    },
    timeAgo: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
    },
    cardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
        backgroundColor: Colors.surfaceLight,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    infoCol: {
        flex: 1,
    },
    label: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    value: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reliabilityLabel: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginRight: Spacing.sm,
    },
    dotsRow: {
        flexDirection: 'row',
        gap: 4,
        marginRight: Spacing.sm,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.border,
    },
    dotFilled: {
        backgroundColor: Colors.primary,
    },
    reliabilityText: {
        fontSize: FontSize.xs,
        color: Colors.textPrimary,
        fontWeight: FontWeight.medium,
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
        maxHeight: '90%',
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
    modalScroll: {
        padding: Spacing.xl,
        paddingBottom: Spacing.xxl,
    },
    symbolHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.xl,
    },
    modalSymbol: {
        fontSize: 28,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    sentimentBadgeXL: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.md,
        gap: 6,
    },
    sentimentTextXL: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
    },
    targetBox: {
        flexDirection: 'row',
        backgroundColor: Colors.surfaceLight,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    targetCol: {
        flex: 1,
    },
    targetDivider: {
        width: 1,
        backgroundColor: Colors.border,
        marginHorizontal: Spacing.lg,
    },
    targetLabel: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    targetValue: {
        fontSize: 24,
        fontWeight: FontWeight.bold,
    },
    targetValueSL: {
        fontSize: 24,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    explanationBox: {
        marginBottom: Spacing.xl,
    },
    detailTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    detailText: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        lineHeight: 24,
    },
    exampleBox: {
        marginTop: Spacing.md,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderLeftWidth: 3,
        borderLeftColor: Colors.primary,
    },
    exampleTitle: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: Colors.primary,
        marginBottom: 4,
    },
    exampleText: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    tradeBtn: {
        backgroundColor: Colors.primary,
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    tradeBtnText: {
        color: Colors.white,
        fontWeight: FontWeight.bold,
        fontSize: FontSize.md,
    },
});
