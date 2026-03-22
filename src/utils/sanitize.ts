// src/utils/sanitize.ts

/**
 * Strips everything except letters, numbers, dots, and ampersands.
 * Max length 20 characters.
 */
export const sanitizeSymbol = (input: string): string => {
    if (!input) return "";
    return input
        .replace(/[^a-zA-Z0-9.&]/g, "")
        .slice(0, 20)
        .toUpperCase();
};

/**
 * Strips HTML tags, script tags, and common SQL keywords.
 * Max length 500 characters.
 */
export const sanitizeText = (input: string): string => {
    if (!input) return "";
    return input
        .replace(/<[^>]*>?/gm, "") // Strip HTML
        .replace(/script|select|insert|update|delete|drop|union/gi, "") // Basic SQL/Script keywords
        .slice(0, 500);
};
