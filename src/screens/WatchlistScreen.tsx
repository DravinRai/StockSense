// Watchlist Screen — Groww-style with colored logos, pill badges, sort pills
import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, Modal, StatusBar, Alert, RefreshControl, Platform, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../constants/theme';
import { useWatchlist } from '../context/WatchlistContext';
import { formatRupee, formatPercent, getChangeColor, cleanTicker } from '../utils/formatters';
import { StockQuote } from '../types';
import EmptyState from '../components/common/EmptyState';
import LoadingShimmer from '../components/common/LoadingShimmer';
import { getQuotes, searchStocks, getBatchSparklines } from '../api/marketApi';
import { getMarketStatus } from '../utils/formatters';
import CompanyLogo from '../components/common/CompanyLogo';
import MiniSparkline from '../components/common/MiniSparkline';

// Removed getLogoColor since we use CompanyLogo now

// ─── Stock Row Item ──────────────────────────────────────
const StockRow = ({
    stock,
    sparklines,
    onPress,
    onRemove
}: {
    stock: StockQuote;
    sparklines: Record<string, number[]>;
    onPress: () => void;
    onRemove: () => void;
}) => {
    const isPositive = stock.changePercent >= 0;
    const changeColor = getChangeColor(stock.changePercent);

    return (
        <Swipeable
            renderRightActions={() => (
                <TouchableOpacity
                    style={styles.swipeDeleteBtn}
                    onPress={onRemove}
                >
                    <Ionicons name="trash-outline" size={22} color="#fff" />
                    <Text style={styles.swipeDeleteText}>Delete</Text>
                </TouchableOpacity>
            )}
            overshootRight={false}
        >
        <TouchableOpacity style={styles.stockRow} onPress={onPress} activeOpacity={0.7} onLongPress={() => {
            Alert.alert('Remove', `Remove ${cleanTicker(stock.symbol)} from watchlist?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: onRemove },
            ]);
        }}>
            {/* Left: Logo + Name */}
            <View style={styles.stockCompanyInfo}>
                <CompanyLogo symbol={stock.symbol} size={42} />
                <View style={styles.stockInfo}>
                    <Text style={styles.stockSymbol}>{cleanTicker(stock.symbol)}</Text>
                    <Text style={styles.stockName} numberOfLines={1}>{stock.name}</Text>
                </View>
            </View>

            <View style={styles.moverCenter}>
                <MiniSparkline
                    data={sparklines[stock.symbol] || []}
                    width={50}
                    height={28}
                    isPositive={isPositive}
                />
            </View>

            {/* Right: Price + Change Pill */}
            <View style={styles.stockRight}>
                <Text style={styles.stockPrice}>{formatRupee(stock.ltp)}</Text>
                <View style={[styles.moverChangePill, { backgroundColor: isPositive ? Colors.gainBg : Colors.lossBg }]}>
                    <Text style={[styles.moverChangeText, { color: changeColor }]}>
                        {formatPercent(stock.changePercent)}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
        </Swipeable>
    );
}

// ─── Add Stock Modal ─────────────────────────────────────
function AddStockModal({
    visible, onClose, onAdd,
}: {
    visible: boolean;
    onClose: () => void;
    onAdd: (symbol: string, name: string) => void;
}) {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<StockQuote[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const { isInWatchlist } = useWatchlist();

    React.useEffect(() => {
        const fetchResults = async () => {
            if (search.length < 2) {
                setResults([]);
                setIsSearching(false);
                return;
            }
            setIsSearching(true);
            const data = await searchStocks(search);
            setResults(data.filter((s: StockQuote) => !isInWatchlist(s.symbol)));
            setIsSearching(false);
        };
        const timeoutId = setTimeout(fetchResults, 500);
        return () => clearTimeout(timeoutId);
    }, [search, isInWatchlist]);

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add Stock</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={Colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={18} color={Colors.textTertiary} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search stocks..."
                            placeholderTextColor={Colors.textTertiary}
                            value={search}
                            onChangeText={setSearch}
                            autoFocus
                        />
                    </View>

                    {isSearching ? (
                        <View style={{ padding: Spacing.xl, gap: Spacing.md }}>
                            <LoadingShimmer width="100%" height={60} borderRadius={BorderRadius.md} />
                            <LoadingShimmer width="100%" height={60} borderRadius={BorderRadius.md} />
                            <LoadingShimmer width="100%" height={60} borderRadius={BorderRadius.md} />
                        </View>
                    ) : (
                        <FlatList
                            data={results}
                            keyExtractor={(item) => item.symbol}
                            renderItem={({ item }) => {
                                const ticker = cleanTicker(item.symbol);
                                return (
                                    <TouchableOpacity
                                        style={styles.searchResultRow}
                                        onPress={() => {
                                            onAdd(item.symbol, item.name);
                                            onClose();
                                        }}
                                    >
                                        <View style={styles.searchResultLeft}>
                                            <CompanyLogo symbol={item.symbol} size={36} />
                                            <View>
                                                <Text style={styles.searchResultSymbol}>{ticker}</Text>
                                                <Text style={styles.searchResultName}>{item.name}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.searchResultRight}>
                                            {item.ltp > 0 && <Text style={styles.searchResultPrice}>{formatRupee(item.ltp)}</Text>}
                                            <Ionicons name="add-circle" size={22} color={Colors.primary} />
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                            ListEmptyComponent={
                                <EmptyState
                                    iconName="search-outline"
                                    title="No stocks found"
                                    description={search.length < 2 ? "Type at least 2 characters to search." : "Try searching for a different symbol or company name."}
                                />
                            }
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
}

// ─── Main Watchlist Screen ───────────────────────────────
export default function WatchlistScreen() {
    const [showAddModal, setShowAddModal] = useState(false);
    const [sortBy, setSortBy] = useState<'name' | 'price' | 'change'>('name');
    const { watchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
    const navigation = useNavigation<any>();

    const [liveQuotes, setLiveQuotes] = useState<StockQuote[]>([]);
    const [sparklines, setSparklines] = useState<Record<string, number[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchLiveQuotes = async () => {
        if (watchlist.length === 0) {
            setLiveQuotes([]);
            setSparklines({});
            setIsLoading(false);
            return;
        }
        try {
            const symbols = watchlist.map(i => i.symbol);
            const [data, sparklineData] = await Promise.all([
                getQuotes(symbols),
                getBatchSparklines(symbols)
            ]);
            if (data && data.length > 0) {
                setLiveQuotes(data);
                setSparklines(sparklineData);
            }
        } catch (error) {
            console.log('Error fetching watchlist quotes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        setIsLoading(true);
        fetchLiveQuotes();

        let intervalId: NodeJS.Timeout;

        if (watchlist.length > 0) {
            intervalId = setInterval(() => {
                const status = getMarketStatus();
                if (status === 'open' || status === 'pre-open') {
                    fetchLiveQuotes();
                }
            }, 30000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [watchlist]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchLiveQuotes();
        setRefreshing(false);
    };

    // Merge persistent watchlist items with live data
    const displayStocks = useMemo(() => {
        return watchlist.map(item => {
            const liveData = liveQuotes.find(q => cleanTicker(q.symbol) === cleanTicker(item.symbol));
            return {
                ...item,
                // Use live data if available, otherwise just use the item's saved info
                ltp: liveData?.ltp || 0,
                change: liveData?.change || 0,
                changePercent: liveData?.changePercent || 0,
                volume: liveData?.volume || 0,
                exchange: liveData?.exchange || 'NSE',
                open: liveData?.open || 0,
                high: liveData?.high || 0,
                low: liveData?.low || 0,
                close: liveData?.close || 0,
                marketCap: liveData?.marketCap || 0,
                week52High: liveData?.week52High || 0,
                week52Low: liveData?.week52Low || 0,
                sector: liveData?.sector || 'Unknown',
                isLive: !!liveData
            } as StockQuote & { isLive: boolean };
        });
    }, [watchlist, liveQuotes]);

    // Sort stocks
    const sortedStocks = [...displayStocks].sort((a, b) => {
        switch (sortBy) {
            case 'price': return b.ltp - a.ltp;
            case 'change': return b.changePercent - a.changePercent;
            default: return cleanTicker(a.symbol).localeCompare(cleanTicker(b.symbol));
        }
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.profileIconPlaceholder}>
                        <Ionicons name="person" size={18} color={Colors.white} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Watchlist</Text>
                        <Text style={styles.headerSubtitle}>{watchlist.length} stocks</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.searchButton}
                    onPress={() => setShowAddModal(true)}
                >
                    <Ionicons name="search" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
            </View>

            {/* Sort Tabs */}
            <View style={styles.sortRow}>
                {(['name', 'price', 'change'] as const).map(key => (
                    <TouchableOpacity
                        key={key}
                        style={[styles.sortTab, sortBy === key && styles.sortTabActive]}
                        onPress={() => setSortBy(key)}
                    >
                        <Text style={[styles.sortTabText, sortBy === key && styles.sortTabTextActive]}>
                            {key === 'name' ? 'Name' : key === 'price' ? 'Price' : '% Change'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Stock List */}
            {isLoading && !refreshing && watchlist.length > 0 ? (
                <View style={{ padding: Spacing.xl, gap: Spacing.md }}>
                    <LoadingShimmer width="100%" height={72} borderRadius={BorderRadius.md} />
                    <LoadingShimmer width="100%" height={72} borderRadius={BorderRadius.md} />
                    <LoadingShimmer width="100%" height={72} borderRadius={BorderRadius.md} />
                </View>
            ) : (
                <FlatList
                    data={sortedStocks}
                    keyExtractor={(item) => item.symbol}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={Colors.primary}
                            colors={[Colors.primary]}
                        />
                    }
                    renderItem={({ item }) => (
                        <StockRow
                            stock={item}
                            sparklines={sparklines}
                            onPress={() => navigation.navigate('StockDetail', { symbol: item.symbol })}
                            onRemove={() => removeFromWatchlist(item.symbol)}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <EmptyState
                            iconName="bookmark-outline"
                            title="Your watchlist is empty"
                            description="Keep track of your favorite stocks by adding them here."
                            actionLabel="Add Stocks"
                            onAction={() => setShowAddModal(true)}
                        />
                    }
                />
            )}

            <AddStockModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={addToWatchlist}
            />
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Platform.OS === 'web' ? 20 : 50,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    profileIconPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    headerSubtitle: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
    },
    searchButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Sort
    sortRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.sm,
        gap: Spacing.sm,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    sortTab: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.surfaceLight,
    },
    sortTabActive: {
        backgroundColor: Colors.primaryGlow,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    sortTabText: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        fontWeight: FontWeight.medium,
    },
    sortTabTextActive: {
        color: Colors.primary,
        fontWeight: FontWeight.bold,
    },
    // Stock Row
    stockRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    stockCompanyInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: Spacing.md,
    },
    stockInfo: {
        flex: 1,
    },
    stockSymbol: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    stockName: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    stockRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    stockPrice: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    listContent: {
        paddingBottom: 100,
    },
    moverCenter: {
        marginHorizontal: Spacing.sm,
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
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: Colors.overlay,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: BorderRadius.xxl,
        borderTopRightRadius: BorderRadius.xxl,
        maxHeight: '80%',
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    modalTitle: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceLight,
        marginHorizontal: Spacing.xl,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    searchInput: {
        flex: 1,
        paddingVertical: Spacing.md,
        fontSize: FontSize.md,
        color: Colors.textPrimary,
    },
    searchResultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    searchResultLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    searchResultLogo: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchResultLogoText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.white,
    },
    searchResultSymbol: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    searchResultName: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    searchResultRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    searchResultPrice: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
    },
    swipeDeleteBtn: {
        backgroundColor: Colors.loss,
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        paddingHorizontal: Spacing.md,
    },
    swipeDeleteText: {
        color: '#fff',
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        marginTop: 4,
    },
});
