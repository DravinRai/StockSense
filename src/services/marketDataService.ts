import { StockQuote } from '../types';
import { cleanTicker, safeNumber } from '../utils/formatters';
import { formatSymbol } from '../api/stockService';
import { mockStocks, mockTopGainers, mockTopLosers } from '../data/mockData';

const NSE_STOCKS = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
    'HINDUNILVR', 'SBIN', 'BHARTIARTL', 'BAJFINANCE', 'KOTAKBANK',
    'ADANIPOWER', 'ADANIENT', 'WIPRO', 'AXISBANK', 'MARUTI',
    'SUNPHARMA', 'TATAMOTORS', 'TATASTEEL', 'NTPC', 'POWERGRID',
    'ULTRACEMCO', 'TECHM', 'HCLTECH', 'ONGC', 'COALINDIA',
    'BAJAJFINSV', 'TITAN', 'NESTLEIND', 'DIVISLAB', 'DRREDDY'
];

const YAHOO_FINANCE_QUOTE_URL = 'https://query1.finance.yahoo.com/v8/finance/quote';
const YAHOO_FINANCE_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/';

export interface MarketMovers {
    gainers: StockQuote[];
    losers: StockQuote[];
    volumeShockers: StockQuote[];
    mostTraded: StockQuote[];
}

/**
 * Fetch live data for all hardcoded NSE stocks in ONE batch call
 */
export const fetchMarketData = async (): Promise<MarketMovers> => {
    try {
        const symbols = NSE_STOCKS.map(s => `${s}.NS`).join(',');
        const url = `${YAHOO_FINANCE_QUOTE_URL}?symbols=${symbols}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (!data?.quoteResponse?.result) {
            throw new Error('Invalid API response');
        }

        const quotes: StockQuote[] = data.quoteResponse.result.map((q: any) => ({
            symbol: q.symbol.replace('.NS', ''),
            name: q.shortName || q.longName || q.symbol.replace('.NS', ''),
            exchange: 'NSE',
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
            sector: 'Stock'
        }));

        // Gainers: sort by regularMarketChangePercent descending, top 10
        const gainers = [...quotes]
            .sort((a, b) => b.changePercent - a.changePercent)
            .slice(0, 10);

        // Losers: sort by regularMarketChangePercent ascending, top 10
        const losers = [...quotes]
            .sort((a, b) => a.changePercent - b.changePercent)
            .slice(0, 10);

        // Volume Shockers / Most Traded: sort by regularMarketVolume descending, top 10
        const volumeSorted = [...quotes]
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 10);

        return {
            gainers,
            losers,
            volumeShockers: volumeSorted,
            mostTraded: volumeSorted
        };
    } catch (error) {
        console.error('Error in marketDataService.fetchMarketData:', error);
        // Fallback to mock data on error (e.g., CORS)
        const volumeSorted = [...mockStocks]
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 10);
            
        return {
            gainers: mockTopGainers.slice(0, 10),
            losers: mockTopLosers.slice(0, 10),
            volumeShockers: volumeSorted,
            mostTraded: volumeSorted
        };
    }
};

/**
 * Fetch 1D chart data for a list of symbols to show sparklines
 * Limited to top symbols to avoid overhead
 */
export const fetchBatchSparklines = async (symbols: string[]): Promise<Record<string, number[]>> => {
    const results: Record<string, number[]> = {};
    
    // We only fetch for the requested top symbols
    const promises = symbols.map(async (symbol) => {
        try {
            const ticker = formatSymbol(symbol);
            const url = `${YAHOO_FINANCE_CHART_URL}${ticker}?interval=15m&range=1d`;
            const res = await fetch(url);
            const data = await res.json();
            
            if (data?.chart?.result?.[0]) {
                const result = data.chart.result[0];
                const closePrices = result.indicators.quote[0].close || [];
                // Filter nulls and downsample to ~20 points
                const validPrices = closePrices.filter((p: any) => p !== null && p !== undefined);
                if (validPrices.length > 20) {
                    const step = Math.floor(validPrices.length / 20);
                    results[symbol] = validPrices.filter((_: any, i: number) => i % step === 0).slice(0, 20);
                } else {
                    results[symbol] = validPrices;
                }
            } else {
                results[symbol] = [];
            }
        } catch (e) {
            results[symbol] = [];
        }
    });

    await Promise.all(promises);
    return results;
};
