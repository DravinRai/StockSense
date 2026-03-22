// src/config/apiConfig.ts
import Constants from 'expo-constants';

/**
 * In development, we use localhost:3001
 * In production, you should set EXPO_PUBLIC_API_URL in your environment
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

export const API_ENDPOINTS = {
    ANALYZE: `${API_BASE_URL}/api/analyze`,
    STOCK: (symbol: string) => `${API_BASE_URL}/api/stock/${symbol}`,
    CHART: (symbol: string) => `${API_BASE_URL}/api/chart/${symbol}`,
    QUOTES: `${API_BASE_URL}/api/market/quotes`,
    SEARCH: (query: string) => `${API_BASE_URL}/api/search?q=${query}`,
    NIFTY: `${API_BASE_URL}/api/nifty`,
    QUOTE_SUMMARY: (symbol: string) => `${API_BASE_URL}/api/quote-summary/${symbol}`,
};

export const REQUEST_TIMEOUT = 15000; // 15 seconds
