// Watchlist Context — manages the user's watchlist with AsyncStorage persistence

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WatchlistItem } from '../types';

interface WatchlistContextType {
    watchlist: WatchlistItem[];
    addToWatchlist: (symbol: string, name: string) => void;
    removeFromWatchlist: (symbol: string) => void;
    isInWatchlist: (symbol: string) => boolean;
}

const WatchlistContext = createContext<WatchlistContextType>({
    watchlist: [],
    addToWatchlist: () => { },
    removeFromWatchlist: () => { },
    isInWatchlist: () => false,
});

const STORAGE_KEY = '@investcompanion_watchlist';

// Default watchlist with popular stocks
const DEFAULT_WATCHLIST: WatchlistItem[] = [
    { symbol: 'RELIANCE', name: 'Reliance Industries', addedAt: Date.now() },
    { symbol: 'TCS', name: 'Tata Consultancy Services', addedAt: Date.now() },
    { symbol: 'HDFCBANK', name: 'HDFC Bank', addedAt: Date.now() },
    { symbol: 'INFY', name: 'Infosys', addedAt: Date.now() },
    { symbol: 'ICICIBANK', name: 'ICICI Bank', addedAt: Date.now() },
];

export function WatchlistProvider({ children }: { children: ReactNode }) {
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>(DEFAULT_WATCHLIST);

    useEffect(() => {
        loadWatchlist();
    }, []);

    const loadWatchlist = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                setWatchlist(JSON.parse(stored));
            }
        } catch (error) {
            console.log('Error loading watchlist:', error);
        }
    };

    const saveWatchlist = async (newList: WatchlistItem[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
        } catch (error) {
            console.log('Error saving watchlist:', error);
        }
    };

    const addToWatchlist = (symbol: string, name: string) => {
        if (!isInWatchlist(symbol)) {
            const newList = [...watchlist, { symbol, name, addedAt: Date.now() }];
            setWatchlist(newList);
            saveWatchlist(newList);
        }
    };

    const removeFromWatchlist = (symbol: string) => {
        const newList = watchlist.filter(item => item.symbol !== symbol);
        setWatchlist(newList);
        saveWatchlist(newList);
    };

    const isInWatchlist = (symbol: string) => {
        return watchlist.some(item => item.symbol === symbol);
    };

    return (
        <WatchlistContext.Provider value={{ watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist }}>
            {children}
        </WatchlistContext.Provider>
    );
}

export const useWatchlist = () => useContext(WatchlistContext);
