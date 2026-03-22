import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../constants/theme';

export default function FIIDIIDetailScreen() {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>FII & DII Explained</Text>
                <View style={styles.backBtn} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.heroSection}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="earth" size={32} color={Colors.primary} />
                    </View>
                    <Text style={styles.heroTitle}>The Market Movers</Text>
                    <Text style={styles.heroSubtitle}>
                        FIIs and DIIs dictate the broad market trend. Tracking their daily activity helps understand market sentiment and direction.
                    </Text>
                </View>

                {/* FAQ 1 */}
                <View style={styles.faqCard}>
                    <Text style={styles.question}>What is FII?</Text>
                    <Text style={styles.answer}>
                        <Text style={{fontWeight: 'bold'}}>Foreign Institutional Investors</Text> (FIIs) are foreign entities investing in India's financial markets. They bring massive amounts of foreign capital. Examples include foreign mutual funds, hedge funds, sovereign wealth funds, and pension funds.
                    </Text>
                </View>

                {/* FAQ 2 */}
                <View style={styles.faqCard}>
                    <Text style={styles.question}>What is DII?</Text>
                    <Text style={styles.answer}>
                        <Text style={{fontWeight: 'bold'}}>Domestic Institutional Investors</Text> (DIIs) are Indian financial institutions investing in the Indian markets. Examples include mutual funds like SBI MF, ICICI Prudential, insurance giants like LIC, and local banks.
                    </Text>
                </View>

                {/* FAQ 3 */}
                <View style={styles.faqCard}>
                    <Text style={styles.question}>What should I do when FII sells?</Text>
                    <Text style={styles.answer}>
                        When FIIs sell, markets often drop in the short term. However, DIIs systematically buy dips using domestic SIP money. Look for the <Text style={{fontWeight: 'bold'}}>Market Impact</Text>: if DIIs are buying more than FIIs are selling, the market is usually resilient. A drop because of FII selling is often considered a great opportunity to accumulate quality stocks.
                    </Text>
                </View>

                {/* FAQ 4 */}
                <View style={styles.faqCard}>
                    <Text style={styles.question}>Why does it matter?</Text>
                    <View style={styles.bulletRow}>
                        <View style={styles.bullet} />
                        <Text style={styles.answer}>If <Text style={{color: Colors.gain, fontWeight: 'bold'}}>Both Buy</Text>, massive liquidity pushes the market to new highs (Bullish).</Text>
                    </View>
                    <View style={styles.bulletRow}>
                        <View style={styles.bullet} />
                        <Text style={styles.answer}>If <Text style={{color: Colors.loss, fontWeight: 'bold'}}>Both Sell</Text>, there is no support, resulting in severe market falls (Bearish).</Text>
                    </View>
                    <View style={styles.bulletRow}>
                        <View style={styles.bullet} />
                        <Text style={styles.answer}>If they oppose each other (most common), the side with the higher volume dictates the day's momentum.</Text>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 56,
        paddingBottom: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    backBtn: {
        padding: Spacing.sm,
        width: 48,
    },
    headerTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    content: {
        padding: Spacing.xl,
        paddingBottom: Spacing.xxl,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.primaryGlow,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    heroSubtitle: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: Spacing.md,
    },
    faqCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    question: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.primary,
        marginBottom: Spacing.sm,
    },
    answer: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        lineHeight: 22,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: Spacing.sm,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.textTertiary,
        marginTop: 8,
        marginRight: Spacing.sm,
    },
});
