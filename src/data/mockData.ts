// Mock data for Indian stock market
// Realistic data for development — will be replaced with real API calls

import { StockQuote, IndexData, FIIDIIData, CandleData, TechnicalIndicators, FundamentalData, NewsItem, InsiderDeal, PatternResult, GlossaryTerm } from '../types';

// ──────────────────────────────────────────────────────────
// MARKET INDICES
// ──────────────────────────────────────────────────────────

export const mockIndices: IndexData[] = [
    {
        name: 'NIFTY 50',
        value: 22456.80,
        change: 187.45,
        changePercent: 0.84,
        sparkline: [22100, 22150, 22080, 22200, 22250, 22180, 22300, 22280, 22350, 22320, 22400, 22380, 22450, 22420, 22480, 22460, 22500, 22480, 22470, 22456],
    },
    {
        name: 'SENSEX',
        value: 73852.94,
        change: 612.21,
        changePercent: 0.84,
        sparkline: [73000, 73100, 72900, 73200, 73350, 73200, 73500, 73450, 73600, 73550, 73700, 73650, 73800, 73750, 73850, 73820, 73900, 73880, 73860, 73852],
    },
    {
        name: 'NIFTY BANK',
        value: 47892.35,
        change: -234.56,
        changePercent: -0.49,
        sparkline: [48200, 48150, 48100, 48050, 48100, 48000, 47950, 48000, 47900, 47950, 47850, 47900, 47800, 47850, 47750, 47800, 47850, 47880, 47900, 47892],
    },
];

// ──────────────────────────────────────────────────────────
// STOCK QUOTES — Top Indian Stocks
// ──────────────────────────────────────────────────────────

export const mockStocks: StockQuote[] = [
    {
        symbol: 'RELIANCE',
        name: 'Reliance Industries',
        exchange: 'NSE',
        ltp: 2456.75,
        change: 34.50,
        changePercent: 1.42,
        open: 2430.00,
        high: 2468.90,
        low: 2425.10,
        close: 2422.25,
        volume: 12500000,
        marketCap: 16620000000000,
        week52High: 2856.15,
        week52Low: 2220.30,
        sector: 'Energy',
    },
    {
        symbol: 'TCS',
        name: 'Tata Consultancy Services',
        exchange: 'NSE',
        ltp: 3892.40,
        change: -45.60,
        changePercent: -1.16,
        open: 3940.00,
        high: 3945.80,
        low: 3880.20,
        close: 3938.00,
        volume: 3200000,
        marketCap: 14200000000000,
        week52High: 4255.00,
        week52Low: 3311.05,
        sector: 'IT',
    },
    {
        symbol: 'HDFCBANK',
        name: 'HDFC Bank',
        exchange: 'NSE',
        ltp: 1652.30,
        change: 18.75,
        changePercent: 1.15,
        open: 1638.00,
        high: 1658.40,
        low: 1632.50,
        close: 1633.55,
        volume: 8900000,
        marketCap: 12580000000000,
        week52High: 1794.00,
        week52Low: 1363.55,
        sector: 'Banking',
    },
    {
        symbol: 'INFY',
        name: 'Infosys',
        exchange: 'NSE',
        ltp: 1523.85,
        change: -22.30,
        changePercent: -1.44,
        open: 1548.00,
        high: 1552.90,
        low: 1518.60,
        close: 1546.15,
        volume: 6700000,
        marketCap: 6320000000000,
        week52High: 1896.25,
        week52Low: 1358.35,
        sector: 'IT',
    },
    {
        symbol: 'ICICIBANK',
        name: 'ICICI Bank',
        exchange: 'NSE',
        ltp: 1089.45,
        change: 12.80,
        changePercent: 1.19,
        open: 1078.00,
        high: 1094.20,
        low: 1075.30,
        close: 1076.65,
        volume: 11200000,
        marketCap: 7640000000000,
        week52High: 1261.55,
        week52Low: 956.10,
        sector: 'Banking',
    },
    {
        symbol: 'BHARTIARTL',
        name: 'Bharti Airtel',
        exchange: 'NSE',
        ltp: 1178.90,
        change: 28.45,
        changePercent: 2.47,
        open: 1155.00,
        high: 1185.60,
        low: 1150.20,
        close: 1150.45,
        volume: 5400000,
        marketCap: 7020000000000,
        week52High: 1280.00,
        week52Low: 880.55,
        sector: 'IT',
    },
    {
        symbol: 'SBIN',
        name: 'State Bank of India',
        exchange: 'NSE',
        ltp: 756.20,
        change: -8.35,
        changePercent: -1.09,
        open: 765.00,
        high: 768.50,
        low: 752.10,
        close: 764.55,
        volume: 15600000,
        marketCap: 6750000000000,
        week52High: 912.00,
        week52Low: 600.20,
        sector: 'Banking',
    },
    {
        symbol: 'ITC',
        name: 'ITC Limited',
        exchange: 'NSE',
        ltp: 438.65,
        change: 5.20,
        changePercent: 1.20,
        open: 434.00,
        high: 440.80,
        low: 432.50,
        close: 433.45,
        volume: 18200000,
        marketCap: 5470000000000,
        week52High: 499.70,
        week52Low: 399.35,
        sector: 'FMCG',
    },
    {
        symbol: 'WIPRO',
        name: 'Wipro Limited',
        exchange: 'NSE',
        ltp: 462.30,
        change: -6.80,
        changePercent: -1.45,
        open: 470.00,
        high: 472.40,
        low: 459.50,
        close: 469.10,
        volume: 4800000,
        marketCap: 2420000000000,
        week52High: 572.65,
        week52Low: 390.40,
        sector: 'IT',
    },
    {
        symbol: 'TATAMOTORS',
        name: 'Tata Motors',
        exchange: 'NSE',
        ltp: 724.50,
        change: 15.80,
        changePercent: 2.23,
        open: 712.00,
        high: 728.90,
        low: 708.30,
        close: 708.70,
        volume: 22400000,
        marketCap: 2660000000000,
        week52High: 1025.00,
        week52Low: 610.85,
        sector: 'Auto',
    },
    {
        symbol: 'SUNPHARMA',
        name: 'Sun Pharmaceutical',
        exchange: 'NSE',
        ltp: 1245.60,
        change: 32.15,
        changePercent: 2.65,
        open: 1218.00,
        high: 1252.30,
        low: 1215.40,
        close: 1213.45,
        volume: 3800000,
        marketCap: 2990000000000,
        week52High: 1380.00,
        week52Low: 1020.50,
        sector: 'Pharma',
    },
    {
        symbol: 'MARUTI',
        name: 'Maruti Suzuki',
        exchange: 'NSE',
        ltp: 10856.40,
        change: -124.60,
        changePercent: -1.13,
        open: 10980.00,
        high: 11020.50,
        low: 10830.00,
        close: 10981.00,
        volume: 850000,
        marketCap: 3400000000000,
        week52High: 13680.00,
        week52Low: 9828.55,
        sector: 'Auto',
    },
    {
        symbol: 'DRREDDY',
        name: "Dr. Reddy's Laboratories",
        exchange: 'NSE',
        ltp: 5678.90,
        change: 89.30,
        changePercent: 1.60,
        open: 5600.00,
        high: 5695.40,
        low: 5585.20,
        close: 5589.60,
        volume: 920000,
        marketCap: 946000000000,
        week52High: 6350.00,
        week52Low: 5100.00,
        sector: 'Pharma',
    },
    {
        symbol: 'HINDUNILVR',
        name: 'Hindustan Unilever',
        exchange: 'NSE',
        ltp: 2345.20,
        change: -15.40,
        changePercent: -0.65,
        open: 2362.00,
        high: 2368.50,
        low: 2338.80,
        close: 2360.60,
        volume: 2100000,
        marketCap: 5510000000000,
        week52High: 2769.65,
        week52Low: 2172.05,
        sector: 'FMCG',
    },
    {
        symbol: 'TATASTEEL',
        name: 'Tata Steel',
        exchange: 'NSE',
        ltp: 142.85,
        change: 3.45,
        changePercent: 2.47,
        open: 140.00,
        high: 144.20,
        low: 139.30,
        close: 139.40,
        volume: 45200000,
        marketCap: 1740000000000,
        week52High: 184.60,
        week52Low: 118.35,
        sector: 'Metal',
    },
];

// ──────────────────────────────────────────────────────────
// TOP GAINERS & LOSERS
// ──────────────────────────────────────────────────────────

export const mockTopGainers: StockQuote[] = mockStocks
    .filter(s => s.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 5);

export const mockTopLosers: StockQuote[] = mockStocks
    .filter(s => s.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 5);

// ──────────────────────────────────────────────────────────
// FII / DII DATA
// ──────────────────────────────────────────────────────────

export const mockFIIDII: FIIDIIData[] = [
    { date: '2026-03-09', fiiBuy: 12450, fiiSell: 11200, fiiNet: 1250, diiBuy: 9800, diiSell: 8500, diiNet: 1300 },
    { date: '2026-03-08', fiiBuy: 10800, fiiSell: 13200, fiiNet: -2400, diiBuy: 11500, diiSell: 9200, diiNet: 2300 },
    { date: '2026-03-07', fiiBuy: 14200, fiiSell: 12800, fiiNet: 1400, diiBuy: 8900, diiSell: 10100, diiNet: -1200 },
    { date: '2026-03-06', fiiBuy: 11600, fiiSell: 14500, fiiNet: -2900, diiBuy: 12200, diiSell: 9800, diiNet: 2400 },
    { date: '2026-03-05', fiiBuy: 13800, fiiSell: 12100, fiiNet: 1700, diiBuy: 10400, diiSell: 11200, diiNet: -800 },
];

// ──────────────────────────────────────────────────────────
// CANDLESTICK / CHART DATA (for Reliance)
// ──────────────────────────────────────────────────────────

function generateCandleData(basePrice: number, days: number): CandleData[] {
    const data: CandleData[] = [];
    let price = basePrice;
    const now = Date.now();

    for (let i = days; i >= 0; i--) {
        const volatility = price * 0.02;
        const change = (Math.random() - 0.48) * volatility;
        const open = price;
        const close = price + change;
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;
        const volume = Math.floor(5000000 + Math.random() * 20000000);

        data.push({
            timestamp: now - i * 86400000,
            open: Math.round(open * 100) / 100,
            high: Math.round(high * 100) / 100,
            low: Math.round(low * 100) / 100,
            close: Math.round(close * 100) / 100,
            volume,
        });

        price = close;
    }
    return data;
}

export const mockCandleData: Record<string, CandleData[]> = {
    RELIANCE: generateCandleData(2400, 1000),
    TCS: generateCandleData(3850, 1000),
    HDFCBANK: generateCandleData(1620, 1000),
    INFY: generateCandleData(1500, 1000),
    ICICIBANK: generateCandleData(1060, 1000),
    SBIN: generateCandleData(740, 1000),
    TATAMOTORS: generateCandleData(700, 1000),
    ITC: generateCandleData(430, 1000),
};

// ──────────────────────────────────────────────────────────
// TECHNICAL INDICATORS (for Reliance)
// ──────────────────────────────────────────────────────────

export const mockTechnicalIndicators: Record<string, TechnicalIndicators> = {
    RELIANCE: {
        rsi: 62.4,
        macd: { macdLine: 12.5, signalLine: 8.3, histogram: 4.2 },
        bollingerBands: { upper: 2520.00, middle: 2456.75, lower: 2393.50 },
        support: [2380, 2320, 2280],
        resistance: [2500, 2560, 2620],
    },
    TCS: {
        rsi: 38.7,
        macd: { macdLine: -8.2, signalLine: -3.1, histogram: -5.1 },
        bollingerBands: { upper: 4020.00, middle: 3892.40, lower: 3764.80 },
        support: [3800, 3720, 3650],
        resistance: [3950, 4050, 4150],
    },
    HDFCBANK: {
        rsi: 55.8,
        macd: { macdLine: 5.6, signalLine: 3.2, histogram: 2.4 },
        bollingerBands: { upper: 1720.00, middle: 1652.30, lower: 1584.60 },
        support: [1600, 1560, 1520],
        resistance: [1700, 1750, 1800],
    },
    INFY: {
        rsi: 34.2,
        macd: { macdLine: -11.4, signalLine: -6.8, histogram: -4.6 },
        bollingerBands: { upper: 1620.00, middle: 1523.85, lower: 1427.70 },
        support: [1480, 1420, 1380],
        resistance: [1560, 1620, 1680],
    },
};

// ──────────────────────────────────────────────────────────
// FUNDAMENTALS
// ──────────────────────────────────────────────────────────

export const mockFundamentals: Record<string, FundamentalData> = {
    RELIANCE: {
        pe: 28.5, eps: 86.2, bookValue: 1125.4, dividendYield: 0.4,
        marketCap: 16620000000000, promoterHolding: 50.3, fiiHolding: 20.1, diiHolding: 15.2, publicHolding: 14.4, pledgedPercent: 0,
        debtToEquity: 0.38, roe: 9.2,
    },
    TCS: {
        pe: 31.2, eps: 124.8, bookValue: 286.5, dividendYield: 1.2,
        marketCap: 14200000000000, promoterHolding: 72.3, fiiHolding: 12.8, diiHolding: 8.4, publicHolding: 6.5, pledgedPercent: 0,
        debtToEquity: 0.05, roe: 48.6,
    },
    HDFCBANK: {
        pe: 19.8, eps: 83.5, bookValue: 515.2, dividendYield: 1.1,
        marketCap: 12580000000000, promoterHolding: 26.1, fiiHolding: 33.2, diiHolding: 22.1, publicHolding: 18.6, pledgedPercent: 0,
        debtToEquity: 6.8, roe: 16.4,
    },
    INFY: {
        pe: 24.6, eps: 61.9, bookValue: 198.4, dividendYield: 2.4,
        marketCap: 6320000000000, promoterHolding: 14.8, fiiHolding: 34.5, diiHolding: 28.2, publicHolding: 22.5, pledgedPercent: 0,
        debtToEquity: 0.08, roe: 32.1,
    },
};

// ──────────────────────────────────────────────────────────
// NEWS FEED
// ──────────────────────────────────────────────────────────

export const mockNews: NewsItem[] = [
    {
        id: '1', headline: 'Reliance Jio launches 5G in 50 more cities, stock rallies',
        description: 'Reliance Industries shares surged 2% after Jio announced expansion of its 5G services to 50 additional cities across India.',
        source: 'Economic Times', url: '#', imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800', publishedAt: '2026-03-09T14:30:00Z',
        sector: 'IT', sentiment: 'Bullish', relatedSymbols: ['RELIANCE']
    },
    {
        id: '2', headline: 'HDFC Bank Q3 results beat estimates, NII grows 24%',
        description: 'HDFC Bank reported strong Q3 results with net interest income growing 24% YoY, beating analyst estimates by a wide margin.',
        source: 'Moneycontrol', url: '#', imageUrl: 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=800', publishedAt: '2026-03-09T12:00:00Z',
        sector: 'Banking', sentiment: 'Bullish', relatedSymbols: ['HDFCBANK', 'NIFTY BANK']
    },
    {
        id: '3', headline: 'IT sector faces headwinds as US recession fears mount',
        description: 'Indian IT stocks came under pressure as growing fears of a US recession raised concerns about demand outlook for the sector.',
        source: 'LiveMint', url: '#', imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800', publishedAt: '2026-03-09T10:15:00Z',
        sector: 'IT', sentiment: 'Bearish', relatedSymbols: ['TCS', 'INFY', 'WIPRO']
    },
    {
        id: '4', headline: 'Sun Pharma gets USFDA approval for new drug',
        description: 'Sun Pharmaceutical Industries received approval from the US FDA for its new generic drug, expected to add ₹500 Cr in annual revenue.',
        source: 'Business Standard', url: '#', imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800', publishedAt: '2026-03-09T08:00:00Z',
        sector: 'Pharma', sentiment: 'Bullish', relatedSymbols: ['SUNPHARMA']
    },
    {
        id: '5', headline: 'Auto sales data: Mixed bag for February 2026',
        description: 'February auto sales showed mixed trends with passenger vehicles growing 8% while commercial vehicles declined 3% YoY.',
        source: 'NDTV Profit', url: '#', imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800', publishedAt: '2026-03-08T16:30:00Z',
        sector: 'Auto', sentiment: 'Neutral', relatedSymbols: ['TATAMOTORS', 'MARUTI']
    },
    {
        id: '6', headline: 'RBI keeps repo rate unchanged at 6.5%, markets cheer',
        description: 'The Reserve Bank of India maintained its key lending rate at 6.5%, in line with expectations. Banking stocks rallied on dovish commentary.',
        source: 'Reuters', url: '#', imageUrl: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f929d4?w=800', publishedAt: '2026-03-08T14:00:00Z',
        sector: 'Banking', sentiment: 'Bullish', relatedSymbols: ['SBIN', 'ICICIBANK', 'HDFCBANK']
    },
    {
        id: '7', headline: 'FII selling continues, ₹2,400 Cr outflow in a single day',
        description: 'Foreign institutional investors continued their selling spree, pulling out ₹2,400 crore from Indian equities on Tuesday.',
        source: 'Economic Times', url: '#', imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800', publishedAt: '2026-03-08T11:00:00Z',
        sector: 'Banking', sentiment: 'Bearish', relatedSymbols: ['SENSEX', 'NIFTY 50']
    },
    {
        id: '8', headline: 'ITC demerger: Hotels business to list separately',
        description: 'ITC announced the demerger of its hotels business, which will be listed as a separate entity, unlocking value for shareholders.',
        source: 'Moneycontrol', url: '#', imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', publishedAt: '2026-03-07T15:30:00Z',
        sector: 'FMCG', sentiment: 'Bullish', relatedSymbols: ['ITC']
    },
];

// ──────────────────────────────────────────────────────────
// INSIDER DEALS
// ──────────────────────────────────────────────────────────

export const mockInsiderDeals: InsiderDeal[] = [
    { id: '1', symbol: 'RELIANCE', companyName: 'Reliance Industries', dealType: 'Promoter Buy', quantity: 500000, price: 2440.00, value: 1220000000, date: '2026-03-08', party: 'Mukesh D. Ambani' },
    { id: '2', symbol: 'TCS', companyName: 'Tata Consultancy Services', dealType: 'Bulk Deal', quantity: 2000000, price: 3900.00, value: 7800000000, date: '2026-03-07', party: 'Goldman Sachs' },
    { id: '3', symbol: 'HDFCBANK', companyName: 'HDFC Bank', dealType: 'Block Deal', quantity: 3500000, price: 1640.00, value: 5740000000, date: '2026-03-07', party: 'Morgan Stanley' },
    { id: '4', symbol: 'INFY', companyName: 'Infosys', dealType: 'Promoter Sell', quantity: 150000, price: 1530.00, value: 229500000, date: '2026-03-06', party: 'Nandan Nilekani' },
    { id: '5', symbol: 'SBIN', companyName: 'State Bank of India', dealType: 'Bulk Deal', quantity: 5000000, price: 760.00, value: 3800000000, date: '2026-03-05', party: 'LIC of India' },
];

export const mockPriceAlerts: import('../types').PriceAlert[] = [
    { id: '1', symbol: 'RELIANCE', name: 'Reliance Industries', type: 'price_above', targetValue: 2500, currentValue: 2456.75, enabled: true, createdAt: '2026-03-01T10:00:00Z' },
    { id: '2', symbol: 'TCS', name: 'Tata Consultancy Services', type: 'price_below', targetValue: 3800, currentValue: 3892.4, enabled: true, createdAt: '2026-03-05T09:30:00Z' },
    { id: '3', symbol: 'HDFCBANK', name: 'HDFC Bank', type: 'rsi_oversold', targetValue: 30, currentValue: 55.8, enabled: false, createdAt: '2026-02-28T14:15:00Z', triggeredAt: '2026-03-10T12:00:00Z' },
    { id: '4', symbol: 'INFY', name: 'Infosys', type: 'volume_spike', targetValue: 10000000, currentValue: 6700000, enabled: true, createdAt: '2026-03-08T11:45:00Z' },
];

// ──────────────────────────────────────────────────────────
// PATTERN RESULTS
// ──────────────────────────────────────────────────────────

export const mockPatternResults: PatternResult[] = [
    { id: '1', symbol: 'RELIANCE', patternName: 'Bull Flag', sentiment: 'Bullish', reliability: 'High', targetPrice: 2550, stopLoss: 2400, detectedAt: '2026-03-09' },
    { id: '2', symbol: 'TCS', patternName: 'Double Bottom', sentiment: 'Bullish', reliability: 'Medium', targetPrice: 4000, stopLoss: 3800, detectedAt: '2026-03-08' },
    { id: '3', symbol: 'HDFCBANK', patternName: 'Golden Cross', sentiment: 'Bullish', reliability: 'High', targetPrice: 1750, stopLoss: 1600, detectedAt: '2026-03-07' },
    { id: '4', symbol: 'INFY', patternName: 'Head & Shoulders', sentiment: 'Bearish', reliability: 'Medium', targetPrice: 1400, stopLoss: 1560, detectedAt: '2026-03-07' },
    { id: '5', symbol: 'TATAMOTORS', patternName: 'Cup & Handle', sentiment: 'Bullish', reliability: 'High', targetPrice: 800, stopLoss: 690, detectedAt: '2026-03-06' },
];

// ──────────────────────────────────────────────────────────
// GLOSSARY / LEARN HUB
// ──────────────────────────────────────────────────────────

export const mockGlossary: GlossaryTerm[] = [
    { id: '1', term: 'Bull Market', shortDefinition: 'Market where prices are rising', fullExplanation: 'A bull market is a period during which stock prices are rising or are expected to rise. The term is often used to refer to the stock market but can apply to anything that is traded.', example: 'NIFTY 50 rising from 18,000 to 22,000 over 6 months is a bull market.', category: 'basics' },
    { id: '2', term: 'Bear Market', shortDefinition: 'Market where prices are falling', fullExplanation: 'A bear market is when a market experiences prolonged price declines, typically falling 20% or more from recent highs. Bear markets are often associated with declines in the overall market or index.', example: 'NIFTY 50 falling from 18,600 to 15,183 during COVID crash in March 2020.', category: 'basics' },
    { id: '3', term: 'RSI (Relative Strength Index)', shortDefinition: 'Momentum indicator, 0-100 scale', fullExplanation: 'RSI measures the speed and magnitude of recent price changes to evaluate whether a stock is overbought (>70) or oversold (<30). Values between 30-70 are considered normal.', example: 'If Reliance RSI = 75, it is overbought and might see a pullback.', category: 'technical' },
    { id: '4', term: 'MACD', shortDefinition: 'Trend-following momentum indicator', fullExplanation: 'Moving Average Convergence Divergence (MACD) shows the relationship between two EMAs (12 and 26 period). A signal line (9-period EMA) helps identify buy/sell signals.', example: 'When MACD line crosses above signal line, it is a bullish crossover.', category: 'technical' },
    { id: '5', term: 'P/E Ratio', shortDefinition: 'Price to Earnings ratio', fullExplanation: 'P/E ratio measures a company\'s share price relative to its earnings per share. A high P/E may indicate overvaluation, while a low P/E could signal undervaluation.', example: 'TCS at P/E of 31 means investors pay ₹31 for every ₹1 of earnings.', category: 'fundamental' },
    { id: '6', term: 'EPS (Earnings Per Share)', shortDefinition: 'Company profit per outstanding share', fullExplanation: 'EPS is calculated by dividing the company\'s net income by the total number of outstanding shares. Higher EPS indicates better profitability.', example: 'If Reliance earns ₹60,000 Cr with 676 Cr shares, EPS = ₹88.76', category: 'fundamental' },
    { id: '7', term: 'SIP', shortDefinition: 'Systematic Investment Plan', fullExplanation: 'SIP allows you to invest a fixed amount regularly in mutual funds. It uses rupee cost averaging to reduce the impact of market volatility.', example: 'Investing ₹5,000/month in a NIFTY 50 index fund via SIP.', category: 'basics' },
    { id: '8', term: 'XIRR', shortDefinition: 'Extended Internal Rate of Return', fullExplanation: 'XIRR calculates the annualized return on investments with irregular cash flows (like SIP). It accounts for the timing of each investment and redemption.', example: 'Multiple SIP payments + final redemption → XIRR gives your true annualized return.', category: 'basics' },
    { id: '9', term: 'Support Level', shortDefinition: 'Price floor where buying interest increases', fullExplanation: 'A support level is a price point where a stock tends to find buying interest as it falls. It acts as a floor preventing further decline.', example: 'NIFTY 50 repeatedly bouncing off 21,800 indicates strong support.', category: 'technical' },
    { id: '10', term: 'Head & Shoulders', shortDefinition: 'Bearish reversal chart pattern', fullExplanation: 'Head and Shoulders is a chart pattern with three peaks, the middle being the highest. It signals a trend reversal from bullish to bearish when the neckline breaks.', example: 'Stock peaks at ₹100, ₹120, ₹100, then breaks below ₹90 neckline.', category: 'patterns' },
];
