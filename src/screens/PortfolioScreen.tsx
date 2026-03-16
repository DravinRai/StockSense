// Portfolio Screen — Manual entry of holdings, show P&L, allocation pie chart, XIRR calculation
import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, Modal, StatusBar, ScrollView, Alert, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Path, G } from 'react-native-svg';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../constants/theme';
import { usePortfolio } from '../context/PortfolioContext';
import { mockStocks } from '../data/mockData';
import { formatRupee, formatPercent, getChangeColor, cleanTicker } from '../utils/formatters';
import { calculateXIRR } from '../utils/calculations';
import { PortfolioHolding, StockQuote } from '../types';
import EmptyState from '../components/common/EmptyState';
import CompanyLogo from '../components/common/CompanyLogo';
import { getQuotes, searchStocks } from '../api/marketApi';

const { width } = Dimensions.get('window');

// ─── Add Holding Modal ─────────────────────────────────────
function AddHoldingModal({
    visible, onClose, onAdd,
}: {
    visible: boolean;
    onClose: () => void;
    onAdd: (holding: Omit<PortfolioHolding, 'id'>) => void;
}) {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<StockQuote[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null);

    const [buyPrice, setBuyPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [buyDate, setBuyDate] = useState(new Date().toISOString().split('T')[0]);

    React.useEffect(() => {
        const fetchResults = async () => {
            if (search.length < 2) {
                setResults([]);
                setIsSearching(false);
                return;
            }
            setIsSearching(true);
            const data = await searchStocks(search);
            setResults(data);
            setIsSearching(false);
        };
        const timeoutId = setTimeout(fetchResults, 500);
        return () => clearTimeout(timeoutId);
    }, [search]);

    const handleSave = () => {
        if (!selectedStock) return Alert.alert('Error', 'Please select a stock');
        if (!buyPrice || isNaN(Number(buyPrice))) return Alert.alert('Error', 'Enter a valid buy price');
        if (!quantity || isNaN(Number(quantity))) return Alert.alert('Error', 'Enter a valid quantity');

        onAdd({
            symbol: selectedStock.symbol,
            name: selectedStock.name,
            buyPrice: Number(buyPrice),
            quantity: Number(quantity),
            buyDate: buyDate,
            sector: selectedStock.sector || 'General',
        });

        // Reset form
        setSelectedStock(null);
        setSearch('');
        setBuyPrice('');
        setQuantity('');
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add Holding</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={Colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    {!selectedStock ? (
                        <>
                            <View style={styles.searchContainer}>
                                <Ionicons name="search" size={18} color={Colors.textTertiary} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search to add stock..."
                                    placeholderTextColor={Colors.textTertiary}
                                    value={search}
                                    onChangeText={setSearch}
                                    autoFocus
                                />
                            </View>
                            {isSearching ? (
                                <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
                                    <Text style={{ color: Colors.textSecondary }}>Searching...</Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={results}
                                    keyExtractor={(item) => item.symbol}
                                    style={{ maxHeight: 300 }}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={styles.searchResultRow}
                                            onPress={() => setSelectedStock(item)}
                                        >
                                            <View>
                                                <Text style={styles.searchResultSymbol}>{cleanTicker(item.symbol)}</Text>
                                                <Text style={styles.searchResultName}>{item.name}</Text>
                                            </View>
                                            {item.ltp > 0 && <Text style={styles.searchResultPrice}>{formatRupee(item.ltp)}</Text>}
                                        </TouchableOpacity>
                                    )}
                                    ListEmptyComponent={
                                        search.length > 0 ? (
                                            <EmptyState
                                                iconName="search-outline"
                                                title="No stocks found"
                                                description={search.length < 2 ? "Type at least 2 characters to search." : "Try searching for a different symbol or company name."}
                                            />
                                        ) : null
                                    }
                                />
                            )}
                        </>
                    ) : (
                        <View style={styles.formContainer}>
                            <TouchableOpacity
                                style={styles.selectedStockChip}
                                onPress={() => setSelectedStock(null)}
                            >
                                <Text style={styles.selectedStockText}>{cleanTicker(selectedStock.symbol)}</Text>
                                <Ionicons name="close-circle" size={16} color={Colors.primary} />
                            </TouchableOpacity>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Buy Price (₹)</Text>
                                <TextInput
                                    style={styles.inputField}
                                    keyboardType="decimal-pad"
                                    placeholder="e.g. 2450.50"
                                    placeholderTextColor={Colors.textTertiary}
                                    value={buyPrice}
                                    onChangeText={setBuyPrice}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Quantity</Text>
                                <TextInput
                                    style={styles.inputField}
                                    keyboardType="numeric"
                                    placeholder="e.g. 50"
                                    placeholderTextColor={Colors.textTertiary}
                                    value={quantity}
                                    onChangeText={setQuantity}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Buy Date (YYYY-MM-DD)</Text>
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="2026-03-01"
                                    placeholderTextColor={Colors.textTertiary}
                                    value={buyDate}
                                    onChangeText={setBuyDate}
                                />
                            </View>

                            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                                <Text style={styles.saveBtnText}>Add to Portfolio</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

// ─── Edit Holding Form ────────────────────────────────────
function EditHoldingForm({
    holding, onSave, onCancel
}: {
    holding: PortfolioHolding;
    onSave: (updates: Partial<PortfolioHolding>) => void;
    onCancel: () => void;
}) {
    const [buyPrice, setBuyPrice] = useState(String(holding.buyPrice));
    const [quantity, setQuantity] = useState(String(holding.quantity));

    return (
        <View style={{ gap: Spacing.md, marginTop: Spacing.md }}>
            <View>
                <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 4 }}>Buy Price (₹)</Text>
                <TextInput
                    style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary }}
                    value={buyPrice}
                    onChangeText={setBuyPrice}
                    keyboardType="numeric"
                />
            </View>
            <View>
                <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 4 }}>Quantity</Text>
                <TextInput
                    style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary }}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                />
            </View>
            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                <TouchableOpacity
                    style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' }}
                    onPress={onCancel}
                >
                    <Text style={{ color: Colors.textSecondary, fontWeight: FontWeight.bold }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.primary, alignItems: 'center' }}
                    onPress={() => {
                        const bp = Number(buyPrice);
                        const q = Number(quantity);
                        if (isNaN(bp) || bp <= 0) return Alert.alert('Error', 'Enter a valid buy price');
                        if (isNaN(q) || q <= 0) return Alert.alert('Error', 'Enter a valid quantity');
                        onSave({ buyPrice: bp, quantity: q });
                    }}
                >
                    <Text style={{ color: '#fff', fontWeight: FontWeight.bold }}>Save</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ─── Holding Row Item ────────────────────────────────────
function HoldingRow({
    holding, currentPrice, onPressDel, onPressEdit
}: {
    holding: PortfolioHolding, currentPrice: number, onPressDel: () => void, onPressEdit: () => void
}) {
    const investedAmount = holding.buyPrice * holding.quantity;
    const currentValue = currentPrice * holding.quantity;
    const pnl = currentValue - investedAmount;
    const pnlPercent = (pnl / investedAmount) * 100;

    const isPositive = pnl >= 0;
    const changeColor = getChangeColor(pnlPercent);

    return (
        <View style={styles.holdingRow}>
            <View style={styles.holdingRowTop}>
                <View style={styles.holdingCompanyInfo}>
                    <CompanyLogo symbol={holding.symbol} size={42} />
                    <View>
                        <Text style={styles.holdingSymbol}>{cleanTicker(holding.symbol)}</Text>
                        <Text style={styles.holdingQty}>{holding.quantity} shares • Avg {formatRupee(holding.buyPrice)}</Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity style={styles.delBtn} onPress={onPressEdit}>
                        <Ionicons name="create-outline" size={18} color={Colors.textTertiary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.delBtn} onPress={onPressDel}>
                        <Ionicons name="trash-outline" size={18} color={Colors.textTertiary} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.holdingRowBottom}>
                <View>
                    <Text style={styles.holdingValue}>{formatRupee(currentValue)}</Text>
                    <Text style={styles.holdingLabel}>Current Value</Text>
                </View>
                <View style={styles.holdingRight}>
                    <Text style={[styles.holdingPnl, { color: changeColor }]}>
                        {isPositive ? '+' : ''}{formatRupee(pnl)} ({isPositive ? '+' : ''}{formatPercent(pnlPercent)})
                    </Text>
                    <Text style={styles.holdingLabel}>Returns</Text>
                </View>
            </View>
        </View>
    );
}

// ─── Main Portfolio Screen ───────────────────────────────
export default function PortfolioScreen() {
    const { holdings, addHolding, removeHolding, updateHolding } = usePortfolio();
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingHolding, setEditingHolding] = useState<PortfolioHolding | null>(null);
    const [livePrices, setLivePrices] = useState<Record<string, number>>({});
    const [prevCloses, setPrevCloses] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);

    const fetchLivePrices = async () => {
        if (holdings.length === 0) {
            setLivePrices({});
            setPrevCloses({});
            setIsLoading(false);
            return;
        }
        try {
            const symbols = Array.from(new Set(holdings.map(h => h.symbol)));
            const data = await getQuotes(symbols);
            if (data && data.length > 0) {
                const quoteMap: Record<string, number> = {};
                const prevMap: Record<string, number> = {};
                data.forEach(q => {
                    quoteMap[q.symbol] = q.ltp;
                    prevMap[q.symbol] = q.close || q.ltp;
                });
                setLivePrices(quoteMap);
                setPrevCloses(prevMap);
            }
        } catch (error) {
            console.log('Error fetching portfolio quotes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        setIsLoading(true);
        fetchLivePrices();
    }, [holdings]);

    // Extend holdings with current price
    const enrichedHoldings = useMemo(() => {
        return holdings.map(h => {
            return { ...h, currentPrice: livePrices[h.symbol] || h.buyPrice };
        });
    }, [holdings, livePrices]);

    // Aggregate Portfolio Stats
    const { totalInvested, currentValue, totalPnL, pnlPercent, dayPnL } = useMemo(() => {
        let inv = 0;
        let val = 0;
        let dayP = 0;
        enrichedHoldings.forEach(h => {
            inv += h.buyPrice * h.quantity;
            val += h.currentPrice! * h.quantity;
            const pc = prevCloses[h.symbol] || h.buyPrice;
            dayP += (h.currentPrice! - pc) * h.quantity;
        });
        const pnl = val - inv;
        const pct = inv > 0 ? (pnl / inv) * 100 : 0;
        return {
            totalInvested: inv,
            currentValue: val,
            totalPnL: pnl,
            pnlPercent: pct,
            dayPnL: dayP,
        };
    }, [enrichedHoldings, prevCloses]);

    // Sector Allocation for Pie Chart
    const allocation = useMemo(() => {
        const map: Record<string, number> = {};
        enrichedHoldings.forEach(h => {
            const value = h.currentPrice! * h.quantity;
            const sector = h.sector || 'Other';
            map[sector] = (map[sector] || 0) + value;
        });

        // Sort and calculate percentages
        return Object.entries(map).map(([sector, value], index) => {
            // Pick color from a predefined palette based on index
            const palette = ['#6366F1', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6'];
            return {
                x: sector,
                y: value,
                percent: (value / currentValue) * 100,
                color: palette[index % palette.length]
            };
        }).sort((a, b) => b.y - a.y);
    }, [enrichedHoldings, currentValue]);

    // Calculate XIRR
    const portfolioXIRR = useMemo(() => {
        if (enrichedHoldings.length === 0) return 0;

        const cashflows = enrichedHoldings.map(h => ({
            amount: -(h.buyPrice * h.quantity), // Outflow is negative
            date: new Date(h.buyDate)
        }));

        // Final cashflow is current value as a positive amount today
        cashflows.push({
            amount: currentValue,
            date: new Date()
        });

        try {
            return calculateXIRR(cashflows);
        } catch (e) {
            return 0; // If calculation fails to converge
        }
    }, [enrichedHoldings, currentValue]);

    const isPositive = totalPnL >= 0;
    const changeColor = getChangeColor(pnlPercent);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.profileIconPlaceholder}>
                        <Ionicons name="person" size={20} color={Colors.white} />
                    </View>
                    <Text style={styles.headerTitle}>Portfolio</Text>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowAddModal(true)}
                >
                    <Ionicons name="add" size={22} color={Colors.white} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={enrichedHoldings}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <>
                        {/* Overview Card */}
                        <View style={styles.overviewCard}>
                            <Text style={styles.overviewValue}>{formatRupee(currentValue)}</Text>
                            <View style={styles.returnValueContainer}>
                                <Text style={[styles.returnText, { color: changeColor }]}>
                                    {isPositive ? '+' : ''}{formatRupee(totalPnL)} ({isPositive ? '+' : ''}{formatPercent(pnlPercent)})
                                </Text>
                                <Text style={styles.returnLabel}> Total Returns</Text>
                            </View>
                            <View style={styles.returnValueContainer}>
                                <Text style={[styles.returnText, { color: getChangeColor(dayPnL) }]}>
                                    {dayPnL >= 0 ? '+' : ''}{formatRupee(dayPnL)}
                                </Text>
                                <Text style={styles.returnLabel}> 1D Returns</Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.statsRow}>
                                <View style={styles.statBox}>
                                    <Text style={styles.statLabel}>Invested</Text>
                                    <Text style={styles.statText}>{formatRupee(totalInvested)}</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Text style={styles.statLabel}>XIRR</Text>
                                    <Text style={[styles.statText, { color: getChangeColor(portfolioXIRR) }]}>
                                        {formatPercent(portfolioXIRR)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Allocation Chart */}
                        {allocation.length > 0 && (
                            <View style={styles.chartContainer}>
                                <Text style={styles.sectionTitle}>Sector Allocation</Text>
                                <View style={styles.chartRow}>
                                    <View style={styles.pieWrapper}>
                                        <Svg width="160" height="160" viewBox="0 0 160 160">
                                            <G transform="translate(80, 80)">
                                                {allocation.length === 1 ? (
                                                    // Draw a full circle if only 1 slice
                                                    <Path
                                                        d="M -50 0 A 50 50 0 1 0 50 0 A 50 50 0 1 0 -50 0"
                                                        fill="none"
                                                        stroke={allocation[0].color}
                                                        strokeWidth={30} // Outer radius 80, inner 50 = width 30
                                                    />
                                                ) : (
                                                    allocation.reduce((acc, slice, i) => {
                                                        const startAngle = acc.angle;
                                                        const endAngle = startAngle + (slice.percent / 100) * Math.PI * 2;

                                                        // Start point outer radius
                                                        const x1 = Math.cos(startAngle) * 80;
                                                        const y1 = Math.sin(startAngle) * 80;

                                                        // End point outer radius
                                                        const x2 = Math.cos(endAngle) * 80;
                                                        const y2 = Math.sin(endAngle) * 80;

                                                        // Start point inner radius
                                                        const x3 = Math.cos(endAngle) * 50;
                                                        const y3 = Math.sin(endAngle) * 50;

                                                        // End point inner radius
                                                        const x4 = Math.cos(startAngle) * 50;
                                                        const y4 = Math.sin(startAngle) * 50;

                                                        const largeArcFlag = slice.percent > 50 ? 1 : 0;

                                                        const d = [
                                                            `M ${x1} ${y1}`, // Move to outer start
                                                            `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`, // Arc to outer end
                                                            `L ${x3} ${y3}`, // Line to inner end
                                                            `A 50 50 0 ${largeArcFlag} 0 ${x4} ${y4}`, // Arc to inner start
                                                            'Z' // Close path
                                                        ].join(' ');

                                                        acc.elements.push(
                                                            <Path key={slice.x} d={d} fill={slice.color} />
                                                        );

                                                        acc.angle = endAngle;
                                                        return acc;
                                                    }, { angle: -Math.PI / 2, elements: [] as React.JSX.Element[] }).elements
                                                )}
                                            </G>
                                        </Svg>
                                    </View>
                                    <View style={styles.legendWrapper}>
                                        {allocation.map(a => (
                                            <View key={a.x} style={styles.legendItem}>
                                                <View style={[styles.legendDot, { backgroundColor: a.color }]} />
                                                <View>
                                                    <Text style={styles.legendLabel}>{a.x}</Text>
                                                    <Text style={styles.legendPct}>{a.percent.toFixed(1)}%</Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        )}

                        <Text style={[styles.sectionTitle, { marginHorizontal: Spacing.xl, marginTop: Spacing.lg }]}>Holdings</Text>
                    </>
                }
                renderItem={({ item }) => (
                    <HoldingRow
                        holding={item}
                        currentPrice={item.currentPrice!}
                        onPressDel={() => {
                            Alert.alert('Remove', `Delete this ${item.symbol} holding?`, [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Delete', style: 'destructive', onPress: () => removeHolding(item.id) },
                            ]);
                        }}
                        onPressEdit={() => setEditingHolding(item)}
                    />
                )}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <EmptyState
                        iconName="pie-chart-outline"
                        title="No holdings added"
                        description="Tap + to start tracking your investments"
                        actionLabel="Add Holding"
                        onAction={() => setShowAddModal(true)}
                    />
                }
            />

            <AddHoldingModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={addHolding}
            />

            {/* Edit Holding Modal */}
            {editingHolding && (
                <Modal visible={true} animationType="slide" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Edit Holding</Text>
                            <Text style={styles.modalSubtext}>{cleanTicker(editingHolding.symbol)} — {editingHolding.name}</Text>
                            <EditHoldingForm
                                holding={editingHolding}
                                onSave={(updates) => {
                                    updateHolding(editingHolding.id, updates);
                                    setEditingHolding(null);
                                }}
                                onCancel={() => setEditingHolding(null)}
                            />
                        </View>
                    </View>
                </Modal>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: 50,
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
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: 100,
    },
    overviewCard: {
        marginHorizontal: Spacing.xl,
        marginTop: Spacing.lg,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        alignItems: 'center',
    },
    overviewValue: {
        fontSize: 36,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    returnValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    returnText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
    },
    returnLabel: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        width: '100%',
        marginVertical: Spacing.lg,
    },
    statsRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
    },
    statBox: {
        alignItems: 'flex-start',
    },
    statLabel: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    statText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    chartContainer: {
        marginTop: Spacing.xl,
        paddingHorizontal: Spacing.xl,
    },
    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    chartRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    pieWrapper: {
        width: 160,
        height: 160,
    },
    legendWrapper: {
        flex: 1,
        paddingLeft: Spacing.lg,
        gap: Spacing.md,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    legendLabel: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        fontWeight: FontWeight.medium,
    },
    legendPct: {
        fontSize: FontSize.xs - 2,
        color: Colors.textTertiary,
    },
    // Row
    holdingRow: {
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.md,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    holdingRowTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    holdingCompanyInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    holdingLogoPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: BorderRadius.sm,
        backgroundColor: Colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    holdingLogoText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.textSecondary,
    },
    holdingSymbol: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    holdingQty: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    delBtn: {
        padding: 4,
    },
    holdingRowBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    holdingRight: {
        alignItems: 'flex-end',
    },
    holdingLabel: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    holdingValue: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },
    holdingPnl: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
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
        maxHeight: '90%',
        minHeight: '60%',
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
    modalSubtext: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginTop: 4,
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
        padding: Spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
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
    searchResultPrice: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        color: Colors.textPrimary,
    },
    formContainer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xl * 2,
    },
    selectedStockChip: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: Colors.primaryGlow,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        marginBottom: Spacing.xl,
        gap: Spacing.xs,
    },
    selectedStockText: {
        color: Colors.primary,
        fontWeight: FontWeight.bold,
        fontSize: FontSize.sm,
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    inputLabel: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.xs,
    },
    inputField: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: FontSize.md,
        color: Colors.textPrimary,
        backgroundColor: Colors.surfaceLight,
    },
    saveBtn: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        alignItems: 'center',
        marginTop: Spacing.md,
    },
    saveBtnText: {
        color: Colors.white,
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
    },
});
