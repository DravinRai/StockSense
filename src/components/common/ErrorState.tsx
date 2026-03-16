import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';

interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    retryText?: string;
}

export default function ErrorState({
    title = 'Oops! Something went wrong',
    message = 'We encountered an error while fetching the data. Please try again.',
    onRetry,
    retryText = 'Try Again',
}: ErrorStateProps) {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Ionicons name="warning-outline" size={48} color={Colors.loss} />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            {onRetry && (
                <TouchableOpacity style={styles.button} onPress={onRetry} activeOpacity={0.8}>
                    <Ionicons name="refresh" size={18} color={Colors.white} style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>{retryText}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xxxl,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.lossBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    title: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    message: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing.xxl,
        lineHeight: 22,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xxxl,
        borderRadius: BorderRadius.full,
    },
    buttonIcon: {
        marginRight: Spacing.sm,
    },
    buttonText: {
        color: Colors.white,
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
});
