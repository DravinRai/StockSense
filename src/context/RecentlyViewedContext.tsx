// RecentlyViewedContext — Tracks last 10 viewed stock symbols with AsyncStorage
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { secureSet, secureGet, secureRemove } from '../utils/secureStorage';

const STORAGE_KEY = '@recently_viewed_stocks';
const MAX_RECENT = 10;

interface RecentlyViewedContextType {
    recentlyViewed: string[];
    addRecentlyViewed: (symbol: string) => void;
    clearRecentlyViewed: () => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType>({
    recentlyViewed: [],
    addRecentlyViewed: () => {},
    clearRecentlyViewed: () => {},
});

export function RecentlyViewedProvider({ children }: { children: React.ReactNode }) {
    const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

    useEffect(() => {
        secureGet(STORAGE_KEY).then(data => {
            if (data) {
                try {
                    setRecentlyViewed(JSON.parse(data));
                } catch {}
            }
        });
    }, []);

    const persist = useCallback((items: string[]) => {
        secureSet(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
    }, []);

    const addRecentlyViewed = useCallback((symbol: string) => {
        setRecentlyViewed(prev => {
            const filtered = prev.filter(s => s !== symbol);
            const updated = [symbol, ...filtered].slice(0, MAX_RECENT);
            persist(updated);
            return updated;
        });
    }, [persist]);

    const clearRecentlyViewed = useCallback(() => {
        setRecentlyViewed([]);
        secureRemove(STORAGE_KEY).catch(() => {});
    }, []);

    return (
        <RecentlyViewedContext.Provider value={{ recentlyViewed, addRecentlyViewed, clearRecentlyViewed }}>
            {children}
        </RecentlyViewedContext.Provider>
    );
}

export function useRecentlyViewed() {
    return useContext(RecentlyViewedContext);
}
