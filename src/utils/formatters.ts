// Utility functions for formatting Indian currency, numbers, and dates

/**
 * Strip .NS and .BO suffix from stock symbols for clean display
 */
export const cleanTicker = (symbol: string): string => {
    if (!symbol) return '';
    // Handle symbols with pipe (cleaning up any legacy format)
    const base = symbol.includes('|') ? symbol.split('|').pop() || symbol : symbol;
    // Strip Yahoo Finance suffixes
    return base.replace(/\.(NS|BO)$/i, '');
};

/**
 * Safe number — returns fallback if value is null, undefined, or NaN
 */
export function safeNumber(val: any, fallback: number = 0): number {
    if (val === null || val === undefined || isNaN(val)) return fallback;
    return Number(val);
}

/**
 * Format a number as Indian Rupee (₹)
 * Uses Indian numbering system: ₹1,23,456.78
 */
export function formatRupee(amount: number, showSign = false): string {
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? '-' : (showSign && amount > 0 ? '+' : '');

    if (absAmount >= 1e7) {
        // Crores
        const crores = absAmount / 1e7;
        if (crores >= 100) {
            return `${sign}₹${crores.toFixed(0)} Cr`;
        }
        return `${sign}₹${crores.toFixed(2)} Cr`;
    }

    if (absAmount >= 1e5) {
        // Lakhs
        const lakhs = absAmount / 1e5;
        return `${sign}₹${lakhs.toFixed(2)} L`;
    }

    // Standard Indian formatting
    const parts = absAmount.toFixed(2).split('.');
    let intPart = parts[0];
    const decPart = parts[1];

    // Indian grouping: last 3 digits, then groups of 2
    if (intPart.length > 3) {
        const last3 = intPart.slice(-3);
        const rest = intPart.slice(0, -3);
        const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
        intPart = `${grouped},${last3}`;
    }

    return `${sign}₹${intPart}.${decPart}`;
}

/**
 * Format a number as Indian Rupee for large market cap values
 * e.g., ₹12.5L Cr
 */
export function formatMarketCap(value: number): string {
    if (value >= 1e12) {
        return `₹${(value / 1e12).toFixed(2)}L Cr`;
    }
    if (value >= 1e7) {
        return `₹${(value / 1e7).toFixed(2)} Cr`;
    }
    if (value >= 1e5) {
        return `₹${(value / 1e5).toFixed(2)} L`;
    }
    return formatRupee(value);
}

/**
 * Format percentage with sign and color indication
 */
export function formatPercent(value: number, decimals = 2): string {
    const safe = safeNumber(value, 0);
    const sign = safe > 0 ? '+' : '';
    return `${sign}${safe.toFixed(decimals)}%`;
}

/**
 * Format large volume numbers
 * e.g., 1.2 Cr, 45.6 L, 12.3 K
 */
export function formatVolume(volume: number): string {
    if (volume >= 1e7) {
        return `${(volume / 1e7).toFixed(2)} Cr`;
    }
    if (volume >= 1e5) {
        return `${(volume / 1e5).toFixed(2)} L`;
    }
    if (volume >= 1e3) {
        return `${(volume / 1e3).toFixed(1)} K`;
    }
    return volume.toString();
}

/**
 * Time ago formatter
 */
export function formatTimeAgo(date: string | Date): string {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();

    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return past.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * Format price with appropriate decimal places
 */
export function formatPrice(price: number): string {
    const safe = safeNumber(price, 0);
    if (safe >= 1000) return safe.toFixed(2);
    if (safe >= 100) return safe.toFixed(2);
    if (safe >= 1) return safe.toFixed(2);
    return safe.toFixed(4);
}

/**
 * Determine if market is currently open
 * Indian market: Mon-Fri, 9:15 AM - 3:30 PM IST
 */
export function getMarketStatus(): 'open' | 'closed' | 'pre-open' {
    const now = new Date();
    // Convert current time to UTC and then to IST (+5:30)
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istTime = new Date(utcTime + (330 * 60000));

    const istDay = istTime.getDay();
    const istHours = istTime.getHours();
    const istMins = istTime.getMinutes();
    const adjustedMinutes = istHours * 60 + istMins;

    // Weekend
    if (istDay === 0 || istDay === 6) return 'closed';

    // Pre-open: 9:00 - 9:15
    if (adjustedMinutes >= 540 && adjustedMinutes < 555) return 'pre-open';

    // Market hours: 9:15 - 15:30
    if (adjustedMinutes >= 555 && adjustedMinutes <= 930) return 'open';

    return 'closed';
}

/**
 * Get color based on value (positive = green, negative = red)
 */
export function getChangeColor(value: number): string {
    if (value > 0) return '#10B981';
    if (value < 0) return '#EF4444';
    return '#9CA3AF';
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
