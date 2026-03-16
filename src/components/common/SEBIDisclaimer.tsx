import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize } from '../../constants/theme';

export default function SEBIDisclaimer() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                Disclaimer: Investments in securities market are subject to market risks, read all the related documents carefully before investing.
                This app is for educational purposes only. We are not SEBI registered advisors.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Spacing.xl,
        backgroundColor: Colors.surface,
        marginTop: Spacing.xl,
        marginBottom: Spacing.xxl,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        alignItems: 'center',
    },
    text: {
        color: Colors.textTertiary,
        fontSize: FontSize.xs,
        textAlign: 'center',
        lineHeight: 18,
    },
});
