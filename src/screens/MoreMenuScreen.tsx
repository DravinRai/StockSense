// More Menu Screen — Gateway to News, Calculators, Learn Hub, etc.
import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../constants/theme';

const MENU_ITEMS = [
    { id: 'calculators', title: 'Calculators', icon: 'calculator', desc: 'SIP, Lumpsum, CAGR, and Goal Planners', route: 'Calculator' },
    { id: 'news', title: 'News Feed', icon: 'newspaper', desc: 'Market news filtered by sector and sentiment', route: 'News' },
    { id: 'scanner', title: 'Pattern Scanner', icon: 'scan-circle', desc: 'Identify chart patterns with visual explanations', route: 'Scanner' },
    { id: 'alerts', title: 'Alerts', icon: 'notifications', desc: 'Price targets, RSI and volume spike alerts', route: 'Alerts' },
    { id: 'insider', title: 'Insider Tracker', icon: 'eye', desc: 'Promoter activity, bulk deals, and FII flows', route: 'Insider' },
    { id: 'learn', title: 'Learn Hub', icon: 'school', desc: 'Key terms and chart patterns explained simply', route: 'Learn' },
    { id: 'settings', title: 'Settings & Profile', icon: 'settings-outline', desc: 'Notifications, display preferences, and app info', route: 'Settings' },
];

export default function MoreMenuScreen() {
    const navigation = useNavigation<any>();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Menu</Text>
                <Text style={styles.headerSubtitle}>Explore more features</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {MENU_ITEMS.map((item, index) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[
                            styles.menuCard,
                            index !== MENU_ITEMS.length - 1 && styles.menuCardBorder
                        ]}
                        onPress={() => navigation.navigate(item.route)}
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons name={item.icon as any} size={24} color={Colors.primary} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.menuTitle}>{item.title}</Text>
                            <Text style={styles.menuDesc}>{item.desc}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
                    </TouchableOpacity>
                ))}
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
        paddingHorizontal: Spacing.xl,
        paddingTop: 56,
        paddingBottom: Spacing.xl,
    },
    headerTitle: {
        fontSize: FontSize.xxxl,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    headerSubtitle: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xl,
    },
    menuCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.lg,
    },
    menuCardBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    textContainer: {
        flex: 1,
        marginLeft: Spacing.md,
        marginRight: Spacing.sm,
    },
    menuTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    menuDesc: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        lineHeight: 16,
    },
});
