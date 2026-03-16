// TypeScript interfaces for the Investment Companion App

export interface StockQuote {
    symbol: string;
    name: string;
    exchange: string;
    ltp: number;          // Last Traded Price
    change: number;       // Absolute change
    changePercent: number; // Percentage change
    open: number;
    high: number;
    low: number;
    close: number;        // Previous close
    volume: number;
    marketCap?: number;
    week52High: number;
    week52Low: number;
    sector?: string;
    // Fundamentals (from Yahoo Finance v8 quote when available)
    trailingPE?: number;
    epsTrailingTwelveMonths?: number;
    bookValue?: number;
    dividendYield?: number;
}

export interface IndexData {
    name: string;
    value: number;
    change: number;
    changePercent: number;
    sparkline: number[];  // Last 20 data points for mini chart
}

export interface CandleData {
    x?: number;
    y?: number;
    timestamp: string | number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface TechnicalIndicators {
    rsi: number;
    macd: {
        macdLine: number;
        signalLine: number;
        histogram: number;
    };
    bollingerBands: {
        upper: number;
        middle: number;
        lower: number;
    };
    support: number[];
    resistance: number[];
}

export interface FundamentalData {
    pe: number;
    eps: number;
    bookValue: number;
    dividendYield: number;
    marketCap: number;
    promoterHolding: number;
    fiiHolding: number;
    diiHolding: number;
    publicHolding: number;
    pledgedPercent: number;
    debtToEquity: number;
    roe: number;
}

export interface FIIDIIData {
    date: string;
    fiiBuy: number;
    fiiSell: number;
    fiiNet: number;
    diiBuy: number;
    diiSell: number;
    diiNet: number;
}

export interface WatchlistItem {
    symbol: string;
    name: string;
    addedAt: number;
}

export interface PortfolioHolding {
    id: string;
    symbol: string;
    name: string;
    buyPrice: number;
    quantity: number;
    buyDate: string;
    currentPrice?: number;
    sector?: string;
}

export interface NewsItem {
    id: string;
    headline: string;
    description: string;
    source: string;
    url: string;
    imageUrl?: string;
    publishedAt: string;
    sector: string;
    sentiment: 'Bullish' | 'Bearish' | 'Neutral';
    relatedSymbols: string[];
}

export interface PriceAlert {
    id: string;
    symbol: string;
    name: string;
    type: 'price_above' | 'price_below' | 'rsi_overbought' | 'rsi_oversold' | 'volume_spike';
    targetValue: number;
    currentValue: number;
    enabled: boolean;
    createdAt: string;
    triggeredAt?: string;
}

export interface PatternResult {
    id: string;
    symbol: string;
    // name: string;
    patternName: string;
    sentiment: 'Bullish' | 'Bearish';
    reliability: 'High' | 'Medium' | 'Low';
    targetPrice: number;
    stopLoss: number;
    detectedAt: string;
    // description: string;
}

export interface InsiderDeal {
    id: string;
    symbol: string;
    companyName: string;
    dealType: 'Promoter Buy' | 'Promoter Sell' | 'Bulk Deal' | 'Block Deal';
    quantity: number;
    price: number;
    value: number;
    date: string;
    party: string;
}

export interface GlossaryTerm {
    id: string;
    term: string;
    shortDefinition: string;
    fullExplanation: string;
    example: string;
    category: 'basics' | 'technical' | 'fundamental' | 'patterns';
}

export type Sector = 'IT' | 'Banking' | 'Pharma' | 'FMCG' | 'Auto' | 'Energy' | 'Metal' | 'Realty';
export type TimePeriod = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'All';
export type MarketStatus = 'open' | 'closed' | 'pre-open';
