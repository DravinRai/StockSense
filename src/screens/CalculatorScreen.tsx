// Calculator Screen — SIP, Lumpsum, CAGR, Goal planner
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, StatusBar, Dimensions, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../constants/theme';
import { calculateSIP, calculateLumpsum, calculateCAGR, calculateGoalSIP } from '../utils/calculations';
import { formatRupee } from '../utils/formatters';

const { width } = Dimensions.get('window');

type CalcType = 'SIP' | 'Lumpsum' | 'CAGR' | 'Goal';

export default function CalculatorScreen() {
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState<CalcType>('SIP');

    // Inputs
    const [investment, setInvestment] = useState('5000');
    const [rate, setRate] = useState('12');
    const [years, setYears] = useState('10');

    const [cagrInitial, setCagrInitial] = useState('100000');
    const [cagrFinal, setCagrFinal] = useState('200000');

    const [goalTarget, setGoalTarget] = useState('10000000');

    // Compute Results
    const sipResult = calculateSIP(Number(investment) || 0, Number(rate) || 0, Number(years) || 0);
    const lumpsumResult = calculateLumpsum(Number(investment) || 0, Number(rate) || 0, Number(years) || 0);
    const cagrResult = calculateCAGR(Number(cagrInitial) || 1, Number(cagrFinal) || 1, Number(years) || 1);
    const goalResult = calculateGoalSIP(Number(goalTarget) || 0, Number(rate) || 0, Number(years) || 1);

    const renderTabs = () => (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContainer}>
            {(['SIP', 'Lumpsum', 'CAGR', 'Goal'] as CalcType[]).map(tab => (
                <TouchableOpacity
                    key={tab}
                    style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                    onPress={() => setActiveTab(tab)}
                >
                    <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    const renderSIP = () => (
        <View style={styles.calcSection}>
            <Text style={styles.sectionTitle}>SIP Calculator</Text>

            <View style={styles.inputCard}>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Monthly Investment (₹)</Text>
                    <TextInput style={styles.inputField} keyboardType="numeric" value={investment} onChangeText={setInvestment} />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Expected Return Rate (p.a %)</Text>
                    <TextInput style={styles.inputField} keyboardType="numeric" value={rate} onChangeText={setRate} />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Time Period (Years)</Text>
                    <TextInput style={styles.inputField} keyboardType="numeric" value={years} onChangeText={setYears} />
                </View>
            </View>

            <View style={styles.resultCard}>
                <Text style={styles.resultLabel}>Total Value</Text>
                <Text style={styles.resultValuePrimary}>{formatRupee(sipResult.futureValue)}</Text>

                <View style={styles.resultDivider} />

                <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Invested Amount</Text>
                    <Text style={styles.resultValue}>{formatRupee(sipResult.totalInvested)}</Text>
                </View>
                <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Wealth Gained</Text>
                    <Text style={[styles.resultValue, { color: Colors.gain }]}>+{formatRupee(sipResult.totalReturns)}</Text>
                </View>
            </View>
        </View>
    );

    const renderLumpsum = () => (
        <View style={styles.calcSection}>
            <Text style={styles.sectionTitle}>Lumpsum Calculator</Text>

            <View style={styles.inputCard}>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Total Investment (₹)</Text>
                    <TextInput style={styles.inputField} keyboardType="numeric" value={investment} onChangeText={setInvestment} />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Expected Return Rate (p.a %)</Text>
                    <TextInput style={styles.inputField} keyboardType="numeric" value={rate} onChangeText={setRate} />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Time Period (Years)</Text>
                    <TextInput style={styles.inputField} keyboardType="numeric" value={years} onChangeText={setYears} />
                </View>
            </View>

            <View style={styles.resultCard}>
                <Text style={styles.resultLabel}>Total Value</Text>
                <Text style={styles.resultValuePrimary}>{formatRupee(lumpsumResult.futureValue)}</Text>

                <View style={styles.resultDivider} />

                <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Invested Amount</Text>
                    <Text style={styles.resultValue}>{formatRupee(lumpsumResult.totalInvested)}</Text>
                </View>
                <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Wealth Gained</Text>
                    <Text style={[styles.resultValue, { color: Colors.gain }]}>+{formatRupee(lumpsumResult.totalReturns)}</Text>
                </View>
            </View>
        </View>
    );

    const renderCAGR = () => (
        <View style={styles.calcSection}>
            <Text style={styles.sectionTitle}>CAGR Calculator</Text>
            <Text style={styles.sectionDesc}>Calculate Compound Annual Growth Rate</Text>

            <View style={styles.inputCard}>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Initial Value (₹)</Text>
                    <TextInput style={styles.inputField} keyboardType="numeric" value={cagrInitial} onChangeText={setCagrInitial} />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Final Value (₹)</Text>
                    <TextInput style={styles.inputField} keyboardType="numeric" value={cagrFinal} onChangeText={setCagrFinal} />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Time Period (Years)</Text>
                    <TextInput style={styles.inputField} keyboardType="numeric" value={years} onChangeText={setYears} />
                </View>
            </View>

            <View style={styles.resultCard}>
                <Text style={styles.resultLabel}>CAGR</Text>
                <Text style={[styles.resultValuePrimary, { color: cagrResult >= 0 ? Colors.gain : Colors.loss }]}>
                    {cagrResult.toFixed(2)}%
                </Text>
            </View>
        </View>
    );

    const renderGoal = () => (
        <View style={styles.calcSection}>
            <Text style={styles.sectionTitle}>Goal Planner</Text>
            <Text style={styles.sectionDesc}>Find out how much you need to invest monthly to reach your target.</Text>

            <View style={styles.inputCard}>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Target Amount (₹)</Text>
                    <TextInput style={styles.inputField} keyboardType="numeric" value={goalTarget} onChangeText={setGoalTarget} />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Expected Return Rate (p.a %)</Text>
                    <TextInput style={styles.inputField} keyboardType="numeric" value={rate} onChangeText={setRate} />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Time Period (Years)</Text>
                    <TextInput style={styles.inputField} keyboardType="numeric" value={years} onChangeText={setYears} />
                </View>
            </View>

            <View style={styles.resultCard}>
                <Text style={styles.resultLabel}>Required Monthly SIP</Text>
                <Text style={styles.resultValuePrimary}>{formatRupee(goalResult)}</Text>

                <View style={styles.resultDivider} />
                <Text style={styles.resultDesc}>
                    If you invest {formatRupee(goalResult)} every month for {years} years at {rate}%, you will reach {formatRupee(Number(goalTarget) || 0)}.
                </Text>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Calculators</Text>
                <View style={{ width: 24 }} />
            </View>

            {renderTabs()}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {activeTab === 'SIP' && renderSIP()}
                {activeTab === 'Lumpsum' && renderLumpsum()}
                {activeTab === 'CAGR' && renderCAGR()}
                {activeTab === 'Goal' && renderGoal()}
            </ScrollView>
        </KeyboardAvoidingView>
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
        paddingHorizontal: Spacing.xl,
        paddingTop: 56,
        paddingBottom: Spacing.md,
    },
    backButton: {
        padding: Spacing.xs,
        marginLeft: -Spacing.xs,
    },
    headerTitle: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    tabContainer: {
        paddingHorizontal: Spacing.xl,
        gap: Spacing.sm,
        marginBottom: Spacing.md,
        maxHeight: 40,
    },
    tabBtn: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    tabBtnActive: {
        backgroundColor: Colors.primaryGlow,
        borderColor: Colors.primary,
    },
    tabText: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        fontWeight: FontWeight.medium,
    },
    tabTextActive: {
        color: Colors.primary,
        fontWeight: FontWeight.bold,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    calcSection: {
        paddingHorizontal: Spacing.xl,
    },
    sectionTitle: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    sectionDesc: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.md,
    },
    inputCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.xl,
        gap: Spacing.lg,
    },
    inputGroup: {
    },
    inputLabel: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.xs,
    },
    inputField: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: FontSize.md,
        color: Colors.textPrimary,
        backgroundColor: Colors.background,
        fontWeight: FontWeight.semibold,
    },
    resultCard: {
        backgroundColor: Colors.primaryGlow,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    resultLabel: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },
    resultValuePrimary: {
        fontSize: 36,
        fontWeight: FontWeight.bold,
        color: Colors.primaryLight,
        marginTop: 4,
    },
    resultDivider: {
        height: 1,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        marginVertical: Spacing.lg,
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    resultValue: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    resultDesc: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
});
