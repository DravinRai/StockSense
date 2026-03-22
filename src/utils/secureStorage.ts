// src/utils/secureStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const XOR_KEY = 42; // Simple XOR key for obfuscation

const obfuscate = (str: string): string => {
    return str.split('').map(char => String.fromCharCode(char.charCodeAt(0) ^ XOR_KEY)).join('');
};

const deobfuscate = (str: string): string => {
    return obfuscate(str); // XOR is its own inverse
};

export const secureSet = async (key: string, value: string): Promise<void> => {
    try {
        const obfuscatedValue = obfuscate(value);
        await AsyncStorage.setItem(key, obfuscatedValue);
    } catch (error) {
        console.error('SecureSet error:', error);
    }
};

export const secureGet = async (key: string): Promise<string | null> => {
    try {
        const obfuscatedValue = await AsyncStorage.getItem(key);
        if (!obfuscatedValue) return null;
        return deobfuscate(obfuscatedValue);
    } catch (error) {
        console.error('SecureGet error:', error);
        return null;
    }
};

export const secureRemove = async (key: string): Promise<void> => {
    try {
        await AsyncStorage.removeItem(key);
    } catch (error) {
        console.error('SecureRemove error:', error);
    }
};
