// News Feed Screen — Filterable by Sector and Sentiment
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Image, StatusBar, ScrollView, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../constants/theme';
import { formatTimeAgo } from '../utils/formatters';
import { Sector, NewsItem } from '../types';
import EmptyState from '../components/common/EmptyState';
import LoadingShimmer from '../components/common/LoadingShimmer';
import ErrorState from '../components/common/ErrorState';
import { getLatestNews } from '../api/marketApi';

export default function NewsScreen() {
    const navigation = useNavigation<any>();
    const [activeSector, setActiveSector] = useState<Sector | 'All'>('All');
    const [activeSentiment, setActiveSentiment] = useState<'All' | 'Bullish' | 'Bearish' | 'Neutral'>('All');

    const sectors: (string | 'All')[] = ['All', 'Banking', 'IT', 'Auto', 'FMCG', 'Energy'];
    const sentiments = ['All', 'Bullish', 'Bearish', 'Neutral'];

    const [news, setNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNews = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getLatestNews();
            if (data && data.length > 0) {
                setNews(data);
            } else {
                setError('No news articles found.');
            }
        } catch (err) {
            setError('Failed to load market news.');
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchNews();
    }, []);

    const filteredNews = news.filter(item => {
        let matchSector = true;
        if (activeSector !== 'All') {
            const content = `${item.headline} ${item.description}`.toLowerCase();
            const keywords: Record<string, string[]> = {
                'Banking': ['bank', 'rbi', 'loans', 'hdfc', 'sbi', 'icici'],
                'IT': ['tech', 'software', 'tcs', 'infosys', 'wipro', 'ai'],
                'Auto': ['auto', 'vehicle', 'ev', 'tata motors', 'maruti'],
                'FMCG': ['fmcg', 'consumer', 'itc', 'unilever'],
                'Energy': ['energy', 'oil', 'gas', 'power', 'reliance'],
                'All': []
            };

            matchSector = (keywords[activeSector as string] || []).some(kw => content.includes(kw));
        }

        let matchSentiment = activeSentiment === 'All' ? true : item.sentiment === activeSentiment;

        return matchSector && matchSentiment;
    });

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case 'Bullish': return Colors.gain;
            case 'Bearish': return Colors.loss;
            default: return Colors.textTertiary;
        }
    };

    const openLink = async (url: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                console.log(`Don't know how to open this URL: ${url}`);
            }
        } catch (error) {
            console.error('An error occurred', error);
        }
    };

    const renderNewsCard = ({ item }: { item: NewsItem }) => {
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => openLink(item.url)}
            >
                <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.cardImage}
                />
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.sourceText}>{item.source}</Text>
                        <Text style={styles.timeText}>{formatTimeAgo(item.publishedAt)}</Text>
                    </View>

                    <Text style={styles.headline} numberOfLines={3}>
                        {item.headline}
                    </Text>

                    <View style={styles.cardFooter}>
                        <View style={styles.tagsContainer}>
                            {item.relatedSymbols.slice(0, 2).map(sym => (
                                <View key={sym} style={styles.tag}>
                                    <Text style={styles.tagText}>{sym}</Text>
                                </View>
                            ))}
                            {item.relatedSymbols.length > 2 && (
                                <Text style={styles.moreTags}>+{item.relatedSymbols.length - 2}</Text>
                            )}
                        </View>

                        <View style={[
                            styles.sentimentBadge,
                            { borderColor: getSentimentColor(item.sentiment) }
                        ]}>
                            <Text style={[styles.sentimentText, { color: getSentimentColor(item.sentiment) }]}>
                                {item.sentiment}
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
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
                <Text style={styles.headerTitle}>Market News</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Filters */}
            <View style={styles.filtersWrapper}>
                <Text style={styles.filterLabel}>Sector</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
                    {sectors.map((sector: any) => (
                        <TouchableOpacity
                            key={sector}
                            style={[styles.filterChip, activeSector === sector && styles.filterChipActive]}
                            onPress={() => setActiveSector(sector)}
                        >
                            <Text style={[styles.filterText, activeSector === sector && styles.filterTextActive]}>
                                {sector}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={styles.filterLabel}>Sentiment</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filtersContainer, { marginBottom: Spacing.md }]}>
                    {sentiments.map(sentiment => (
                        <TouchableOpacity
                            key={sentiment}
                            style={[
                                styles.filterChip,
                                activeSentiment === sentiment && { borderColor: getSentimentColor(sentiment), backgroundColor: getSentimentColor(sentiment) + '20' }
                            ]}
                            onPress={() => setActiveSentiment(sentiment as any)}
                        >
                            <Text style={[
                                styles.filterText,
                                activeSentiment === sentiment && { color: getSentimentColor(sentiment), fontWeight: FontWeight.bold }
                            ]}>
                                {sentiment}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* News List / States */}
            {isLoading ? (
                <View style={{ padding: Spacing.xl, gap: Spacing.lg }}>
                    <LoadingShimmer width="100%" height={260} borderRadius={BorderRadius.lg} />
                    <LoadingShimmer width="100%" height={260} borderRadius={BorderRadius.lg} />
                    <LoadingShimmer width="100%" height={260} borderRadius={BorderRadius.lg} />
                </View>
            ) : error ? (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <ErrorState
                        title="News Unavailable"
                        message={error}
                        onRetry={fetchNews}
                    />
                </View>
            ) : (
                <FlatList
                    data={filteredNews}
                    keyExtractor={item => item.id}
                    renderItem={renderNewsCard}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshing={isLoading}
                    onRefresh={fetchNews}
                    ListEmptyComponent={
                        <EmptyState
                            iconName="newspaper-outline"
                            title="No news found"
                            description="Try adjusting your filters or pull to refresh."
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
    filtersWrapper: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        paddingBottom: Spacing.sm,
    },
    filterLabel: {
        paddingHorizontal: Spacing.xl,
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        marginTop: Spacing.sm,
        marginBottom: Spacing.xs,
        textTransform: 'uppercase',
    },
    filtersContainer: {
        paddingHorizontal: Spacing.xl,
        gap: Spacing.sm,
    },
    filterChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
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
        padding: Spacing.xl,
        gap: Spacing.lg,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cardImage: {
        width: '100%',
        height: 160,
        backgroundColor: Colors.surfaceLight,
    },
    cardContent: {
        padding: Spacing.lg,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    sourceText: {
        fontSize: FontSize.xs,
        color: Colors.primary,
        fontWeight: FontWeight.bold,
        textTransform: 'uppercase',
    },
    timeText: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
    },
    headline: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        lineHeight: 22,
        marginBottom: Spacing.md,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tagsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    tag: {
        backgroundColor: Colors.surfaceLight,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    },
    tagText: {
        fontSize: FontSize.xs - 2,
        color: Colors.textSecondary,
        fontWeight: FontWeight.bold,
    },
    moreTags: {
        fontSize: FontSize.xs - 2,
        color: Colors.textTertiary,
    },
    sentimentBadge: {
        borderWidth: 1,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    sentimentText: {
        fontSize: FontSize.xs - 2,
        fontWeight: FontWeight.bold,
        textTransform: 'uppercase',
    },
});
