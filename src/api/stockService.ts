// src/api/stockService.ts
import { TimePeriod, CandleData, StockQuote } from '../types';
import { API_ENDPOINTS, REQUEST_TIMEOUT } from '../config/apiConfig';
import { sanitizeSymbol } from '../utils/sanitize';

/**
 * Ensures symbol has .NS suffix if no suffix is present
 */
export const formatSymbol = (symbol: string) => {
    if (!symbol) return '';
    const upperSymbol = symbol.toUpperCase();
    if (upperSymbol.endsWith('.NS') || upperSymbol.endsWith('.BO')) {
        return upperSymbol;
    }
    return `${upperSymbol}.NS`;
};

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
        if (error.name === 'AbortError') throw new Error("Request timed out");
        throw error;
    }
};

export const fetchChartData = async (symbol: string, period: TimePeriod): Promise<CandleData[]> => {
    const ticker = sanitizeSymbol(formatSymbol(symbol));
    
    const fetchData = async (s: string): Promise<CandleData[]> => {
        try {
            let interval = '1d';
            let range = '1y';

            switch (period) {
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

            const url = `${API_ENDPOINTS.CHART(s)}?interval=${interval}&range=${range}`;
            const res = await secureFetch(url);
            const data = await res.json();

            if (data?.chart?.result?.[0]) {
                const result = data.chart.result[0];
                const timestamps = result.timestamp || [];
                const closePrices = result.indicators.quote[0].close || [];

                return timestamps.map((ts: number, i: number) => ({
                    x: i,
                    y: closePrices[i],
                    timestamp: new Date(ts * 1000).toISOString(),
                    close: closePrices[i],
                    open: result.indicators.quote[0].open ? result.indicators.quote[0].open[i] : closePrices[i],
                    high: result.indicators.quote[0].high ? result.indicators.quote[0].high[i] : closePrices[i],
                    low: result.indicators.quote[0].low ? result.indicators.quote[0].low[i] : closePrices[i],
                    volume: result.indicators.quote[0].volume ? result.indicators.quote[0].volume[i] : 0
                })).filter((d: any) => d.y !== null && d.y !== undefined);
            }
            return [];
        } catch (error) {
            console.error(`Error fetching chart data for ${s}:`, error);
            return [];
        }
    };

    let results = await fetchData(ticker);
    if (results.length === 0 && ticker.endsWith('.NS') && !symbol.toUpperCase().endsWith('.NS')) {
        const boTicker = ticker.replace('.NS', '.BO');
        results = await fetchData(boTicker);
    }
    return results;
};

export const fetchLivePrice = async (symbol: string): Promise<Partial<StockQuote> | null> => {
    const ticker = sanitizeSymbol(formatSymbol(symbol));

    const fetchData = async (s: string): Promise<Partial<StockQuote> | null> => {
        try {
            const url = API_ENDPOINTS.STOCK(s);
            const res = await secureFetch(url);
            const data = await res.json();

            if (data?.quoteResponse?.result?.[0]) {
                const quote = data.quoteResponse.result[0];
                return {
                    symbol: s.replace('.NS', '').replace('.BO', ''),
                    ltp: quote.regularMarketPrice,
                    change: quote.regularMarketChange,
                    changePercent: quote.regularMarketChangePercent,
                    open: quote.regularMarketOpen,
                    high: quote.regularMarketDayHigh,
                    low: quote.regularMarketDayLow,
                    close: quote.regularMarketPreviousClose,
                    volume: quote.regularMarketVolume,
                    marketCap: quote.marketCap,
                    week52High: quote.fiftyTwoWeekHigh,
                    week52Low: quote.fiftyTwoWeekLow,
                    name: quote.longName || quote.shortName || s.replace('.NS', '').replace('.BO', ''),
                    trailingPE: quote.trailingPE,
                    epsTrailingTwelveMonths: quote.epsTrailingTwelveMonths,
                    bookValue: quote.bookValue,
                    dividendYield: quote.dividendYield,
                };
            }
            return null;
        } catch (error) {
            console.error(`Error fetching live price for ${s}:`, error);
            return null;
        }
    };

    let result = await fetchData(ticker);
    if (!result && ticker.endsWith('.NS') && !symbol.toUpperCase().endsWith('.NS')) {
        const boTicker = ticker.replace('.NS', '.BO');
        result = await fetchData(boTicker);
    }
    return result;
};

export const searchStocks = async (query: string): Promise<StockQuote[]> => {
    if (!query || query.trim().length < 2) return [];

    try {
        const url = API_ENDPOINTS.SEARCH(query.trim());
        const res = await secureFetch(url);
        const data = await res.json();
        const quotes = data?.quotes ?? [];

        if (quotes.length === 0) return [];

        const filtered = quotes.filter((item: any) =>
            (item.quoteType === 'EQUITY' || item.typeDisp === 'Equity') &&
            (item.symbol?.endsWith('.NS') || item.symbol?.endsWith('.BO'))
        );

        const seen = new Set<string>();
        const results = filtered.map((item: any) => ({
            symbol: item.symbol.replace(/\.(NS|BO)$/, ''),
            name: (item.longname || item.shortname || item.symbol).replace(/\.(NS|BO)$/, ''),
            exchange: item.symbol.endsWith('.NS') ? 'NSE' : 'BSE',
            ltp: 0,
            change: 0,
            changePercent: 0,
            open: 0,
            high: 0,
            low: 0,
            close: 0,
            volume: 0,
            week52High: 0,
            week52Low: 0
        })).filter((item: any) => {
            if (seen.has(item.symbol)) return false;
            seen.add(item.symbol);
            return true;
        });

        return results;
    } catch (error) {
        console.error('Search error:', error);
        return [];
    }
};

export const fetchStockInfo = async (symbol: string): Promise<any> => {
    return fetchLivePrice(symbol);
};

