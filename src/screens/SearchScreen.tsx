import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../constants/theme';
import { searchStocks } from '../api/marketApi';
import { StockQuote } from '../types';
import { formatRupee, getChangeColor } from '../utils/formatters';

export default function SearchScreen() {
    const navigation = useNavigation<any>();
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<StockQuote[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        const fetchResults = async () => {
            if (search.length < 2) {
                setResults([]);
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const data = await searchStocks(search);
                setResults(data);
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchResults, 500);
        return () => clearTimeout(timeoutId);
    }, [search]);

    useEffect(() => {
        // Auto-focus the search input on mount
        const timer = setTimeout(() => inputRef.current?.focus(), 500);
        return () => clearTimeout(timer);
    }, []);

    const renderResult = ({ item }: { item: StockQuote }) => (
        <TouchableOpacity
            style={styles.resultCard}
            onPress={() => navigation.navigate('StockDetail', { symbol: item.symbol })}
        >
            <View style={styles.resultLeft}>
                <View style={styles.symbolBadge}>
                    <Text style={styles.symbolText}>{item.symbol}</Text>
                </View>
                <View style={styles.nameCol}>
                    <Text style={styles.companyName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.exchangeText}>NSE</Text>
                </View>
            </View>
            
            <View style={styles.resultRight}>
                {item.ltp >= 0 && (
                    <>
                        <Text style={styles.priceText}>{item.ltp > 0 ? formatRupee(item.ltp) : '---'}</Text>
                        {item.changePercent !== 0 && (
                            <Text style={[styles.changeText, { color: getChangeColor(item.changePercent) }]}>
                                {item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                            </Text>
                        )}
                    </>
                )}
                <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} style={{ marginLeft: Spacing.sm }} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* Header / Search Bar */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={Colors.textTertiary} />
                    <TextInput
                        ref={inputRef}
                        style={styles.searchInput}
                        placeholder="Search stocks (e.g. RELIANCE)..."
                        placeholderTextColor={Colors.textTertiary}
                        value={search}
                        onChangeText={setSearch}
                        autoCapitalize="characters"
                        returnKeyType="search"
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Results */}
            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : search.length > 0 && results.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="search-outline" size={48} color={Colors.border} />
                    <Text style={styles.emptyTitle}>No stocks found</Text>
                    <Text style={styles.emptySub}>Try searching for another symbol</Text>
                </View>
            ) : search.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="rocket-outline" size={48} color={Colors.border} />
                    <Text style={styles.emptyTitle}>Discover Stocks</Text>
                    <Text style={styles.emptySub}>Enter a symbol or company name</Text>
                </View>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={item => item.symbol}
                    renderItem={renderResult}
                    contentContainerStyle={styles.list}
                    keyboardShouldPersistTaps="handled"
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
        paddingHorizontal: Spacing.lg,
        paddingTop: 56,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        gap: Spacing.md,
    },
    backBtn: {
        padding: Spacing.xs,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: Spacing.sm,
        fontSize: FontSize.md,
        color: Colors.textPrimary,
    },
    list: {
        padding: Spacing.lg,
    },
    resultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.surface,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    resultLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: Spacing.md,
    },
    symbolBadge: {
        backgroundColor: Colors.surfaceLight,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
        minWidth: 70,
        alignItems: 'center',
    },
    symbolText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    nameCol: {
        flex: 1,
    },
    companyName: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        color: Colors.textPrimary,
    },
    exchangeText: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        marginTop: 2,
    },
    resultRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    priceText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    changeText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
        marginLeft: 4,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    emptyTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.textSecondary,
        marginTop: Spacing.md,
    },
    emptySub: {
        fontSize: FontSize.sm,
        color: Colors.textTertiary,
        marginTop: 4,
    },
});
