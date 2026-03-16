// Insider Tracker Screen — Tracks block/bulk deals & promoter activity
// Live data from NSE with mock fallback (NSE requires cookies/session for browser-grade access)
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, StatusBar, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../constants/theme';
import { formatRupee, formatTimeAgo } from '../utils/formatters';
import { mockInsiderDeals } from '../data/mockData';
import { InsiderDeal } from '../types';
import EmptyState from '../components/common/EmptyState';
import LoadingShimmer from '../components/common/LoadingShimmer';

// NSE requires Accept, User-Agent, and Referer to allow data fetch.
// From a mobile app environment these calls are often blocked by NSE's Cloudflare rules.
// We attempt first, then fall back to mock with a clear disclaimer.
async function fetchNSEInsiderDeals(): Promise<InsiderDeal[]> {
    const headers = {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://www.nseindia.com',
    };

    // NSE promoter PIT (Prohibition of Insider Trading) endpoint
    const pitUrl = 'https://www.nseindia.com/api/corporates-pit?index=equities&from_date=&to_date=';
    const pitRes = await fetch(pitUrl, { headers });
    if (!pitRes.ok) throw new Error(`NSE PIT API failed: ${pitRes.status}`);
    const pitData = await pitRes.json();

    const deals: InsiderDeal[] = (pitData?.data ?? []).slice(0, 20).map((item: any, idx: number) => ({
        id: `pit_${idx}_${item.symbol}`,
        symbol: item.symbol ?? '',
        companyName: item.company ?? item.symbol ?? '',
        dealType: item.buyOrSell === 'BUY' ? 'Promoter Buy' : 'Promoter Sell',
        quantity: Number(item.noOfShares) || 0,
        price: Number(item.acquistionPrice) || 0,
        value: (Number(item.noOfShares) || 0) * (Number(item.acquistionPrice) || 0),
        date: item.date ?? new Date().toISOString(),
        party: item.personName ?? 'Promoter',
    }));

    return deals;
}

async function fetchNSEBulkDeals(): Promise<InsiderDeal[]> {
    const headers = {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://www.nseindia.com',
    };
    const url = 'https://www.nseindia.com/api/block-deal';
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`NSE Block Deal API failed: ${res.status}`);
    const data = await res.json();

    return (data?.data ?? []).slice(0, 10).map((item: any, idx: number) => ({
        id: `block_${idx}_${item.symbol}`,
        symbol: item.symbol ?? '',
        companyName: item.companyName ?? item.symbol ?? '',
        dealType: 'Block Deal' as InsiderDeal['dealType'],
        quantity: Number(item.quantity) || 0,
        price: Number(item.tradePrice) || 0,
        value: (Number(item.quantity) || 0) * (Number(item.tradePrice) || 0),
        date: item.date ?? new Date().toISOString(),
        party: item.clientName ?? 'Institutional',
    }));
}

export default function InsiderTrackerScreen() {
    const navigation = useNavigation<any>();
    const [activeFilter, setActiveFilter] = useState<string>('All');
    const [deals, setDeals] = useState<InsiderDeal[]>(mockInsiderDeals);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dataSource, setDataSource] = useState<'live' | 'mock'>('mock');

    const filters = ['All', 'Promoter Buy', 'Promoter Sell', 'Bulk Deal', 'Block Deal'];

    const fetchDeals = useCallback(async () => {
        try {
            const [insiderDeals, bulkDeals] = await Promise.all([
                fetchNSEInsiderDeals(),
                fetchNSEBulkDeals(),
            ]);
            const combined = [...insiderDeals, ...bulkDeals].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            if (combined.length > 0) {
                setDeals(combined);
                setDataSource('live');
            } else {
                setDeals(mockInsiderDeals);
                setDataSource('mock');
            }
        } catch (e) {
            // NSE blocks direct API access from mobile — use mock with disclaimer
            setDeals(mockInsiderDeals);
            setDataSource('mock');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchDeals(); }, [fetchDeals]);

    const filteredDeals = deals.filter(deal => {
        if (activeFilter === 'All') return true;
        return deal.dealType === activeFilter;
    });

    const getDealIcon = (type: string) => {
        switch (type) {
            case 'Promoter Buy': return 'arrow-down-circle'; // Receiving shares
            case 'Promoter Sell': return 'arrow-up-circle';  // Releasing shares
            case 'Bulk Deal': return 'layers';
            case 'Block Deal': return 'cube';
            default: return 'swap-horizontal';
        }
    };

    const getDealColor = (type: string) => {
        switch (type) {
            case 'Promoter Buy': return Colors.gain;
            case 'Promoter Sell': return Colors.loss;
            case 'Bulk Deal': return Colors.primary;
            case 'Block Deal': return '#F59E0B'; // Amber
            default: return Colors.textSecondary;
        }
    };

    const renderDealCard = ({ item }: { item: InsiderDeal }) => {
        const color = getDealColor(item.dealType);

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.symbolRow}>
                        <Text style={styles.symbol}>{item.symbol}</Text>
                        <View style={[styles.typeBadge, { borderColor: color, backgroundColor: color + '15' }]}>
                            <Ionicons name={getDealIcon(item.dealType)} size={12} color={color} />
                            <Text style={[styles.typeText, { color }]}>{item.dealType}</Text>
                        </View>
                    </View>
                    <Text style={styles.dateText}>{formatTimeAgo(item.date)}</Text>
                </View>

                <Text style={styles.companyName}>{item.companyName}</Text>

                <View style={styles.detailsBox}>
                    <View style={styles.detailCol}>
                        <Text style={styles.detailLabel}>Quantity</Text>
                        <Text style={styles.detailValue}>{item.quantity.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.detailCol}>
                        <Text style={styles.detailLabel}>Price</Text>
                        <Text style={styles.detailValue}>{formatRupee(item.price)}</Text>
                    </View>
                    <View style={[styles.detailCol, { alignItems: 'flex-end' }]}>
                        <Text style={styles.detailLabel}>Total Value</Text>
                        <Text style={styles.detailValueBold}>{formatRupee(item.value)}</Text>
                    </View>
                </View>

                <View style={styles.partyBox}>
                    <Text style={styles.partyLabel}>Party / Individual:</Text>
                    <Text style={styles.partyText} numberOfLines={1}>{item.party}</Text>
                </View>
            </View>
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
                <View>
                    <Text style={styles.headerTitle}>Insider Tracker</Text>
                    <Text style={styles.headerSubtitle}>Follow the smart money</Text>
                </View>
                <TouchableOpacity onPress={() => { setRefreshing(true); fetchDeals(); }} style={{ padding: Spacing.xs }}>
                    <Ionicons name="refresh-outline" size={22} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Data Source Badge */}
            <View style={[styles.sourceBanner, { backgroundColor: dataSource === 'live' ? Colors.gainBg : Colors.warningBg }]}>
                <Ionicons
                    name={dataSource === 'live' ? 'checkmark-circle-outline' : 'information-circle-outline'}
                    size={14}
                    color={dataSource === 'live' ? Colors.gain : Colors.warning}
                />
                <Text style={[styles.sourceBannerText, { color: dataSource === 'live' ? Colors.gain : Colors.warning }]}>
                    {dataSource === 'live'
                        ? 'Live data from NSE India'
                        : 'Sample data shown — NSE API requires browser session. Data delayed 24hrs.'}
                </Text>
            </View>

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
            {isLoading ? (
                <View style={{ padding: Spacing.xl, gap: Spacing.md }}>
                    {[1, 2, 3].map(k => (
                        <LoadingShimmer key={k} width="100%" height={140} borderRadius={BorderRadius.lg} />
                    ))}
                </View>
            ) : (
            <FlatList
                data={filteredDeals}
                keyExtractor={item => item.id}
                renderItem={renderDealCard}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchDeals(); }}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
                ListEmptyComponent={
                    <EmptyState
                        iconName="eye-off-outline"
                        title="No insider deals found"
                        description="Try selecting another filter."
                    />
                }
            />
            )}
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
    headerSubtitle: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    filtersWrapper: {
        marginBottom: Spacing.md,
    },
    filtersContainer: {
        paddingHorizontal: Spacing.xl,
        gap: Spacing.sm,
    },
    filterChip: {
        paddingHorizontal: Spacing.md,
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
        fontSize: FontSize.xs,
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
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    symbolRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    symbol: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
        gap: 4,
    },
    typeText: {
        fontSize: FontSize.xs - 2,
        fontWeight: FontWeight.bold,
    },
    dateText: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
    },
    companyName: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.md,
    },
    detailsBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: Colors.surfaceLight,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.md,
    },
    detailCol: {
        flex: 1,
    },
    detailLabel: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },
    detailValueBold: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    partyBox: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    partyLabel: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginRight: Spacing.sm,
    },
    partyText: {
        flex: 1,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
        color: Colors.textPrimary,
    },
    sourceBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    sourceBannerText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
        flex: 1,
    },
});
