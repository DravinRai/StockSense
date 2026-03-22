// Stock Detail Screen — Groww-style UI with chart, indicators, fundamentals
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Dimensions, StatusBar, Platform, PanResponder, Animated, Alert,
    TextInput, Modal, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LineChart, CandlestickChart } from 'react-native-wagmi-charts';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../constants/theme';
import { mockStocks, mockCandleData, mockFundamentals, mockTechnicalIndicators } from '../data/mockData';
import { formatRupee, formatPercent, formatMarketCap, getChangeColor, cleanTicker, safeNumber } from '../utils/formatters';
import { calculateRSI, calculateBollingerBands, calculateMACD } from '../utils/indicators';
import { useWatchlist } from '../context/WatchlistContext';
import { usePortfolio } from '../context/PortfolioContext';
import { format as formatDateFns } from 'date-fns';
import { TimePeriod, StockQuote, CandleData, TechnicalIndicators, FundamentalData } from '../types';
import LoadingShimmer from '../components/common/LoadingShimmer';
import ErrorState from '../components/common/ErrorState';
import CompanyLogo from '../components/common/CompanyLogo';
import AIInsightsCard from '../components/AIInsightsCard';
import { getLatestNews, getQuotes, getStockChart, fetchChartData, getIndices, getQuoteSummary } from '../api/marketApi';
import { useStockAnalysis } from "../hooks/useStockAnalysis";
import { StockData, UserHolding } from "../constants/analysisPrompts";
import AIInsightsTrigger from '../components/AIInsightsTrigger';

const { width } = Dimensions.get('window');

// ─── Time Period Selector ────────────────────────────────
const PERIODS: TimePeriod[] = ['1D', '1W', '1M', '3M', '6M', '1Y', '3Y', '5Y', 'All'];

// ─── Main Stock Detail Screen ────────────────────────────
export default function StockDetailScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const symbol = route.params?.symbol || 'RELIANCE';

    // 1. Timeframe & Chart States
    const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1Y');
    const [chartData, setChartData] = useState<any[]>([]);
    const [chartLoading, setChartLoading] = useState<boolean>(true);
    const [priceChange, setPriceChange] = useState(0);
    const [percentChange, setPercentChange] = useState(0);
    const [firstPrice, setFirstPrice] = useState(0);
    const [isPositive, setIsPositive] = useState(true);

    const [terminalMode, setTerminalMode] = useState(false);

// Crosshair logic moved down to resolve declaration order issues

    const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
    const { addHolding, holdings } = usePortfolio();
    const isWatchlisted = isInWatchlist(symbol);
    const isInPortfolio = holdings.some(h => h.symbol === symbol);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [stock, setStock] = useState<StockQuote | null>(null);
    const [candleDataRaw, setCandleDataRaw] = useState<CandleData[]>([]);
    const [newsHeadlines, setNewsHeadlines] = useState<string[]>([]);

    const { analysis, loading: aiLoading, error: aiError, fetchAnalysis, askQuestion } = useStockAnalysis();

    const [askText, setAskText] = useState("");
    const [askAnswer, setAskAnswer] = useState<string | null>(null);
    const [isAsking, setIsAsking] = useState(false);
    const [showAskModal, setShowAskModal] = useState(false);

    const handleAskSubmit = async () => {
        if (!askText.trim() || !stock) return;
        setIsAsking(true);
        try {
            const answer = await askQuestion(askText.trim(), stock.symbol);
            setAskAnswer(answer);
            setShowAskModal(true);
        } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to get AI answer.");
        } finally {
            setIsAsking(false);
            setAskText("");
        }
    };

    const fetchQuoteDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getQuotes([symbol]);
            if (data && data.length > 0) {
                setStock(data[0]);
            } else {
                setError(`Data Unavailable - Could not find data for ${cleanTicker(symbol)}. The market may be closed or the symbol might be incorrect.`);
            }
        } catch (err) {
            setError('Network Error - Unable to connect to market servers. Please check your internet connection.');
        } finally {
            setIsLoading(false);
        }
    };

    // 3. Load function — fires every time timeframe changes
    const loadChartForTimeframe = async (tf: string) => {
        try {
            setChartLoading(true);
            setChartData([]); // Clear old data immediately

            console.log('Loading chart for:', symbol, tf);
            const result = await fetchChartData(symbol, tf);

            console.log('Chart loaded, points:', result.chartData.length);
            console.log('% change:', result.percentChange);

            setChartData(result.chartData);
            setPriceChange(result.priceChange);
            setPercentChange(result.percentChange);
            setFirstPrice(result.firstPrice);
            setIsPositive(result.percentChange >= 0);
            setCandleDataRaw(result.chartData);
        } catch (err) {
            console.error('Chart load error:', err);
            try {
                const chart = await getStockChart(symbol, tf as any);
                const data = (chart && chart.length > 0)
                    ? chart
                    : (mockCandleData[symbol] || mockCandleData['RELIANCE'] || []);
                setChartData(data);
                setCandleDataRaw(data);
                // Compute % change from fallback data
                const validPrices = data.filter((d: any) => d.close > 0);
                if (validPrices.length >= 2) {
                    const fp = Number(validPrices[0].close);
                    const lp = Number(validPrices[validPrices.length - 1].close);
                    const pc = lp - fp;
                    const pct = (pc / fp) * 100;
                    console.log('FALLBACK PRICE DEBUG: fp=', fp, 'lp=', lp, 'pct=', pct);
                    setPriceChange(parseFloat(pc.toFixed(2)));
                    setPercentChange(parseFloat(pct.toFixed(2)));
                    setFirstPrice(fp);
                    setIsPositive(pct >= 0);
                }
            } catch {
                const data = mockCandleData[symbol] || mockCandleData['RELIANCE'] || [];
                setChartData(data);
                setCandleDataRaw(data);
                const validPrices = data.filter((d: any) => d.close > 0);
                if (validPrices.length >= 2) {
                    const fp = Number(validPrices[0].close);
                    const lp = Number(validPrices[validPrices.length - 1].close);
                    const pc = lp - fp;
                    const pct = (pc / fp) * 100;
                    setPriceChange(parseFloat(pc.toFixed(2)));
                    setPercentChange(parseFloat(pct.toFixed(2)));
                    setFirstPrice(fp);
                    setIsPositive(pct >= 0);
                }
            }
        } finally {
            setChartLoading(false);
        }
    };

    React.useEffect(() => {
        fetchQuoteDetails();
    }, [symbol]);

    // 2. Effect — fires every time timeframe changes
    React.useEffect(() => {
        console.log('Timeframe changed to:', selectedTimeframe);
        loadChartForTimeframe(selectedTimeframe);
    }, [selectedTimeframe]);

    // 4. Button press handler
    const handleTimeframePress = (tf: string) => {
        console.log('Button pressed:', tf);
        setSelectedTimeframe(tf);
        // useEffect fires automatically after this
    };

    useEffect(() => {
        let active = true;

        const fetchNews = async () => {
            try {
                const latestNews = await getLatestNews();
                const keyword = cleanTicker(symbol).toLowerCase();
                const related = latestNews.filter((item: any) =>
                    (item.headline || '').toLowerCase().includes(keyword)
                );
                const fallbackNews = (related.length > 0 ? related : latestNews)
                    .slice(0, 3)
                    .map((item: any) => item.headline || 'N/A');

                if (active) {
                    setNewsHeadlines(fallbackNews);
                }
            } catch {
                if (active) {
                    setNewsHeadlines(['N/A', 'N/A', 'N/A']);
                }
            }
        };

        fetchNews();

        return () => {
            active = false;
        };
    }, [symbol]);

    const isMarketOpen = useCallback(() => {
        const now = new Date();
        const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const day = istNow.getDay();
        if (day === 0 || day === 6) return false;

        const currentMinutes = istNow.getHours() * 60 + istNow.getMinutes();
        const openMinutes = 9 * 60 + 15;
        const closeMinutes = 15 * 60 + 30;
        return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
    }, []);

    // Calculate real indicators based on chart data
    const technicals: TechnicalIndicators = useMemo(() => {
        const prices = candleDataRaw.map(c => c.close);
        if (prices.length === 0) return mockTechnicalIndicators['RELIANCE'];

        return {
            rsi: calculateRSI(prices),
            macd: calculateMACD(prices),
            bollingerBands: calculateBollingerBands(prices),
            support: [Math.min(...prices.slice(-20)) * 0.95],
            resistance: [Math.max(...prices.slice(-20)) * 1.05]
        };
    }, [candleDataRaw]);

    const performAnalysis = useCallback(async () => {
        if (!stock || candleDataRaw.length === 0) return;

        const holding = holdings.find((h: any) => h.symbol === symbol);

        // Fetch Nifty 50
        let niftyLevel: number | undefined;
        let niftyChangePercent: number | undefined;
        try {
            const indices = await getIndices();
            const nifty = indices.find(i => i.name === 'NIFTY 50');
            if (nifty) {
                niftyLevel = nifty.value;
                niftyChangePercent = nifty.changePercent;
            }
        } catch (e) {
            console.log("Failed to fetch Nifty 50 for analysis", e);
        }

        // Fetch Quote Summary (financials & news)
        let financialData, keyStatistics, earningsHistory;
        let topNews: { headline: string; summary: string }[] = [];
        try {
            const summary = await getQuoteSummary(stock.symbol);
            if (summary) {
                financialData = summary.financialData;
                keyStatistics = summary.defaultKeyStatistics;
                earningsHistory = summary.earningsHistory;
                if (summary.news && summary.news.length > 0) {
                    topNews = summary.news.slice(0, 3).map((n: any) => ({
                        headline: n.title,
                        summary: n.summary || n.description || ""
                    }));
                }
            }
        } catch (e) {
            console.log("Failed to fetch quote summary for analysis", e);
        }

        const mappedStockData: StockData = {
            name: stock.name,
            symbol: stock.symbol,
            currentPrice: stock.ltp,
            change: stock.change,
            changePercent: stock.changePercent,
            open: stock.open,
            dayHigh: stock.high,
            dayLow: stock.low,
            high52w: stock.week52High || 0,
            low52w: stock.week52Low || 0,
            volume: stock.volume,
            avgVolume: stock.averageDailyVolume3Month || 0,
            pe: stock.trailingPE || 0,
            marketCap: stock.marketCap || 0,
            sector: stock.sector,
            niftyLevel,
            niftyChangePercent,
            recentNews: newsHeadlines.length > 0 ? newsHeadlines.join(" | ") : undefined,
            financialData,
            keyStatistics,
            earningsHistory,
            topNews
        };

        console.log("Mapped StockData:", mappedStockData);

        let mappedUserHolding: UserHolding | undefined;
        if (holding) {
            const quantity = holding.quantity || 0;
            const avgPrice = holding.buyPrice || 0;
            const investedValue = quantity * avgPrice;
            const currentValue = quantity * stock.ltp;
            const pnl = currentValue - investedValue;
            const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;
            
            mappedUserHolding = {
                shares: quantity,
                avgPrice,
                currentValue,
                investedValue,
                pnl,
                pnlPercent
            };
        }

        const totalPortfolioValue = holdings.reduce((sum: number, h: any) => {
           return sum + ((h.quantity || 0) * (h.currentPrice || h.buyPrice || 0));
        }, 0);

        await fetchAnalysis(mappedStockData, mappedUserHolding, totalPortfolioValue);
    }, [stock, symbol, holdings, newsHeadlines, candleDataRaw, fetchAnalysis]);


    // Fundamentals — prefer live Yahoo Finance data, fall back to mock
    const fundamentals: FundamentalData = useMemo(() => {
        if (!stock) return mockFundamentals['RELIANCE'];
        const mock = mockFundamentals[cleanTicker(stock.symbol)] || mockFundamentals['RELIANCE'];
        return {
            pe: stock.trailingPE || mock?.pe || 0,
            eps: stock.epsTrailingTwelveMonths || mock?.eps || 0,
            bookValue: stock.bookValue || mock?.bookValue || 0,
            dividendYield: stock.dividendYield || mock?.dividendYield || 0,
            marketCap: stock.marketCap || mock?.marketCap || 0,
            promoterHolding: mock?.promoterHolding || 0,
            fiiHolding: mock?.fiiHolding || 0,
            diiHolding: mock?.diiHolding || 0,
            publicHolding: mock?.publicHolding || 0,
            pledgedPercent: mock?.pledgedPercent || 0,
            debtToEquity: mock?.debtToEquity || 0,
            roe: mock?.roe || 0
        };
    }, [stock]);

    // Format data for wagmi-charts
    const formattedChartData = useMemo(() => {
        return candleDataRaw.map(d => ({
            timestamp: d.timestamp,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
            volume: d.volume || 0,
            x: d.x,
            y: d.y,
        })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [candleDataRaw]);

    const lineData = useMemo(() => {
        return candleDataRaw.map((d, i) => ({
            ...d,
            value: d.close,
            timestamp: typeof d.timestamp === 'string' ? new Date(d.timestamp).getTime() : d.timestamp,
        }));
    }, [candleDataRaw]);

    // Refs for scrub logic
    const chartDataRef = useRef(lineData);
    useEffect(() => {
        chartDataRef.current = lineData;
    }, [lineData]);

    const crosshairX = useRef(new Animated.Value(0)).current;
    const crosshairY = useRef(new Animated.Value(0)).current;
    const tooltipX = useRef(new Animated.Value(0)).current;
    const tooltipY = useRef(new Animated.Value(0)).current;
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [scrubbedData, setScrubbedData] = useState<CandleData | null>(null);

    // Calculate chart extents once per chart load to avoid O(N) in pan move
    const chartExtents = useMemo(() => {
        if (chartData.length === 0) return { min: 0, max: 1 };
        const prices = chartData.map(d => d.close);
        return {
            min: Math.min(...prices),
            max: Math.max(...prices)
        };
    }, [chartData]);

    // Header values — use periodData (per-timeframe) when not scrubbing
    const [livePrice, setLivePrice] = useState(stock?.ltp || 0);
    const [liveChange, setLiveChange] = useState(stock?.change || 0);
    const [livePercent, setLivePercent] = useState(stock?.changePercent || 0);

    useEffect(() => {
        if (!isScrubbing && stock) {
            // If quote API returned 0 (stub), use last chart close instead
            const price = stock.ltp > 0
                ? stock.ltp
                : (chartData.length > 0 ? chartData[chartData.length - 1].close : 0);
            setLivePrice(price);
            if (chartData.length > 0) {
                setLiveChange(priceChange);
                setLivePercent(percentChange);
            } else {
                setLiveChange(stock.change);
                setLivePercent(stock.changePercent);
            }
        }
    }, [stock, isScrubbing, chartData, priceChange, percentChange]);

    const chartWidth = width;
    const paddingLeft = 50; // Y-axis area padding
    const effectiveWidth = chartWidth - paddingLeft;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                setIsScrubbing(true);
                handleTouch(evt.nativeEvent.locationX);
            },
            onPanResponderMove: (evt) => {
                handleTouch(evt.nativeEvent.locationX);
            },
            onPanResponderRelease: () => {
                setIsScrubbing(false);
                setScrubbedData(null);
            },
        })
    ).current;

    const handleTouch = (x: number) => {
        const data = chartDataRef.current;
        if (!data || data.length === 0) return;

        // Map X to data index
        const touchX = x - paddingLeft;
        const index = Math.round((touchX / effectiveWidth) * (data.length - 1));
        const safeIndex = Math.max(0, Math.min(index, data.length - 1));
        
        const point = data[safeIndex];
        setScrubbedData(point);

        // Calculate Y position using exactly 250 chart height mapping
        const range = chartExtents.max - chartExtents.min || 1;
        const ratio = (point.close - chartExtents.min) / range;
        const yPos = 250 - (ratio * 250);

        // Update animated position (smooth because it bypasses React render)
        const clampedX = Math.max(paddingLeft, Math.min(x, chartWidth));
        crosshairX.setValue(clampedX);
        crosshairY.setValue(yPos);

        // Tooltip dimensions: width ~ 180, height ~ 30
        const TOOLTIP_WIDTH = 180;
        let tX = clampedX - (TOOLTIP_WIDTH / 2);
        if (tX < 10) tX = 10;
        if (tX > chartWidth - TOOLTIP_WIDTH - 10) tX = chartWidth - TOOLTIP_WIDTH - 10;
        
        // Tooltip above the dot. If Y is too close to top, put it *below* the dot.
        let tY = yPos - 40;
        if (tY < 0) tY = yPos + 20;

        tooltipX.setValue(tX);
        tooltipY.setValue(tY);

        // Update header live
        const selectedFirstPrice = firstPrice > 0 ? firstPrice : data[0].close;
        const currentPrice = point.close;
        const change = currentPrice - selectedFirstPrice;
        const percent = (change / selectedFirstPrice) * 100;

        setLivePrice(currentPrice);
        setLiveChange(change);
        setLivePercent(percent);
    };

    // Moving Averages summary
    const movingAverages = useMemo(() => {
        const prices = candleDataRaw.map(c => c.close);
        if (prices.length < 50) return { buy: 4, sell: 3, neutral: 1 };
        const currentPrice = prices[prices.length - 1];
        const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
        const sma50 = prices.slice(-50).reduce((a, b) => a + b, 0) / 50;
        let buy = 0, sell = 0, neutral = 0;
        if (currentPrice > sma20) buy++; else if (currentPrice < sma20) sell++; else neutral++;
        if (currentPrice > sma50) buy++; else if (currentPrice < sma50) sell++; else neutral++;
        // EMA approximations
        if (currentPrice > sma20 * 1.01) buy += 2; else sell += 2;
        if (currentPrice > sma50 * 0.99) buy += 2; else sell += 1;
        return { buy, sell, neutral };
    }, [candleDataRaw]);

    // Calculate dynamic change based on chart data
    const activeStock = scrubbedData ? { ...stock, ltp: scrubbedData.close } : stock;

    const periodData = useMemo(() => {
        if (!stock) return { change: 0, changePercent: 0, isPositive: false, changeColor: Colors.textSecondary };
        if (chartData.length > 0) {
            if (scrubbedData) {
                const selectedFirstPrice = firstPrice > 0 ? firstPrice : chartData[0].open;
                const lastPrice = scrubbedData.close;
                const change = lastPrice - selectedFirstPrice;
                const changePercent = selectedFirstPrice > 0 ? (change / selectedFirstPrice) * 100 : 0;
                return {
                    change,
                    changePercent,
                    isPositive: changePercent >= 0,
                    changeColor: getChangeColor(changePercent)
                };
            }
            return {
                change: priceChange,
                changePercent: percentChange,
                isPositive: isPositive,
                changeColor: getChangeColor(percentChange)
            };
        }
        return {
            change: stock.change,
            changePercent: stock.changePercent,
            isPositive: stock.changePercent >= 0,
            changeColor: getChangeColor(stock.changePercent)
        };
    }, [chartData, stock, scrubbedData, priceChange, percentChange, isPositive, firstPrice]);

    const displayLTP = livePrice;
    const displayChange = liveChange;
    const displayChangePercent = livePercent;
    const changeColor = getChangeColor(displayChangePercent);

    const toggleWatchlist = () => {
        if (isWatchlisted) {
            removeFromWatchlist(symbol);
        } else {
            if (stock) {
                addToWatchlist(stock.symbol, stock.name);
            }
        }
    };

    const formatTooltipDate = (timestamp: string | number) => {
        try {
            const d = new Date(timestamp);
            if (isNaN(d.getTime())) return '';
            
            let formatStr = 'd MMM yyyy';
            switch (selectedTimeframe) {
                case '1D': formatStr = 'h:mm a'; break;
                case '1W': 
                case '1M': formatStr = 'h:mm a, d MMM'; break;
                case '3M':
                case '6M':
                case '1Y':
                case '3Y': formatStr = 'd MMM yyyy'; break;
                case '5Y':
                case 'All': formatStr = 'MMM yyyy'; break;
            }
            return formatDateFns(d, formatStr);
        } catch (e) {
            return '';
        }
    };

    // Move early returns AFTER all hooks
    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingBottom: Spacing.xl }]}>
                    <LoadingShimmer width={24} height={24} borderRadius={12} />
                    <View style={styles.headerCenter}>
                        <LoadingShimmer width={100} height={24} style={{ marginBottom: 4 }} />
                        <LoadingShimmer width={150} height={16} />
                    </View>
                    <LoadingShimmer width={24} height={24} borderRadius={12} />
                </View>
                <View style={styles.priceSection}>
                    <LoadingShimmer width={160} height={40} style={{ marginBottom: 8 }} />
                    <LoadingShimmer width={220} height={20} />
                </View>
                <View style={styles.chartContainer}>
                    <LoadingShimmer width="100%" height={250} />
                </View>
            </View>
        );
    }

    if (error || !stock) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                </View>
                <ErrorState
                    title="Data Unavailable"
                    message={error || `Information for ${symbol} could not be loaded.`}
                    onRetry={() => {
                        fetchQuoteDetails();
                        loadChartForTimeframe(selectedTimeframe);
                    }}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

            {/* ─── Header ─── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <CompanyLogo symbol={stock.symbol} size={36} />
                    <View style={styles.headerTitleContainer}>
                        <View style={styles.tickerRow}>
                            <Text style={styles.headerSymbol}>{cleanTicker(stock.symbol)}</Text>
                            <Text style={styles.tickerDot}>•</Text>
                            <View style={styles.exchangeBadge}>
                                <Text style={styles.exchangeText}>{stock.exchange || 'NSE'}</Text>
                            </View>
                        </View>
                        <Text style={styles.headerName} numberOfLines={1}>{stock.name}</Text>
                    </View>
                </View>

                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.headerIcon}>
                        <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerIcon} onPress={toggleWatchlist}>
                        <Ionicons
                            name={isWatchlisted ? 'bookmark' : 'bookmark-outline'}
                            size={22}
                            color={isWatchlisted ? Colors.primary : Colors.textPrimary}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                {/* ─── Price Section ─── */}
                <View style={[styles.priceSection, isScrubbing && { backgroundColor: Colors.surface }]}>
                    <Text style={styles.price}>{formatRupee(displayLTP)}</Text>
                    <View style={styles.changeRow}>
                        <Ionicons name={isPositive ? 'arrow-up' : 'arrow-down'} size={14} color={changeColor} />
                        <Text style={[styles.changeText, { color: changeColor }]}>
                            {isPositive ? '+' : ''}{safeNumber(displayChange).toFixed(2)} ({formatPercent(displayChangePercent)})
                        </Text>
                        <View style={styles.periodBadge}>
                            <Text style={styles.periodBadgeText}>{isScrubbing ? 'Scrubbing' : selectedTimeframe}</Text>
                        </View>
                    </View>
                </View>

                {/* ─── Chart ─── */}
                <View style={styles.chartContainer}>
                    {chartLoading ? (
                        <View style={{ padding: Spacing.xl }}>
                            <LoadingShimmer width="100%" height={250} />
                        </View>
                    ) : (
                        chartData.length > 0 ? (
                            <View style={{ height: 250, width: width }}>
                                {terminalMode ? (
                                    <CandlestickChart.Provider data={lineData as any}>
                                        <CandlestickChart width={width} height={250}>
                                            <CandlestickChart.Candles />
                                        </CandlestickChart>
                                    </CandlestickChart.Provider>
                                ) : (
                                    <LineChart.Provider data={lineData as any}>
                                        <LineChart width={width} height={250}>
                                            <LineChart.Path color={isPositive ? Colors.gain : Colors.loss} />
                                        </LineChart>
                                    </LineChart.Provider>
                                )}

                                {/* Gesture Overlay - Standard RN Views are safe on web */}
                                <View 
                                    style={StyleSheet.absoluteFill} 
                                    {...panResponder.panHandlers} 
                                />

                                {/* Crosshair Elements */}
                                {scrubbedData && (
                                    <View style={StyleSheet.absoluteFill} pointerEvents="none">
                                        <Animated.View
                                            style={[
                                                styles.crosshairLine,
                                                { transform: [{ translateX: crosshairX }] }
                                            ]}
                                        />
                                        <Animated.View
                                            style={[
                                                styles.crosshairDot,
                                                {
                                                    backgroundColor: Colors.white,
                                                    borderColor: isPositive ? Colors.gain : Colors.loss,
                                                    transform: [
                                                        { translateX: crosshairX },
                                                        { translateY: crosshairY }
                                                    ]
                                                }
                                            ]}
                                        />
                                        <Animated.View
                                            style={[
                                                styles.tooltipContainer,
                                                {
                                                    transform: [
                                                        { translateX: tooltipX },
                                                        { translateY: tooltipY }
                                                    ],
                                                    backgroundColor: Colors.surface,
                                                    paddingHorizontal: 10,
                                                    paddingVertical: 5,
                                                    borderRadius: 6,
                                                    borderWidth: 1,
                                                    borderColor: Colors.border,
                                                    shadowColor: '#000',
                                                    shadowOffset: { width: 0, height: 2 },
                                                    shadowOpacity: 0.1,
                                                    shadowRadius: 4,
                                                    elevation: 2,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    zIndex: 100,
                                                }
                                            ]}
                                        >
                                            <Text style={styles.tooltipText} numberOfLines={1}>
                                                {formatRupee(scrubbedData.close)}  |  {formatTooltipDate(scrubbedData.timestamp)}
                                            </Text>
                                        </Animated.View>
                                    </View>
                                )}
                            </View>
                        ) : (
                            <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
                                <Text style={{ color: Colors.textSecondary }}>No chart data available for this period</Text>
                            </View>
                        )
                    )}
                </View>

                {/* ─── Time Period Selector + Terminal Toggle ─── */}
                <View style={styles.periodSelector}>
                    <View style={styles.periodTabs}>
                        {(['1D','1W','1M','3M','6M','1Y','3Y','5Y','All']).map(tf => (
                            <TouchableOpacity
                                key={tf}
                                style={[styles.periodTab, selectedTimeframe === tf && styles.periodTabActive]}
                                onPress={() => handleTimeframePress(tf)}
                            >
                                <Text style={[styles.periodTabText, selectedTimeframe === tf && styles.periodTabTextActive]}>
                                    {tf}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity
                        style={[styles.terminalBtn, terminalMode && styles.terminalBtnActive]}
                        onPress={() => setTerminalMode(!terminalMode)}
                    >
                        <Ionicons
                            name="bar-chart-outline"
                            size={16}
                            color={terminalMode ? Colors.white : Colors.textSecondary}
                        />
                        <Text style={[styles.terminalBtnText, terminalMode && styles.terminalBtnTextActive]}>
                            Terminal
                        </Text>
                    </TouchableOpacity>
                </View>

                {stock && !analysis && !aiLoading ? (
                    <AIInsightsTrigger 
                        onPress={performAnalysis} 
                        loading={aiLoading} 
                    />
                ) : stock ? (
                    <AIInsightsCard
                        analysis={analysis}
                        loading={aiLoading}
                        error={aiError}
                        onRetry={performAnalysis}
                        onRefresh={performAnalysis}
                    />
                ) : null}

                {/* ─── ASK AI SECTION ─── */}
                {stock && analysis && (
                    <View style={styles.askSection}>
                        <Text style={styles.askTitle}>Ask AI about {cleanTicker(stock.symbol)}</Text>
                        <View style={styles.askInputRow}>
                            <TextInput
                                style={styles.askInput}
                                placeholder="E.g. Is it a good time to average down?"
                                placeholderTextColor="#666"
                                value={askText}
                                onChangeText={setAskText}
                                onSubmitEditing={handleAskSubmit}
                            />
                            <TouchableOpacity 
                                style={[styles.askSubmitBtn, (!askText.trim() || isAsking) && { opacity: 0.5 }]} 
                                onPress={handleAskSubmit}
                                disabled={isAsking || !askText.trim()}
                            >
                                {isAsking ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.askSubmitText}>→</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* ─── Stock Info Grid ─── */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Stock Info</Text>
                    <View style={styles.infoCard}>
                        {/* OHLC 2x2 Grid */}
                        <View style={styles.infoGrid}>
                            <InfoItem label="Open" value={formatRupee(stock.open)} />
                            <InfoItem label="High" value={formatRupee(stock.high)} />
                            <InfoItem label="Low" value={formatRupee(stock.low)} />
                            <InfoItem label="Close" value={formatRupee(stock.close)} />
                        </View>

                        <View style={styles.infoDivider} />

                        <View style={styles.infoGrid}>
                            <InfoItem label="52W High" value={formatRupee(stock.week52High)} />
                            <InfoItem label="52W Low" value={formatRupee(stock.week52Low)} />
                            <InfoItem label="Volume" value={formatMarketCap(stock.volume)} />
                            <InfoItem label="Market Cap" value={formatMarketCap(fundamentals.marketCap)} />
                        </View>

                        <View style={styles.infoDivider} />

                        <View style={styles.infoGrid}>
                            <InfoItem label="P/E Ratio" value={fundamentals.pe.toFixed(2)} />
                            <InfoItem label="EPS" value={`₹${fundamentals.eps.toFixed(2)}`} />
                            <InfoItem label="Sector" value={stock.sector || 'N/A'} />
                            <InfoItem label="Industry" value={stock.sector || 'N/A'} />
                        </View>
                    </View>
                </View>

                {/* ─── Technical Indicators ─── */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Technical Indicators</Text>

                    {/* RSI */}
                    <View style={styles.indicatorCard}>
                        <View style={styles.indicatorHeader}>
                            <Text style={styles.indicatorTitle}>RSI (14)</Text>
                            <Text style={[styles.indicatorValue, {
                                color: technicals.rsi > 70 ? Colors.loss : technicals.rsi < 30 ? Colors.gain : Colors.textPrimary
                            }]}>
                                {technicals.rsi.toFixed(1)}
                            </Text>
                        </View>
                        <View style={styles.rsiGaugeBg}>
                            <View style={[styles.rsiGaugeFill, {
                                width: `${Math.min(technicals.rsi, 100)}%`,
                                backgroundColor: technicals.rsi > 70 ? Colors.loss : technicals.rsi < 30 ? Colors.gain : Colors.primary
                            }]} />
                        </View>
                        <View style={styles.rsiLabelsRow}>
                            <Text style={styles.rsiLabel}>Oversold (30)</Text>
                            <Text style={[styles.rsiZoneLabel, {
                                color: technicals.rsi > 70 ? Colors.loss : technicals.rsi < 30 ? Colors.gain : Colors.textSecondary
                            }]}>
                                {technicals.rsi > 70 ? 'Overbought' : technicals.rsi < 30 ? 'Oversold' : 'Neutral'}
                            </Text>
                            <Text style={styles.rsiLabel}>Overbought (70)</Text>
                        </View>
                    </View>

                    {/* MACD */}
                    <View style={styles.indicatorCard}>
                        <View style={styles.indicatorHeader}>
                            <Text style={styles.indicatorTitle}>MACD (12, 26, 9)</Text>
                            <View style={[styles.signalPill, {
                                backgroundColor: technicals.macd.histogram > 0 ? Colors.gainBg : Colors.lossBg
                            }]}>
                                <Text style={[styles.signalPillText, {
                                    color: technicals.macd.histogram > 0 ? Colors.gain : Colors.loss
                                }]}>
                                    {technicals.macd.histogram > 0 ? '▲ Bullish' : '▼ Bearish'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.macdRow}>
                            <View style={styles.macdItem}>
                                <Text style={styles.macdLabel}>MACD Line</Text>
                                <Text style={styles.macdValue}>{technicals.macd.macdLine.toFixed(2)}</Text>
                            </View>
                            <View style={styles.macdItem}>
                                <Text style={styles.macdLabel}>Signal Line</Text>
                                <Text style={styles.macdValue}>{technicals.macd.signalLine.toFixed(2)}</Text>
                            </View>
                            <View style={styles.macdItem}>
                                <Text style={styles.macdLabel}>Histogram</Text>
                                <Text style={[styles.macdValue, {
                                    color: technicals.macd.histogram > 0 ? Colors.gain : Colors.loss
                                }]}>
                                    {technicals.macd.histogram > 0 ? '+' : ''}{technicals.macd.histogram.toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Bollinger Bands */}
                    <View style={styles.indicatorCard}>
                        <View style={styles.indicatorHeader}>
                            <Text style={styles.indicatorTitle}>Bollinger Bands (20, 2)</Text>
                            <View style={[styles.signalPill, {
                                backgroundColor: livePrice > technicals.bollingerBands.upper
                                    ? Colors.lossBg
                                    : livePrice < technicals.bollingerBands.lower
                                        ? Colors.gainBg
                                        : Colors.surfaceLight
                            }]}>
                                <Text style={[styles.signalPillText, {
                                    color: livePrice > technicals.bollingerBands.upper
                                        ? Colors.loss
                                        : livePrice < technicals.bollingerBands.lower
                                            ? Colors.gain
                                            : Colors.textSecondary
                                }]}>
                                    {livePrice > technicals.bollingerBands.upper
                                        ? '▲ Above Upper'
                                        : livePrice < technicals.bollingerBands.lower
                                            ? '▼ Below Lower'
                                            : '● Within Bands'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.macdRow}>
                            <View style={styles.macdItem}>
                                <Text style={styles.macdLabel}>Upper</Text>
                                <Text style={[styles.macdValue, { color: Colors.loss }]}>
                                    {formatRupee(technicals.bollingerBands.upper)}
                                </Text>
                            </View>
                            <View style={styles.macdItem}>
                                <Text style={styles.macdLabel}>Middle (SMA)</Text>
                                <Text style={styles.macdValue}>
                                    {formatRupee(technicals.bollingerBands.middle)}
                                </Text>
                            </View>
                            <View style={styles.macdItem}>
                                <Text style={styles.macdLabel}>Lower</Text>
                                <Text style={[styles.macdValue, { color: Colors.gain }]}>
                                    {formatRupee(technicals.bollingerBands.lower)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Moving Averages */}
                    <View style={styles.indicatorCard}>
                        <View style={styles.indicatorHeader}>
                            <Text style={styles.indicatorTitle}>Moving Averages</Text>
                        </View>
                        <View style={styles.maRow}>
                            <View style={[styles.maBadge, { backgroundColor: Colors.gainBg }]}>
                                <Text style={[styles.maBadgeText, { color: Colors.gain }]}>Buy {movingAverages.buy}</Text>
                            </View>
                            <View style={[styles.maBadge, { backgroundColor: Colors.lossBg }]}>
                                <Text style={[styles.maBadgeText, { color: Colors.loss }]}>Sell {movingAverages.sell}</Text>
                            </View>
                            <View style={[styles.maBadge, { backgroundColor: Colors.surfaceLight }]}>
                                <Text style={[styles.maBadgeText, { color: Colors.textSecondary }]}>Neutral {movingAverages.neutral}</Text>
                            </View>
                        </View>
                        <View style={styles.maBarContainer}>
                            <View style={[styles.maBarSegment, {
                                flex: movingAverages.buy,
                                backgroundColor: Colors.gain,
                                borderTopLeftRadius: 4,
                                borderBottomLeftRadius: 4,
                            }]} />
                            <View style={[styles.maBarSegment, {
                                flex: movingAverages.neutral,
                                backgroundColor: Colors.textTertiary,
                            }]} />
                            <View style={[styles.maBarSegment, {
                                flex: movingAverages.sell,
                                backgroundColor: Colors.loss,
                                borderTopRightRadius: 4,
                                borderBottomRightRadius: 4,
                            }]} />
                        </View>
                    </View>
                </View>
            {/* ─── SEBI Disclaimer ─── */}
            <View style={styles.disclaimerContainer}>
                <Text style={styles.disclaimerText}>
                    ⚠️ Investment in securities market are subject to market risks. Read all related documents carefully before investing. SEBI Registration not required for investment research apps.
                </Text>
            </View>
            </ScrollView>

            {/* ─── Action Buttons ─── */}
            <View style={styles.actionTab}>
                <TouchableOpacity
                    style={[styles.actionBtn, isWatchlisted ? styles.watchlistedBtn : styles.watchlistBtn]}
                    activeOpacity={0.8}
                    onPress={toggleWatchlist}
                >
                    <Ionicons name={isWatchlisted ? 'bookmark' : 'bookmark-outline'} size={16} color={isWatchlisted ? '#fff' : Colors.primary} />
                    <Text style={[styles.actionBtnText, !isWatchlisted && { color: Colors.primary }]}>
                        {isWatchlisted ? 'Watchlisted' : 'Watchlist'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.portfolioBtn]}
                    activeOpacity={0.8}
                    onPress={() => {
                        if (isInPortfolio) {
                            Alert.alert('Already Added', `${cleanTicker(symbol)} is already in your portfolio.`);
                        } else {
                            addHolding({
                                symbol,
                                name: stock.name,
                                buyPrice: safeNumber(livePrice),
                                quantity: 1,
                                buyDate: new Date().toISOString().split('T')[0],
                            });
                            Alert.alert('Added', `${cleanTicker(symbol)} added to portfolio at ₹${safeNumber(livePrice).toFixed(2)}`);
                        }
                    }}
                >
                    <Ionicons name={isInPortfolio ? 'checkmark-circle' : 'add-circle-outline'} size={16} color="#fff" />
                    <Text style={styles.actionBtnText}>{isInPortfolio ? 'In Portfolio' : 'Add to Portfolio'}</Text>
                </TouchableOpacity>
            </View>
            {/* ─── AI Answer Modal ─── */}
            <Modal visible={showAskModal} transparent animationType="slide" onRequestClose={() => setShowAskModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>AI Insights</Text>
                            <TouchableOpacity onPress={() => setShowAskModal(false)}>
                                <Ionicons name="close" size={24} color={Colors.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.modalAnswer}>{askAnswer}</Text>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ─── Reusable Info Item ───────────────────────────────────
function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.infoItem}>
            <Text style={styles.infoItemLabel}>{label}</Text>
            <Text style={styles.infoItemValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    // ── Header ───
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Platform.OS === 'web' ? 20 : 50,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        padding: Spacing.xs,
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: Spacing.md,
        gap: Spacing.sm,
    },
    companyLogo: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    companyLogoText: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.white,
    },
    headerTitleContainer: {
        flex: 1,
    },
    tickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    headerSymbol: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    tickerDot: {
        fontSize: FontSize.md,
        color: Colors.textTertiary,
    },
    exchangeBadge: {
        backgroundColor: Colors.surfaceLight,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    exchangeText: {
        fontSize: FontSize.xs - 1,
        fontWeight: FontWeight.semibold,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
    },
    headerName: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginTop: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    headerIcon: {
        padding: Spacing.xs,
    },
    // ── Price ───
    priceSection: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.surface,
    },
    price: {
        fontSize: 34,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        letterSpacing: -0.5,
    },
    changeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    changeText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    periodBadge: {
        backgroundColor: Colors.surfaceLight,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 4,
    },
    periodBadgeText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
        color: Colors.textSecondary,
    },
    // ── Chart ───
    chartContainer: {
        backgroundColor: Colors.surface,
        paddingBottom: Spacing.sm,
        paddingTop: 40, // Space for tooltip
        position: 'relative',
    },
    crosshairLine: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: '#CCCCCC',
    },
    crosshairDot: {
        position: 'absolute',
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 3,
        marginLeft: -8, // Centers the 16px dot horizontally
        marginTop: -8,  // Centers the 16px dot vertically on the Y coordinate
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    tooltipContainer: {
        position: 'absolute',
        top: 0,
        minWidth: 170,
    },
    tooltipText: {
        fontSize: FontSize.xs,
        color: '#555555',
        fontWeight: FontWeight.medium,
        backgroundColor: 'transparent',
    },
    // ── Period Selector ───
    periodSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    periodTabs: {
        flex: 1,
        flexDirection: 'row',
        gap: 2,
    },
    periodTab: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: BorderRadius.full,
    },
    periodTabActive: {
        backgroundColor: Colors.surfaceLight,
    },
    periodTabText: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        fontWeight: FontWeight.medium,
    },
    periodTabTextActive: {
        color: Colors.textPrimary,
        fontWeight: FontWeight.bold,
    },
    terminalBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.surfaceLight,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    terminalBtnActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    terminalBtnText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
        color: Colors.textSecondary,
    },
    terminalBtnTextActive: {
        color: Colors.white,
    },
    // ── Stock Info ───
    infoSection: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.sm,
    },
    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    infoCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    infoItem: {
        width: '50%',
        paddingVertical: Spacing.sm,
    },
    infoItemLabel: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    infoItemValue: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },
    infoDivider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: Spacing.sm,
    },
    // ── Indicators ───
    indicatorCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    indicatorHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    indicatorTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },
    indicatorValue: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
    },
    rsiGaugeBg: {
        height: 8,
        backgroundColor: Colors.surfaceLight,
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
    },
    rsiGaugeFill: {
        height: '100%',
        borderRadius: BorderRadius.full,
    },
    rsiLabelsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    rsiLabel: {
        fontSize: FontSize.xs - 1,
        color: Colors.textTertiary,
    },
    rsiZoneLabel: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
    },
    // MACD
    signalPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    signalPillText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
    },
    macdRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    macdItem: {
        flex: 1,
    },
    macdLabel: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    macdValue: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },
    // Moving Averages
    maRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    maBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
    },
    maBadgeText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
    },
    maBarContainer: {
        flexDirection: 'row',
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    maBarSegment: {
        height: '100%',
    },
    // ── Action Buttons ───
    actionTab: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: Spacing.lg,
        paddingBottom: Platform.OS === 'web' ? Spacing.lg : Spacing.xxl + 10,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        gap: Spacing.md,
    },
    actionBtn: {
        flex: 1,
        height: 50,
        borderRadius: BorderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 6,
    },
    watchlistBtn: {
        backgroundColor: Colors.surface,
        borderWidth: 1.5,
        borderColor: Colors.primary,
    },
    watchlistedBtn: {
        backgroundColor: Colors.primary,
    },
    portfolioBtn: {
        backgroundColor: Colors.primary,
    },
    actionBtnText: {
        color: Colors.white,
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        letterSpacing: 1,
    },
    disclaimerContainer: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
        marginBottom: Spacing.xxl,
        padding: Spacing.md,
        backgroundColor: Colors.tipBackground,
        borderRadius: BorderRadius.md,
        borderLeftWidth: 3,
        borderLeftColor: Colors.tipIcon,
    },
    disclaimerText: {
        fontSize: FontSize.xs,
        color: Colors.tipText,
        lineHeight: 16,
    },
    askSection: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.sm,
        marginBottom: Spacing.xl,
        padding: Spacing.md,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    askTitle: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
    },
    askInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    askInput: {
        flex: 1,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        fontSize: FontSize.md,
        color: Colors.textPrimary,
    },
    askSubmitBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    askSubmitText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: BorderRadius.lg,
        borderTopRightRadius: BorderRadius.lg,
        maxHeight: '80%',
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    modalTitle: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    modalBody: {
        padding: Spacing.lg,
    },
    modalAnswer: {
        fontSize: FontSize.md,
        color: Colors.textPrimary,
        lineHeight: 24,
    },
});
