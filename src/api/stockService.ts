import { TimePeriod, CandleData, StockQuote } from '../types';
import { cleanTicker } from '../utils/formatters';
import { mockStocks } from '../data/mockData';

const BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/';
const BASE_SEARCH_URL = 'https://query1.finance.yahoo.com/v1/finance/search';

const YAHOO_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
};

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

export const fetchChartData = async (symbol: string, period: TimePeriod): Promise<CandleData[]> => {
    const ticker = formatSymbol(symbol);
    
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

            const url = `${BASE_URL}${s}?interval=${interval}&range=${range}`;
            const res = await fetch(url, { headers: YAHOO_HEADERS });
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
    
    // Fallback to .BO if .NS fails and it was auto-appended
    if (results.length === 0 && ticker.endsWith('.NS') && !symbol.toUpperCase().endsWith('.NS')) {
        const boTicker = ticker.replace('.NS', '.BO');
        results = await fetchData(boTicker);
    }
    
    return results;
};

export const fetchLivePrice = async (symbol: string): Promise<Partial<StockQuote> | null> => {
    const ticker = formatSymbol(symbol);

    const fetchData = async (s: string): Promise<Partial<StockQuote> | null> => {
        try {
            const url = `https://query1.finance.yahoo.com/v8/finance/quote?symbols=${s}`;
            const res = await fetch(url, { headers: YAHOO_HEADERS });
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

    // Fallback to .BO if .NS returns null and it was auto-appended
    if (!result && ticker.endsWith('.NS') && !symbol.toUpperCase().endsWith('.NS')) {
        const boTicker = ticker.replace('.NS', '.BO');
        result = await fetchData(boTicker);
    }

    return result;
};

export const searchStocks = async (query: string): Promise<StockQuote[]> => {
    if (!query || query.trim().length < 2) return [];

    const q = query.trim();

    try {
        const url = `${BASE_SEARCH_URL}?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`;
        const res = await fetch(url, { headers: YAHOO_HEADERS });
        const data = await res.json();
        const quotes = data?.quotes ?? [];

        if (quotes.length === 0) throw new Error('No results');

        // Filter equity only (.NS or .BO)
        const filtered = quotes.filter((item: any) =>
            item.quoteType === 'EQUITY' &&
            (item.symbol?.endsWith('.NS') || item.symbol?.endsWith('.BO'))
        );

        // Prefer .NS over .BO, deduplicate by base symbol
        const seen = new Set<string>();
        const nsResults = filtered.filter((item: any) => {
            const base = item.symbol.replace(/\.(NS|BO)$/, '');
            if (seen.has(base)) return false;
            seen.add(base);
            return item.symbol.endsWith('.NS');
        });

        // Fall back to .BO if no .NS results
        const results = nsResults.length > 0 ? nsResults :
            filtered.filter((item: any) => {
                const base = item.symbol.replace(/\.(NS|BO)$/, '');
                if (seen.has(base)) return false;
                seen.add(base);
                return item.symbol.endsWith('.BO');
            });

        return results.map((item: any) => ({
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
        }));
    } catch (error) {
        // Fallback to mock data if API is blocked (CORS)
        const lower = q.toLowerCase();
        return mockStocks
            .filter((s: StockQuote) =>
                s.symbol.toLowerCase().includes(lower) ||
                s.name.toLowerCase().includes(lower)
            )
            .map((s: StockQuote) => ({
                ...s,
                ltp: 0,
                change: 0,
                changePercent: 0
            }));
    }
};

export const fetchStockInfo = async (symbol: string): Promise<any> => {
    return fetchLivePrice(symbol);
};

