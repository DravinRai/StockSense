import { StockQuote, TimePeriod, IndexData, CandleData, TechnicalIndicators, FundamentalData, NewsItem, FIIDIIData } from '../types';
import { mockIndices, mockTopGainers, mockTopLosers, mockStocks, mockNews, mockCandleData, mockFIIDII } from '../data/mockData';
import { safeNumber, cleanTicker } from '../utils/formatters';
import * as stockService from './stockService';

const YAHOO_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
};

export interface SectorData {
    name: string;
    change: number;
    changePercent: number;
    icon: string;
    gainers: number;
    losers: number;
}

// Simulated delay for local development
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const NEWS_API_KEY = process.env.EXPO_PUBLIC_NEWS_API_KEY || 'demo';

// Fetch market news from NewsAPI
export const getLatestNews = async (): Promise<NewsItem[]> => {
    try {
        const url = `https://newsapi.org/v2/top-headlines?country=in&category=business&apiKey=${NEWS_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status !== 'ok') {
            throw new Error(data.message || 'Error fetching news');
        }

        const uniqueArticles = data.articles.filter((article: any, index: number, self: any[]) =>
            article.title && article.url && index === self.findIndex((a) => a.url === article.url)
        );

        return uniqueArticles.map((article: any, index: number) => {
            const lowerTitle = (article.title || '').toLowerCase();
            let sentiment: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
            if (lowerTitle.includes('surge') || lowerTitle.includes('jump') || lowerTitle.includes('gain') || lowerTitle.includes('up')) {
                sentiment = 'Bullish';
            } else if (lowerTitle.includes('fall') || lowerTitle.includes('drop') || lowerTitle.includes('loss') || lowerTitle.includes('down')) {
                sentiment = 'Bearish';
            }

            return {
                id: `live_${index}`,
                headline: article.title,
                description: article.description || article.content || '',
                source: article.source.name || 'NewsAPI',
                url: article.url,
                imageUrl: article.urlToImage || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800', 
                publishedAt: article.publishedAt,
                sector: 'General',
                sentiment: sentiment,
                relatedSymbols: []
                };
            });
    } catch (error) {
        console.log('Error fetching live news:', error);
        return mockNews;
    }
};

// Top Gainers and Losers today
export const getTopGainersLosers = async () => {
    const topSymbols = [
        'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'SBIN',
        'TATAMOTORS', 'TATASTEEL', 'ITC', 'ICICIBANK', 'BHARTIARTL',
        'AXISBANK', 'WIPRO', 'ADANIENT', 'KOTAKBANK', 'HINDUNILVR'
    ];
    try {
        const quotes = await getQuotes(topSymbols);
        const sorted = [...quotes].sort((a, b) => b.changePercent - a.changePercent);
        
        return {
            gainers: sorted.filter(q => q.changePercent > 0).slice(0, 5),
            losers: [...sorted].reverse().filter(q => q.changePercent < 0).slice(0, 5)
        };
    } catch (error) {
        console.log('Error fetching top movers:', error);
        return { gainers: mockTopGainers, losers: mockTopLosers };
    }
};

export const getIndices = async (): Promise<IndexData[]> => {
    try {
        const indexMap: Record<string, string> = {
            '^NSEI': 'NIFTY 50',
            '^BSESN': 'SENSEX',
            '^NSEBANK': 'BANKNIFTY',
            'NIFTY_MID_SELECT.NS': 'MIDCPNIFTY',
            'NIFTY_FIN_SERVICE.NS': 'FINNIFTY',
        };
        const symbols = Object.keys(indexMap);
        const promises = symbols.map(symbol =>
            fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=5m`, { headers: YAHOO_HEADERS })
                .then(res => res.json())
        );

        const results = await Promise.all(promises);

        return results.map((data, index) => {
            const symbol = symbols[index];
            if (!data.chart.result) {
                return {
                    name: indexMap[symbol],
                    value: 0,
                    change: 0,
                    changePercent: 0,
                    sparkline: [0]
                };
            }

            const chartArea = data.chart.result[0];
            const meta = chartArea.meta;
            const indicators = chartArea.indicators.quote[0];
            const closes = indicators.close?.filter((c: number | null) => c !== null) as number[] || [];
            const sparkline = closes.length > 20 ? closes.slice(-20) : closes.length > 0 ? closes : [0];

            const currentPrice = safeNumber(meta.regularMarketPrice, 0);
            const previousClose = safeNumber(meta.previousClose, currentPrice);
            const change = previousClose > 0 ? currentPrice - previousClose : 0;
            const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

            return {
                name: indexMap[symbol],
                value: currentPrice,
                change: change,
                changePercent: changePercent,
                sparkline: sparkline
            };
        });
    } catch (error) {
        return mockIndices;
    }
};

export const getQuotes = async (symbols: string[]): Promise<StockQuote[]> => {
    try {
        if (!symbols.length) return [];
        
        const formattedSymbols = symbols.map(s => stockService.formatSymbol(s)).join(',');
        const url = `https://query1.finance.yahoo.com/v8/finance/quote?symbols=${formattedSymbols}`;
        const res = await fetch(url, { headers: YAHOO_HEADERS });
        const data = await res.json();

        if (data?.quoteResponse?.result) {
            return data.quoteResponse.result.map((q: any) => {
                const originalSymbol = symbols.find(s => 
                    stockService.formatSymbol(s) === q.symbol
                ) || q.symbol.replace('.NS', '').replace('.BO', '');
                
                const mockFallback = mockStocks.find(s => cleanTicker(s.symbol) === cleanTicker(originalSymbol));
                
                return {
                    symbol: originalSymbol,
                    name: q.longName || q.shortName || mockFallback?.name || originalSymbol,
                    exchange: q.symbol.endsWith('.BO') ? 'BSE' : 'NSE',
                    ltp: safeNumber(q.regularMarketPrice, 0),
                    change: safeNumber(q.regularMarketChange, 0),
                    changePercent: safeNumber(q.regularMarketChangePercent, 0),
                    open: safeNumber(q.regularMarketOpen, 0),
                    high: safeNumber(q.regularMarketDayHigh, 0),
                    low: safeNumber(q.regularMarketDayLow, 0),
                    close: safeNumber(q.regularMarketPreviousClose, 0),
                    volume: safeNumber(q.regularMarketVolume, 0),
                    marketCap: safeNumber(q.marketCap, 0),
                    week52High: safeNumber(q.fiftyTwoWeekHigh, 0),
                    week52Low: safeNumber(q.fiftyTwoWeekLow, 0),
                    sector: mockFallback?.sector || 'Unknown'
                } as StockQuote;
            });
        }
        // Fallback to mock data if response is empty
        return symbols.map(s => mockStocks.find(ms => cleanTicker(ms.symbol) === cleanTicker(s))).filter(Boolean) as StockQuote[];
    } catch (error) {
        console.error('Error fetching quotes:', error);
        // Fallback to mock data on error (e.g., CORS)
        return symbols.map(s => mockStocks.find(ms => cleanTicker(ms.symbol) === cleanTicker(s))).filter(Boolean) as StockQuote[];
    }
};

export const getStockChart = async (symbol: string, period: TimePeriod): Promise<CandleData[]> => {
    try {
        const data = await stockService.fetchChartData(symbol, period);
        if (data && data.length > 0) return data;
        throw new Error('No data');
    } catch (error) {
        const ticker = cleanTicker(symbol);
        return mockCandleData[ticker] || mockCandleData['RELIANCE'];
    }
};

export const searchStocks = async (query: string): Promise<StockQuote[]> => {
    return await stockService.searchStocks(query);
};

export const getSectorPerformance = async (): Promise<SectorData[]> => {
    try {
        const sectorMap: Record<string, { name: string; icon: string }> = {
            '^CNXIT': { name: 'IT', icon: 'laptop-outline' },
            '^NSEBANK': { name: 'Banking', icon: 'business-outline' },
            'NIFTYPHARMA.NS': { name: 'Pharma', icon: 'medkit-outline' },
            'NIFTYAUTO.NS': { name: 'Auto', icon: 'car-outline' },
            'NIFTYFMCG.NS': { name: 'FMCG', icon: 'cart-outline' },
            'NIFTYENERGY.NS': { name: 'Energy', icon: 'flash-outline' },
            'NIFTYMETAL.NS': { name: 'Metals', icon: 'construct-outline' },
        };
        const symbols = Object.keys(sectorMap);
        const promises = symbols.map(symbol =>
            fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`, { headers: YAHOO_HEADERS })
                .then(res => res.json())
                .catch(() => null)
        );

        const results = await Promise.all(promises);

        return results.map((data, index) => {
            const info = sectorMap[symbols[index]];
            if (!data?.chart?.result?.[0]) {
                return { name: info.name, change: 0, changePercent: 0, icon: info.icon, gainers: 3, losers: 2 };
            }
            const meta = data.chart.result[0].meta;
            const currentPrice = safeNumber(meta.regularMarketPrice, 0);
            const previousClose = safeNumber(meta.previousClose, currentPrice);
            const change = previousClose > 0 ? currentPrice - previousClose : 0;
            const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
            return {
                name: info.name,
                change,
                changePercent,
                icon: info.icon,
                gainers: changePercent >= 0 ? 7 : 3,
                losers: changePercent >= 0 ? 3 : 7,
            };
        });
    } catch (error) {
        return [
            { name: 'IT', icon: 'laptop-outline', change: 124.5, changePercent: 1.25, gainers: 7, losers: 3 },
            { name: 'Banking', icon: 'business-outline', change: -86.2, changePercent: -0.45, gainers: 3, losers: 7 },
            { name: 'Pharma', icon: 'medkit-outline', change: 45.8, changePercent: 0.85, gainers: 6, losers: 4 },
            { name: 'Auto', icon: 'car-outline', change: 212.4, changePercent: 2.15, gainers: 8, losers: 2 },
        ];
    }
};

export const getMostTraded = async (): Promise<StockQuote[]> => {
    const symbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'SBIN', 'IRFC', 'SJVN'];
    return await getQuotes(symbols);
};

export const getStockSparkline = async (symbol: string): Promise<number[]> => {
    try {
        const data = await stockService.fetchChartData(symbol, '1D');
        const closes = data.map(d => d.close);
        if (closes.length > 20) {
            const step = Math.floor(closes.length / 20);
            return closes.filter((_, i) => i % step === 0).slice(0, 20);
        }
        return closes;
    } catch (error) {
        return [0, 0, 0];
    }
};

export const getBatchSparklines = async (symbols: string[]): Promise<Record<string, number[]>> => {
    const results: Record<string, number[]> = {};
    const promises = symbols.map(async (symbol) => {
        results[symbol] = await getStockSparkline(symbol);
    });
    await Promise.all(promises);
    return results;
};

export const fetchChartData = async (symbol: string, timeframe: string) => {
    const ticker = stockService.formatSymbol(symbol);

    let interval = '1d';
    let range = '1y';

    switch (timeframe) {
        case '1D': interval = '5m'; range = '1d'; break;
        case '1W': interval = '1h'; range = '5d'; break;
        case '1M': interval = '1d'; range = '1mo'; break;
        case '3M': interval = '1d'; range = '3mo'; break;
        case '6M': interval = '1d'; range = '6mo'; break;
        case '1Y': interval = '1d'; range = '1y'; break;
        case '3Y': interval = '1wk'; range = '3y'; break;
        case '5Y': interval = '1wk'; range = '5y'; break;
        case 'All': interval = '1mo'; range = 'max'; break;
        default: interval = '1d'; range = '1y';
    }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${interval}&range=${range}`;
    const res = await fetch(url, { headers: YAHOO_HEADERS });
    const data = await res.json();

    if (!data?.chart?.result?.[0]) {
        throw new Error('No chart data available');
    }

    const result = data.chart.result[0];
    const timestamps = result.timestamp || [];
    const quote = result.indicators.quote[0];
    const closes = quote.close || [];

    const chartData = timestamps.map((ts: number, i: number) => ({
        x: i,
        y: closes[i],
        timestamp: new Date(ts * 1000).toISOString(),
        close: closes[i],
        open: quote.open ? quote.open[i] : closes[i],
        high: quote.high ? quote.high[i] : closes[i],
        low: quote.low ? quote.low[i] : closes[i],
        volume: quote.volume ? quote.volume[i] : 0,
    })).filter((d: any) => d.y !== null && d.y !== undefined);

    // Get meta data for current price
    const currentPrice = result.meta?.regularMarketPrice
        ?? closes[closes.length - 1];

    // Get first VALID price (not null/zero)
    const firstValidPrice = closes.find(
        (c: number) => c !== null && c !== undefined && c > 0
    );

    const lastValidPrice = currentPrice;

    const priceChange = lastValidPrice - firstValidPrice;
    const percentChange = (priceChange / firstValidPrice) * 100;

    // Sanity check — if % seems unrealistic, log warning
    if (Math.abs(percentChange) > 50 && timeframe !== 'All') {
        console.warn(`Suspicious % change: ${percentChange}% for ${timeframe}. First: ${firstValidPrice}, Last: ${lastValidPrice}`);
    }

    console.log('Timeframe:', timeframe);
    console.log('First price:', firstValidPrice);
    console.log('Last price:', lastValidPrice);
    console.log('% change:', percentChange);

    return {
        chartData,
        firstPrice: firstValidPrice,
        lastPrice: lastValidPrice,
        priceChange: parseFloat(priceChange.toFixed(2)),
        percentChange: parseFloat(percentChange.toFixed(2)),
        timeframe,
        meta: {
            currency: result.meta?.currency ?? 'INR',
            symbol: result.meta?.symbol,
            regularMarketPrice: result.meta?.regularMarketPrice,
            previousClose: result.meta?.previousClose,
            chartPreviousClose: result.meta?.chartPreviousClose,
        }
    };
};

export const getFIIDIIData = async (): Promise<{ data: FIIDIIData[]; isLive: boolean }> => {
    // NSE FII/DII API — requires browser cookies/session, will fail from a native app.
    // We attempt the call and gracefully fall back to mock data.
    try {
        const headers = {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Referer': 'https://www.nseindia.com',
        };
        const res = await fetch('https://www.nseindia.com/api/fiidiiTradeReact', { headers });
        if (!res.ok) throw new Error(`NSE FII/DII: ${res.status}`);
        const json = await res.json();

        const rows = json?.data ?? [];
        if (!rows.length) throw new Error('Empty FII/DII response');

        const parsed: FIIDIIData[] = rows.slice(0, 5).map((row: any) => ({
            date: row.date ?? '',
            fiiBuy: safeNumber(row.fii_buy_value, 0),
            fiiSell: safeNumber(row.fii_sell_value, 0),
            fiiNet: safeNumber(row.fii_net_value, 0),
            diiBuy: safeNumber(row.dii_buy_value, 0),
            diiSell: safeNumber(row.dii_sell_value, 0),
            diiNet: safeNumber(row.dii_net_value, 0),
        }));
        return { data: parsed, isLive: true };
    } catch {
        return { data: mockFIIDII, isLive: false };
    }
};
