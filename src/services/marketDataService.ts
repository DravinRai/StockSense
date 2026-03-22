import { StockQuote } from '../types';
import { safeNumber } from '../utils/formatters';
import { formatSymbol } from '../api/stockService';
import { mockStocks, mockTopGainers, mockTopLosers } from '../data/mockData';
import { API_ENDPOINTS, REQUEST_TIMEOUT } from '../config/apiConfig';
import { sanitizeSymbol } from '../utils/sanitize';

const secureFetch = async (url: string, options: any = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') throw new Error("Market data request timed out");
        throw error;
    }
};

export interface MarketMovers {
    gainers: StockQuote[];
    losers: StockQuote[];
    volumeShockers: StockQuote[];
    mostTraded: StockQuote[];
}

/**
 * Fetch live data for all hardcoded NSE stocks in ONE batch call via backend
 */
export const fetchMarketData = async (): Promise<MarketMovers> => {
    try {
        const symbols = [
            'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
            'HINDUNILVR', 'SBIN', 'BHARTIARTL', 'BAJFINANCE', 'KOTAKBANK',
            'ADANIPOWER', 'ADANIENT', 'WIPRO', 'AXISBANK', 'MARUTI',
            'SUNPHARMA', 'TATAMOTORS', 'TATASTEEL', 'NTPC', 'POWERGRID',
            'ULTRACEMCO', 'TECHM', 'HCLTECH', 'ONGC', 'COALINDIA',
            'BAJAJFINSV', 'TITAN', 'NESTLEIND', 'DIVISLAB', 'DRREDDY'
        ].map(s => `${s}.NS`).join(',');

        const url = `${API_ENDPOINTS.QUOTES}?symbols=${symbols}`;
        const response = await secureFetch(url);
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

        const gainers = [...quotes]
            .sort((a, b) => b.changePercent - a.changePercent)
            .slice(0, 10);

        const losers = [...quotes]
            .sort((a, b) => a.changePercent - b.changePercent)
            .slice(0, 10);

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
 * Fetch 1D chart data for a list of symbols to show sparklines via backend
 */
export const fetchBatchSparklines = async (symbols: string[]): Promise<Record<string, number[]>> => {
    const results: Record<string, number[]> = {};
    
    const promises = symbols.map(async (symbol) => {
        try {
            const ticker = sanitizeSymbol(formatSymbol(symbol));
            const url = `${API_ENDPOINTS.CHART(ticker)}?interval=15m&range=1d`;
            const res = await secureFetch(url);
            const data = await res.json();
            
            if (data?.chart?.result?.[0]) {
                const result = data.chart.result[0];
                const closePrices = result.indicators.quote[0].close || [];
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
