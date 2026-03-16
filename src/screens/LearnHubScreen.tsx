// Learn Hub Screen — Glossary and Chart Pattern guides
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, SectionList, TouchableOpacity, ScrollView, StatusBar, Modal, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../constants/theme';
import { mockGlossary } from '../data/mockData';
import { GlossaryTerm } from '../types';

export default function LearnHubScreen() {
    const navigation = useNavigation<any>();
    const [activeTab, setActiveTab] = useState<'basics' | 'technical' | 'fundamental' | 'patterns'>('basics');
    const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const tabs = [
        { id: 'basics', label: 'Basics' },
        { id: 'technical', label: 'Technical' },
        { id: 'fundamental', label: 'Fundamental' },
        { id: 'patterns', label: 'Patterns' }
    ];

    // Group terms by initial letter for smooth SectionList rendering
    const getSectionedData = () => {
        const filtered = mockGlossary.filter(item => {
            const matchesTab = item.category === activeTab;
            const matchesSearch = item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.shortDefinition.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesTab && (searchQuery.length === 0 || matchesSearch);
        });
        const groups: { [key: string]: GlossaryTerm[] } = {};

        filtered.forEach(term => {
            const char = term.term.charAt(0).toUpperCase();
            if (!groups[char]) groups[char] = [];
            groups[char].push(term);
        });

        return Object.keys(groups)
            .sort()
            .map(char => ({
                title: char,
                data: groups[char].sort((a, b) => a.term.localeCompare(b.term))
            }));
    };

    const renderTermRow = ({ item, index, section }: any) => {
        const isLast = index === section.data.length - 1;
        return (
            <TouchableOpacity
                style={[styles.termRow, isLast && styles.termRowLast]}
                onPress={() => setSelectedTerm(item)}
            >
                <View style={styles.termContent}>
                    <Text style={styles.termTitle}>{item.term}</Text>
                    <Text style={styles.termShort} numberOfLines={2}>{item.shortDefinition}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
        );
    };

    const renderDetailModal = () => {
        if (!selectedTerm) return null;

        return (
            <Modal visible={true} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.badgeContainer}>
                                <Text style={styles.badgeText}>{selectedTerm.category.toUpperCase()}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setSelectedTerm(null)}>
                                <Ionicons name="close" size={24} color={Colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.modalScroll}>
                            <Text style={styles.modalTerm}>{selectedTerm.term}</Text>

                            <View style={styles.definitionBox}>
                                <Text style={styles.definitionText}>{selectedTerm.fullExplanation}</Text>
                            </View>

                            <View style={styles.exampleBox}>
                                <View style={styles.exampleHeader}>
                                    <Ionicons name="bulb-outline" size={18} color={Colors.primary} />
                                    <Text style={styles.exampleTitle}>Example</Text>
                                </View>
                                <Text style={styles.exampleText}>{selectedTerm.example}</Text>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Learn Hub</Text>
                    <Text style={styles.headerSubtitle}>Master the market</Text>
                </View>
                <View style={{ width: 24 }} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={Colors.textTertiary} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search terms..."
                    placeholderTextColor={Colors.textTertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Tabs */}
            <View style={styles.tabsWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
                    {tabs.map(tab => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                            onPress={() => setActiveTab(tab.id as any)}
                        >
                            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* List */}
            <View style={styles.listWrapper}>
                <SectionList
                    sections={getSectionedData()}
                    keyExtractor={(item) => item.id}
                    renderItem={renderTermRow}
                    renderSectionHeader={({ section: { title } }) => (
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{title}</Text>
                        </View>
                    )}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    stickySectionHeadersEnabled={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="library-outline" size={48} color={Colors.textTertiary} />
                            <Text style={styles.emptyText}>No content available yet</Text>
                        </View>
                    }
                />
            </View>

            {renderDetailModal()}
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
    headerSubtitle: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.md,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        height: 48,
    },
    searchInput: {
        flex: 1,
        color: Colors.textPrimary,
        fontSize: FontSize.md,
        marginLeft: Spacing.sm,
    },
    tabsWrapper: {
        marginBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    tabsContainer: {
        paddingHorizontal: Spacing.xl,
        gap: Spacing.md,
    },
    tab: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: Colors.primary,
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
    listWrapper: {
        flex: 1,
        paddingHorizontal: Spacing.xl,
    },
    listContent: {
        paddingBottom: Spacing.xl * 2,
    },
    sectionHeader: {
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
        paddingVertical: Spacing.xs,
    },
    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.primary,
    },
    termRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    termRowLast: {
        borderBottomWidth: 0,
    },
    termContent: {
        flex: 1,
        marginRight: Spacing.md,
    },
    termTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    termShort: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    emptyState: {
        alignItems: 'center',
        padding: Spacing.xxl,
        gap: Spacing.md,
    },
    emptyText: {
        fontSize: FontSize.md,
        color: Colors.textTertiary,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: Colors.overlay,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        minHeight: '60%',
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    badgeContainer: {
        backgroundColor: Colors.primaryGlow,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    badgeText: {
        fontSize: FontSize.xs - 2,
        fontWeight: FontWeight.bold,
        color: Colors.primary,
    },
    modalScroll: {
        padding: Spacing.xl,
        paddingBottom: Spacing.xxl,
    },
    modalTerm: {
        fontSize: 28,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.xl,
    },
    definitionBox: {
        marginBottom: Spacing.xl,
    },
    definitionText: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        lineHeight: 24,
    },
    exampleBox: {
        backgroundColor: Colors.surfaceLight,
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        borderLeftWidth: 3,
        borderLeftColor: Colors.primary,
    },
    exampleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    exampleTitle: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: Colors.primary,
    },
    exampleText: {
        fontSize: FontSize.sm,
        color: Colors.textPrimary,
        lineHeight: 22,
        fontStyle: 'italic',
    },
});
