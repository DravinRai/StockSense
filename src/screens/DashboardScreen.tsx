// Dashboard Screen — Groww-style with all sections
import React, { useState, useCallback, useMemo, Component, ReactNode } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl,
    TouchableOpacity, Dimensions, StatusBar, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../constants/theme';
import { mockStocks, mockIndices, mockTopGainers, mockTopLosers } from '../data/mockData';
import { formatRupee, formatPercent, formatVolume, getChangeColor, getMarketStatus, cleanTicker, safeNumber } from '../utils/formatters';
import { IndexData, StockQuote } from '../types';
import SEBIDisclaimer from '../components/common/SEBIDisclaimer';
import LoadingShimmer from '../components/common/LoadingShimmer';
import CompanyLogo from '../components/common/CompanyLogo';
import MiniSparkline from '../components/common/MiniSparkline';
import { getIndices, getSectorPerformance, SectorData, getFIIDIIData } from '../api/marketApi';
import { FIIDIIData } from '../types';
import * as marketDataService from '../services/marketDataService';
import { usePortfolio } from '../context/PortfolioContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';

// Error boundary to isolate section crashes
class SafeSection extends Component<{ children: ReactNode }, { hasError: boolean }> {
    state = { hasError: false };
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(error: any) { console.warn('SafeSection caught:', error); }
    render() { return this.state.hasError ? null : this.props.children; }
}

const { width } = Dimensions.get('window');
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in ms

// ─── Market Status Badge ─────────────────────────────────
function MarketStatusBadge() {
    const status = getMarketStatus();
    const isOpen = status === 'open';
    const isPreOpen = status === 'pre-open';

    return (
        <View style={[styles.statusBadge, {
            backgroundColor: isOpen ? Colors.gainBg : isPreOpen ? Colors.warningBg : Colors.lossBg,
        }]}>
            <View style={[styles.statusDot, {
                backgroundColor: isOpen ? Colors.gain : isPreOpen ? Colors.warning : Colors.loss,
            }]} />
            <Text style={[styles.statusText, {
                color: isOpen ? Colors.gain : isPreOpen ? Colors.warning : Colors.loss,
            }]}>
                {isOpen ? 'Market Open' : isPreOpen ? 'Pre-Open' : 'Market Closed'}
            </Text>
        </View>
    );
}

// ─── Index Ticker Item ───────────────────────────────────
function IndexTickerItem({ index }: { index: IndexData }) {
    const isPositive = index.change >= 0;
    const changeColor = getChangeColor(index.change);

    return (
        <View style={styles.tickerItem}>
            <Text style={styles.tickerName}>{index.name}</Text>
            <Text style={styles.tickerValue}>{index.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            <Text style={[styles.tickerChange, { color: changeColor }]}>
                {isPositive ? '▲' : '▼'} {Math.abs(index.change).toFixed(2)} ({formatPercent(index.changePercent)})
            </Text>
        </View>
    );
}

// ─── Recently Viewed Item ────────────────────────────────
function RecentViewedItem({ symbol, onPress, quote }: { symbol: string; onPress: () => void; quote?: StockQuote }) {
    const ticker = cleanTicker(symbol);
    const changePercent = quote?.changePercent || 0;
    const isPositive = changePercent >= 0;

    return (
        <TouchableOpacity style={styles.recentItem} onPress={onPress} activeOpacity={0.7}>
            <CompanyLogo symbol={symbol} size={40} />
            <Text style={styles.recentTicker}>{ticker}</Text>
            <View style={[styles.recentChangePill, {
                backgroundColor: isPositive ? Colors.gainBg : Colors.lossBg,
            }]}>
                <Text style={[styles.recentChangeText, { color: getChangeColor(changePercent) }]}>
                    {formatPercent(changePercent)}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

// ─── Investments Card ────────────────────────────────────
function InvestmentsCard({ totalInvested, currentValue, totalPnL, pnlPercent }: {
    totalInvested: number; currentValue: number; totalPnL: number; pnlPercent: number;
}) {
    const changeColor = getChangeColor(pnlPercent);
    const navigation = useNavigation<any>();

    return (
        <TouchableOpacity
            style={styles.investmentCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Portfolio')}
        >
            <View style={styles.investCardHeader}>
                <Text style={styles.investCardTitle}>Your Investments</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
            </View>
            <Text style={styles.investCardValue}>{formatRupee(currentValue)}</Text>
            {totalInvested > 0 ? (
                <>
                    <View style={styles.investCardRow}>
                        <Text style={styles.investCardLabel}>Total Returns</Text>
                        <Text style={[styles.investCardReturn, { color: changeColor }]}>
                            {totalPnL >= 0 ? '+' : ''}{formatRupee(totalPnL)} ({formatPercent(pnlPercent)})
                        </Text>
                    </View>
                    <View style={styles.investCardRow}>
                        <Text style={styles.investCardLabel}>Invested</Text>
                        <Text style={styles.investCardInvested}>{formatRupee(totalInvested)}</Text>
                    </View>
                </>
            ) : (
                <Text style={styles.investCardEmpty}>Start your investment journey</Text>
            )}
        </TouchableOpacity>
    );
}

// ─── Top Mover Row ───────────────────────────────────────
function TopMoverRow({ stock, sparklineData, onPress }: { stock: StockQuote; sparklineData?: number[]; onPress: () => void }) {
    const isPositive = stock.changePercent >= 0;
    const changeColor = getChangeColor(stock.changePercent);
    const ticker = cleanTicker(stock.symbol);

    return (
        <TouchableOpacity style={styles.moverRow} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.moverLeft}>
                <CompanyLogo symbol={stock.symbol} size={36} />
                <View style={styles.moverInfo}>
                    <Text style={styles.moverTicker}>{ticker}</Text>
                    <Text style={styles.moverName} numberOfLines={1}>{stock.name}</Text>
                </View>
            </View>
            <View style={styles.moverCenter}>
                <MiniSparkline
                    data={sparklineData || []}
                    width={50}
                    height={28}
                    isPositive={isPositive}
                />
            </View>
            <View style={styles.moverRight}>
                <Text style={styles.moverPrice}>{formatRupee(stock.ltp)}</Text>
                <View style={[styles.moverChangePill, {
                    backgroundColor: isPositive ? Colors.gainBg : Colors.lossBg,
                }]}>
                    <Text style={[styles.moverChangeText, { color: changeColor }]}>
                        {formatPercent(stock.changePercent)}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

// ─── Most Traded Card ────────────────────────────────────
function MostTradedCard({ stock, onPress }: { stock: StockQuote; onPress: () => void }) {
    const isPositive = stock.changePercent >= 0;
    const changeColor = getChangeColor(stock.changePercent);
    const ticker = cleanTicker(stock.symbol);

    return (
        <TouchableOpacity style={styles.tradedCard} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.tradedCardTop}>
                <CompanyLogo symbol={stock.symbol} size={32} />
            </View>
            <Text style={styles.tradedCardName} numberOfLines={1}>{ticker}</Text>
            <Text style={styles.tradedCardPrice}>{formatRupee(stock.ltp)}</Text>
            <Text style={[styles.tradedCardChange, { color: changeColor }]}>
                {formatPercent(stock.changePercent)}
            </Text>
        </TouchableOpacity>
    );
}

// ─── Sector Row ──────────────────────────────────────────
function SectorRow({ sector }: { sector: SectorData }) {
    const isPositive = sector.changePercent >= 0;
    const changeColor = getChangeColor(sector.changePercent);
    const total = sector.gainers + sector.losers;
    const gainerPercent = total > 0 ? (sector.gainers / total) * 100 : 50;

    return (
        <View style={styles.sectorRow}>
            <View style={styles.sectorLeft}>
                <View style={styles.sectorIconWrap}>
                    <Ionicons name={sector.icon as any} size={18} color={Colors.primary} />
                </View>
                <Text style={styles.sectorName}>{sector.name}</Text>
            </View>
            <View style={styles.sectorBarContainer}>
                <View style={[styles.sectorBarGainer, { width: `${gainerPercent}%` }]} />
                <View style={[styles.sectorBarLoser, { width: `${100 - gainerPercent}%` }]} />
            </View>
            <Text style={[styles.sectorChange, { color: changeColor }]}>
                {formatPercent(sector.changePercent)}
            </Text>
        </View>
    );
}

// ─── Section Header ──────────────────────────────────────
function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
    return (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {onSeeAll && (
                <TouchableOpacity onPress={onSeeAll}>
                    <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

// ─── Product Tool Button ─────────────────────────────────
function ProductToolButton({ icon, label, badge, route, navigation }: { icon: string; label: string; badge?: string; route: string; navigation: any }) {
    return (
        <TouchableOpacity
            style={styles.productBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(route)}
        >
            <View style={styles.productIconWrap}>
                <Ionicons name={icon as any} size={22} color={Colors.primary} />
                {badge && (
                    <View style={styles.productBadge}>
                        <Text style={styles.productBadgeText}>{badge}</Text>
                    </View>
                )}
            </View>
            <Text style={styles.productLabel}>{label}</Text>
        </TouchableOpacity>
    );
}

// ─── FII/DII Summary ────────────────────────────────────
function FIIDIICard({ data, isLive }: { data: FIIDIIData[]; isLive: boolean }) {
    if (!data.length) return null;
    const today = data[0];
    const fiiColor = today.fiiNet >= 0 ? Colors.gain : Colors.loss;
    const diiColor = today.diiNet >= 0 ? Colors.gain : Colors.loss;
    const MAX_ABS = Math.max(...data.map(d => Math.max(Math.abs(d.fiiNet), Math.abs(d.diiNet))), 1);

    return (
        <View style={styles.fiidiiCard}>
            <View style={styles.fiidiiHeader}>
                <Text style={styles.fiidiiTitle}>FII / DII Activity</Text>
                <View style={[styles.fiidiiSourceBadge, { backgroundColor: isLive ? Colors.gainBg : Colors.warningBg }]}>
                    <Text style={[styles.fiidiiSourceText, { color: isLive ? Colors.gain : Colors.warning }]}>
                        {isLive ? 'Live' : 'Sample'}
                    </Text>
                </View>
            </View>

            <View style={styles.fiidiiToday}>
                <View style={styles.fiidiiPill}>
                    <Text style={styles.fiidiiPillLabel}>FII Net</Text>
                    <Text style={[styles.fiidiiPillValue, { color: fiiColor }]}>
                        {today.fiiNet >= 0 ? '+' : ''}{(today.fiiNet / 100).toFixed(0)} Cr
                    </Text>
                </View>
                <View style={styles.fiidiiDivider} />
                <View style={styles.fiidiiPill}>
                    <Text style={styles.fiidiiPillLabel}>DII Net</Text>
                    <Text style={[styles.fiidiiPillValue, { color: diiColor }]}>
                        {today.diiNet >= 0 ? '+' : ''}{(today.diiNet / 100).toFixed(0)} Cr
                    </Text>
                </View>
            </View>

            <Text style={styles.fiidiiTrendLabel}>5-Day Trend (₹ Cr)</Text>
            <View style={styles.fiidiiBarRow}>
                {data.slice(0, 5).map((d, i) => {
                    const fiiH = Math.abs(d.fiiNet) / MAX_ABS;
                    const diiH = Math.abs(d.diiNet) / MAX_ABS;
                    const label = d.date ? d.date.slice(5) : `D${i + 1}`;
                    return (
                        <View key={i} style={styles.fiidiiBarGroup}>
                            <View style={styles.fiidiiBarPair}>
                                <View style={[styles.fiidiiBar, {
                                    height: Math.max(4, fiiH * 40),
                                    backgroundColor: d.fiiNet >= 0 ? Colors.gain : Colors.loss,
                                    marginRight: 2,
                                }]} />
                                <View style={[styles.fiidiiBar, {
                                    height: Math.max(4, diiH * 40),
                                    backgroundColor: d.diiNet >= 0 ? Colors.primary : Colors.loss,
                                }]} />
                            </View>
                            <Text style={styles.fiidiiBarLabel} numberOfLines={1}>{label}</Text>
                        </View>
                    );
                })}
            </View>
            <View style={styles.fiidiiLegend}>
                <View style={[styles.fiidiiLegendDot, { backgroundColor: Colors.gain }]} />
                <Text style={styles.fiidiiLegendText}>FII</Text>
                <View style={[styles.fiidiiLegendDot, { backgroundColor: Colors.primary, marginLeft: 8 }]} />
                <Text style={styles.fiidiiLegendText}>DII</Text>
            </View>
        </View>
    );
}

// ─── Pattern Alert Card ──────────────────────────────────
// ─── Main Dashboard ──────────────────────────────────────
export default function DashboardScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [indices, setIndices] = useState<IndexData[]>(mockIndices);
    const [gainers, setGainers] = useState<StockQuote[]>(mockTopGainers);
    const [losers, setLosers] = useState<StockQuote[]>(mockTopLosers);
    const [mostTraded, setMostTraded] = useState<StockQuote[]>(mockStocks.slice(0, 5));
    const [sectors, setSectors] = useState<SectorData[]>([]);
    const [sparklines, setSparklines] = useState<Record<string, number[]>>({});
    const [moverTab, setMoverTab] = useState<'gainers' | 'losers' | 'volume'>('gainers');
    const [fiidii, setFiidii] = useState<FIIDIIData[]>([]);
    const [fiidiiLive, setFiidiiLive] = useState(false);

    const { holdings } = usePortfolio();
    const { recentlyViewed } = useRecentlyViewed();
    const navigation = useNavigation<any>();

    // Cache logic
    const lastFetchTime = React.useRef<number>(0);
    const cacheData = React.useRef<{
        indices: IndexData[];
        movers: marketDataService.MarketMovers;
        sectors: SectorData[];
        sparklines: Record<string, number[]>;
    } | null>(null);

    // Fetch all market data
    const fetchMarketData = async (force = false) => {
        const now = Date.now();
        // Use cache if available and not expired (unless force refresh)
        if (!force && cacheData.current && (now - lastFetchTime.current < CACHE_DURATION)) {
            setIndices(cacheData.current.indices);
            setGainers(cacheData.current.movers.gainers);
            setLosers(cacheData.current.movers.losers);
            setMostTraded(cacheData.current.movers.mostTraded);
            setSectors(cacheData.current.sectors);
            setSparklines(cacheData.current.sparklines);
            setIsLoading(false);
            setHasError(false);
            return;
        }

        try {
            setHasError(false);
            if (!force) setIsLoading(true);

            const [newIndices, movers, sectorData, fiidiiResult] = await Promise.all([
                getIndices(),
                marketDataService.fetchMarketData(),
                getSectorPerformance(),
                getFIIDIIData(),
            ]);

            setFiidii(fiidiiResult.data);
            setFiidiiLive(fiidiiResult.isLive);

            setIndices(newIndices);
            setGainers(movers.gainers);
            setLosers(movers.losers);
            setSectors(sectorData);
            setMostTraded(movers.mostTraded);

            // Fetch sparklines for top 5 most traded and top 5 gainers
            const topTradedSymbols = movers.mostTraded.slice(0, 5).map(s => s.symbol);
            const topGainersSymbols = movers.gainers.slice(0, 5).map(s => s.symbol);
            const sparklineSymbols = Array.from(new Set([...topTradedSymbols, ...topGainersSymbols]));
            
            let sparklineData = {};
            if (sparklineSymbols.length > 0) {
                sparklineData = await marketDataService.fetchBatchSparklines(sparklineSymbols);
                setSparklines(sparklineData);
            }
            
            // Update Cache
            cacheData.current = {
                indices: newIndices,
                movers,
                sectors: sectorData,
                sparklines: sparklineData
            };
            lastFetchTime.current = now;
        } catch (error) {
            console.log('Error fetching market data:', error);
            setHasError(true);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchMarketData();

        // Auto-refresh every 5 minutes if app is active
        const interval = setInterval(() => {
            fetchMarketData(true);
        }, CACHE_DURATION);

        return () => clearInterval(interval);
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchMarketData(true);
        setRefreshing(false);
    }, []);

    const navigateToStock = (symbol: string) => {
        navigation.navigate('StockDetail', { symbol });
    };

    // Portfolio calculations (simplified for dashboard, ideally should fetch quotes)
    const { totalInvested, currentValue, totalPnL, pnlPercent } = useMemo(() => {
        let inv = 0;
        let val = 0;
        holdings.forEach(h => {
            const allQuotes = [...gainers, ...losers, ...mostTraded];
            const quote = allQuotes.find(s => s.symbol === h.symbol || cleanTicker(s.symbol) === cleanTicker(h.symbol));
            const currentPrice = quote?.ltp || h.buyPrice;
            inv += h.buyPrice * h.quantity;
            val += currentPrice * h.quantity;
        });
        const pnl = val - inv;
        const pct = inv > 0 ? (pnl / inv) * 100 : 0;
        return { totalInvested: inv, currentValue: val, totalPnL: pnl, pnlPercent: pct };
    }, [holdings, gainers, losers, mostTraded]);

    // Get quotes for recently viewed stocks
    const recentQuotes = useMemo(() => {
        const map: Record<string, StockQuote | undefined> = {};
        recentlyViewed.forEach(sym => {
            const allStocks = [...gainers, ...losers, ...mostTraded, ...mockStocks];
            map[sym] = allStocks.find(s => s.symbol === sym || cleanTicker(s.symbol) === cleanTicker(sym));
        });
        return map;
    }, [recentlyViewed, gainers, losers, mostTraded]);

    // Current movers list based on selected tab
    const currentMovers = useMemo(() => {
        switch (moverTab) {
            case 'gainers': return gainers.slice(0, 5);
            case 'losers': return losers.slice(0, 5);
            case 'volume':
                return mostTraded.slice(0, 5);
        }
    }, [moverTab, gainers, losers, mostTraded]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

            {/* ─── Top Header ─── */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Ionicons name="person-circle-outline" size={32} color={Colors.textSecondary} />
                    <MarketStatusBadge />
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
                contentContainerStyle={styles.scrollContent}
            >
                {/* ═══ 1. INDICES TICKER BAR ═══ */}
                <SafeSection>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tickerBar}
                >
                    {isLoading ? (
                        <>
                            <LoadingShimmer width={130} height={60} borderRadius={BorderRadius.md} />
                            <LoadingShimmer width={130} height={60} borderRadius={BorderRadius.md} />
                            <LoadingShimmer width={130} height={60} borderRadius={BorderRadius.md} />
                        </>
                    ) : hasError ? (
                        <View style={{ paddingHorizontal: Spacing.xl, height: 60, justifyContent: 'center' }}>
                            <Text style={{ color: Colors.loss, fontSize: FontSize.xs }}>Unable to load indices</Text>
                        </View>
                    ) : (
                        indices.map((index) => (
                            <IndexTickerItem key={index.name} index={index} />
                        ))
                    )}
                </ScrollView>
                </SafeSection>

                {hasError && !isLoading && (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={32} color={Colors.textTertiary} />
                        <Text style={styles.errorText}>Unable to load data. Tap to retry</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchMarketData(true)}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ═══ 2. RECENTLY VIEWED ═══ */}
                <SafeSection>
                {recentlyViewed.length > 0 && (
                    <>
                        <SectionHeader title="Recently Viewed" />
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.recentRow}
                        >
                            {recentlyViewed.map(sym => (
                                <RecentViewedItem
                                    key={sym}
                                    symbol={sym}
                                    quote={recentQuotes[sym]}
                                    onPress={() => navigateToStock(sym)}
                                />
                            ))}
                        </ScrollView>
                        <View style={styles.divider} />
                    </>
                )}
                </SafeSection>

                {/* ═══ 3. YOUR INVESTMENTS CARD ═══ */}
                <SafeSection>
                <View style={styles.sectionPadded}>
                    <InvestmentsCard
                        totalInvested={totalInvested}
                        currentValue={currentValue}
                        totalPnL={totalPnL}
                        pnlPercent={pnlPercent}
                    />
                </View>
                </SafeSection>

                <View style={styles.divider} />

                {/* ═══ 4. TOP MOVERS TODAY ═══ */}
                <SafeSection>
                <SectionHeader title="Top Movers Today" />
                <View style={styles.moverTabs}>
                    {(['gainers', 'losers', 'volume'] as const).map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.moverTab, moverTab === tab && styles.moverTabActive]}
                            onPress={() => setMoverTab(tab)}
                        >
                            <Text style={[styles.moverTabText, moverTab === tab && styles.moverTabTextActive]}>
                                {tab === 'gainers' ? 'Gainers' : tab === 'losers' ? 'Losers' : 'Volume'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <View style={styles.moverList}>
                    {isLoading ? (
                        <View style={{ paddingHorizontal: Spacing.xl }}>
                            <LoadingShimmer width={'100%'} height={56} borderRadius={BorderRadius.md} style={{ marginBottom: Spacing.sm }} />
                            <LoadingShimmer width={'100%'} height={56} borderRadius={BorderRadius.md} />
                        </View>
                    ) : (
                        currentMovers.map(stock => (
                            <TopMoverRow
                                key={stock.symbol}
                                stock={stock}
                                sparklineData={sparklines[stock.symbol]}
                                onPress={() => navigateToStock(stock.symbol)}
                            />
                        ))
                    )}
                </View>
                </SafeSection>

                <View style={styles.divider} />

                {/* ═══ 5. MOST TRADED STOCKS ═══ */}
                <SafeSection>
                <SectionHeader title="Most Traded" />
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tradedRow}
                >
                    {isLoading ? (
                        <>
                            <LoadingShimmer width={120} height={120} borderRadius={BorderRadius.lg} />
                            <LoadingShimmer width={120} height={120} borderRadius={BorderRadius.lg} />
                            <LoadingShimmer width={120} height={120} borderRadius={BorderRadius.lg} />
                        </>
                    ) : mostTraded.length > 0 ? (
                        mostTraded.map(stock => (
                            <MostTradedCard
                                key={stock.symbol}
                                stock={stock}
                                onPress={() => navigateToStock(stock.symbol)}
                            />
                        ))
                    ) : (
                        <View style={{ paddingHorizontal: Spacing.xl, height: 120, justifyContent: 'center' }}>
                            <Text style={{ color: Colors.textSecondary }}>No trade data available</Text>
                        </View>
                    )}
                </ScrollView>
                </SafeSection>

                <View style={styles.divider} />

                {/* ═══ 6. SECTORS TRENDING TODAY ═══ */}
                <SafeSection>
                <SectionHeader title="Sectors Trending Today" />
                <View style={styles.sectorList}>
                    {isLoading ? (
                        <View style={{ paddingHorizontal: Spacing.xl }}>
                            <LoadingShimmer width={'100%'} height={44} borderRadius={BorderRadius.md} style={{ marginBottom: Spacing.sm }} />
                            <LoadingShimmer width={'100%'} height={44} borderRadius={BorderRadius.md} />
                        </View>
                    ) : (
                        sectors.map(sector => (
                            <SectorRow key={sector.name} sector={sector} />
                        ))
                    )}
                </View>
                </SafeSection>

                <View style={styles.divider} />

                {/* ═══ 7. PRODUCTS & TOOLS ═══ */}
                <SafeSection>
                <SectionHeader title="Products & Tools" />
                <View style={styles.productsGrid}>
                    <ProductToolButton icon="rocket-outline" label="IPO" badge="3" route="IPO" navigation={navigation} />
                    <ProductToolButton icon="filter-outline" label="ETF Screener" route="ETFScreener" navigation={navigation} />
                    <ProductToolButton icon="trending-up-outline" label="Intraday" route="Intraday" navigation={navigation} />
                    <ProductToolButton icon="repeat-outline" label="Stocks SIP" route="StocksSIP" navigation={navigation} />
                    <ProductToolButton icon="calendar-outline" label="Events" route="Events" navigation={navigation} />
                </View>
                </SafeSection>

                <View style={styles.divider} />

                {/* ═══ 8. FII / DII ACTIVITY ═══ */}
                <SafeSection>
                {fiidii.length > 0 && (
                    <>
                        <SectionHeader title="FII / DII Activity" />
                        <View style={styles.sectionPadded}>
                            <FIIDIICard data={fiidii} isLive={fiidiiLive} />
                        </View>
                        <View style={styles.divider} />
                    </>
                )}
                </SafeSection>

                {/* ═══ 9. PATTERN ALERTS ═══ */}
                <SafeSection>
                <SectionHeader title="Trading Screens" />
                <TouchableOpacity
                    style={styles.patternCTA}
                    onPress={() => navigation.navigate('PatternScanner' as never)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="scan-outline" size={24} color={Colors.primary} />
                    <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <Text style={styles.patternCTATitle}>Pattern Scanner</Text>
                        <Text style={styles.patternCTASub}>Live scan for Golden Cross, RSI, Volume Spikes & more</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
                </TouchableOpacity>
                </SafeSection>

                <SEBIDisclaimer />
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
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.xl,
        paddingTop: Platform.OS === 'web' ? 20 : 56,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
    },
    scrollContent: {
        paddingBottom: 100,
        backgroundColor: Colors.background,
    },

    // ── Ticker Bar ──
    tickerBar: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        gap: Spacing.sm,
    },
    tickerItem: {
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        minWidth: 130,
        ...Shadow.sm,
    },
    tickerName: {
        fontSize: FontSize.xs - 1,
        color: Colors.textSecondary,
        fontWeight: FontWeight.semibold,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    tickerValue: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: 1,
    },
    tickerChange: {
        fontSize: FontSize.xs - 1,
        fontWeight: FontWeight.semibold,
    },

    // ── Section ──
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.surface,
    },
    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    seeAllText: {
        fontSize: FontSize.sm,
        color: Colors.primary,
        fontWeight: FontWeight.medium,
    },
    sectionPadded: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.surface,
    },
    divider: {
        height: 8,
        backgroundColor: Colors.borderLight,
        width: '100%',
    },

    // ── Recently Viewed ──
    recentRow: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
        gap: Spacing.md,
        backgroundColor: Colors.surface,
    },
    recentItem: {
        alignItems: 'center',
        gap: 6,
        width: 70,
    },
    recentTicker: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },
    recentChangePill: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    recentChangeText: {
        fontSize: FontSize.xs - 1,
        fontWeight: FontWeight.bold,
    },

    // ── Investments Card ──
    investmentCard: {
        backgroundColor: Colors.surfaceLight,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        ...Shadow.sm,
    },
    investCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    investCardTitle: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        color: Colors.textSecondary,
    },
    investCardValue: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    investCardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    investCardLabel: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },
    investCardReturn: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
    },
    investCardInvested: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },
    investCardEmpty: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },

    // ── Top Movers ──
    moverTabs: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.xl,
        gap: Spacing.sm,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.surface,
    },
    moverTab: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.surfaceLight,
    },
    moverTabActive: {
        backgroundColor: Colors.primaryGlow,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    moverTabText: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        fontWeight: FontWeight.medium,
    },
    moverTabTextActive: {
        color: Colors.primary,
        fontWeight: FontWeight.bold,
    },
    moverList: {
        backgroundColor: Colors.surface,
        paddingBottom: Spacing.sm,
    },
    moverRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.xl,
    },
    moverLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: Spacing.sm,
    },
    moverInfo: {
        flex: 1,
    },
    moverTicker: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    moverName: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginTop: 1,
        maxWidth: 120,
    },
    moverCenter: {
        marginHorizontal: Spacing.sm,
    },
    moverRight: {
        alignItems: 'flex-end',
        gap: 3,
    },
    moverPrice: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },
    moverChangePill: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    moverChangeText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
    },

    // ── Most Traded ──
    tradedRow: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
        gap: Spacing.md,
        backgroundColor: Colors.surface,
    },
    tradedCard: {
        width: 140,
        height: 120, // Strict height so the ScrollView doesn't collapse
        backgroundColor: Colors.surfaceLight,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        alignItems: 'flex-start',
    },
    tradedCardTop: {
        marginBottom: Spacing.sm,
    },
    tradedCardName: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    tradedCardPrice: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    tradedCardChange: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
    },

    // ── Sectors ──
    sectorList: {
        backgroundColor: Colors.surface,
        paddingBottom: Spacing.md,
    },
    sectorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.xl,
    },
    sectorLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 100,
        gap: Spacing.sm,
    },
    sectorIconWrap: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: Colors.primaryGlow,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectorName: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },
    sectorBarContainer: {
        flex: 1,
        flexDirection: 'row',
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        marginHorizontal: Spacing.md,
    },
    sectorBarGainer: {
        height: '100%',
        backgroundColor: Colors.gain,
        borderTopLeftRadius: 4,
        borderBottomLeftRadius: 4,
    },
    sectorBarLoser: {
        height: '100%',
        backgroundColor: Colors.loss,
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
    },
    sectorChange: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        width: 65,
        textAlign: 'right',
    },

    // ── Products & Tools ──
    productsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
        gap: Spacing.md,
        backgroundColor: Colors.surface,
    },
    productBtn: {
        width: (width - Spacing.xl * 2 - Spacing.md * 2) / 3,
        alignItems: 'center',
        paddingVertical: Spacing.md,
        backgroundColor: Colors.surfaceLight,
        borderRadius: BorderRadius.lg,
    },
    productIconWrap: {
        position: 'relative',
        marginBottom: Spacing.xs,
    },
    productBadge: {
        position: 'absolute',
        top: -4,
        right: -10,
        backgroundColor: Colors.loss,
        borderRadius: 8,
        paddingHorizontal: 5,
        paddingVertical: 1,
        minWidth: 16,
        alignItems: 'center',
    },
    productBadgeText: {
        fontSize: 9,
        fontWeight: FontWeight.bold,
        color: Colors.white,
    },
    productLabel: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },

    // ── FII/DII ──
    fiidiiCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    fiidiiHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    fiidiiTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    fiidiiSourceBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    fiidiiSourceText: {
        fontSize: FontSize.xs - 2,
        fontWeight: FontWeight.bold,
    },
    fiidiiToday: {
        flexDirection: 'row',
        backgroundColor: Colors.surfaceLight,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    fiidiiPill: {
        flex: 1,
        alignItems: 'center',
    },
    fiidiiPillLabel: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    fiidiiPillValue: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
    },
    fiidiiDivider: {
        width: 1,
        backgroundColor: Colors.border,
        marginVertical: 2,
    },
    fiidiiTrendLabel: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        marginBottom: Spacing.sm,
    },
    fiidiiBarRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 50,
        marginBottom: Spacing.xs,
    },
    fiidiiBarGroup: {
        flex: 1,
        alignItems: 'center',
    },
    fiidiiBarPair: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 2,
    },
    fiidiiBar: {
        width: 10,
        borderRadius: 2,
    },
    fiidiiBarLabel: {
        fontSize: 9,
        color: Colors.textTertiary,
    },
    fiidiiLegend: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.xs,
    },
    fiidiiLegendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 4,
    },
    fiidiiLegendText: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
    },

    // ── Pattern Alerts ──
    patternCTA: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.lg,
        padding: Spacing.lg,
        backgroundColor: Colors.surfaceLight,
        borderRadius: BorderRadius.lg,
    },
    patternCTATitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    patternCTASub: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    errorContainer: {
        padding: Spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing.xl,
        marginVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: Spacing.sm,
    },
    errorText: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    retryBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
    },
    retryText: {
        color: Colors.white,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
    },
});
