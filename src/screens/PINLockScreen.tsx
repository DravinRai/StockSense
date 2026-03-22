// src/screens/PINLockScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../constants/theme';
import { secureSet, secureGet } from '../utils/secureStorage';
import { encode as btoa } from 'base-64';

const PIN_KEY = '@stocksense_pin_hash';
const SALT = "stocksense_salt_2026";

interface PINLockScreenProps {
    onUnlock: () => void;
}

export default function PINLockScreen({ onUnlock }: PINLockScreenProps) {
    const [pin, setPin] = useState('');
    const [isSetup, setIsSetup] = useState(false);
    const [title, setTitle] = useState('Enter PIN');

    useEffect(() => {
        checkPin();
    }, []);

    const checkPin = async () => {
        const storedHash = await secureGet(PIN_KEY);
        if (!storedHash) {
            setIsSetup(true);
            setTitle('Set 4-Digit PIN');
        }
    };

    const hashPin = (p: string) => btoa(p + SALT);

    const handlePinEntry = async (value: string) => {
        setPin(value);
        if (value.length === 4) {
            if (isSetup) {
                const hash = hashPin(value);
                await secureSet(PIN_KEY, hash);
                Alert.alert('Success', 'PIN set successfully');
                onUnlock();
            } else {
                const storedHash = await secureGet(PIN_KEY);
                if (hashPin(value) === storedHash) {
                    onUnlock();
                } else {
                    Alert.alert('Error', 'Incorrect PIN');
                    setPin('');
                }
            }
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.pinContainer}>
                {[0, 1, 2, 3].map((i) => (
                    <View 
                        key={i} 
                        style={[
                            styles.dot, 
                            { backgroundColor: pin.length > i ? Colors.primary : Colors.surfaceLight }
                        ]} 
                    />
                ))}
            </View>
            <TextInput
                style={styles.hiddenInput}
                keyboardType="number-pad"
                maxLength={4}
                value={pin}
                onChangeText={handlePinEntry}
                autoFocus={true}
            />
            {isSetup && (
                <Text style={styles.subtitle}>Choose a 4-digit PIN to secure your data</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 30,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 20,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    pinContainer: {
        flexDirection: 'row',
        marginBottom: 50,
    },
    dot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginHorizontal: 15,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    hiddenInput: {
        position: 'absolute',
        opacity: 0,
    }
});
