// Portfolio Context — manages user's portfolio holdings with AsyncStorage persistence

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PortfolioHolding } from '../types';
import { generateId } from '../utils/formatters';

interface PortfolioContextType {
    holdings: PortfolioHolding[];
    addHolding: (holding: Omit<PortfolioHolding, 'id'>) => void;
    removeHolding: (id: string) => void;
    updateHolding: (id: string, updates: Partial<PortfolioHolding>) => void;
}

const PortfolioContext = createContext<PortfolioContextType>({
    holdings: [],
    addHolding: () => { },
    removeHolding: () => { },
    updateHolding: () => { },
});

const STORAGE_KEY = '@investcompanion_portfolio';

export function PortfolioProvider({ children }: { children: ReactNode }) {
    const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);

    useEffect(() => {
        loadPortfolio();
    }, []);

    const loadPortfolio = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                setHoldings(JSON.parse(stored));
            }
        } catch (error) {
            console.log('Error loading portfolio:', error);
        }
    };

    const savePortfolio = async (newHoldings: PortfolioHolding[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newHoldings));
        } catch (error) {
            console.log('Error saving portfolio:', error);
        }
    };

    const addHolding = (holding: Omit<PortfolioHolding, 'id'>) => {
        const newHolding: PortfolioHolding = { ...holding, id: generateId() };
        const newHoldings = [...holdings, newHolding];
        setHoldings(newHoldings);
        savePortfolio(newHoldings);
    };

    const removeHolding = (id: string) => {
        const newHoldings = holdings.filter(h => h.id !== id);
        setHoldings(newHoldings);
        savePortfolio(newHoldings);
    };

    const updateHolding = (id: string, updates: Partial<PortfolioHolding>) => {
        const newHoldings = holdings.map(h => h.id === id ? { ...h, ...updates } : h);
        setHoldings(newHoldings);
        savePortfolio(newHoldings);
    };

    return (
        <PortfolioContext.Provider value={{ holdings, addHolding, removeHolding, updateHolding }}>
            {children}
        </PortfolioContext.Provider>
    );
}

export const usePortfolio = () => useContext(PortfolioContext);
