// components/AIInsightsCard.tsx

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StockAnalysis } from "../services/aiAnalysisService";
import { Colors } from "../constants/theme";

// ─── Color Map ───────────────────────────────────────────────────────────────
const VERDICT_COLORS = {
  green:  { bg: Colors.background, border: Colors.gain, text: Colors.gain, badge: Colors.white },
  red:    { bg: Colors.background, border: Colors.loss, text: Colors.loss, badge: Colors.white },
  orange: { bg: Colors.background, border: Colors.warning, text: Colors.warning, badge: Colors.white },
  blue:   { bg: Colors.background, border: Colors.info, text: Colors.info, badge: Colors.white },
};

const RISK_COLORS: Record<string, string> = {
  Low: Colors.gain,
  Medium: Colors.warning,
  High: Colors.loss,
  "Very High": Colors.loss,
};

const SIGNAL_COLORS: Record<string, string> = {
  Bullish: Colors.gain,
  Bearish: Colors.loss,
  Neutral: Colors.textTertiary,
  Strong: Colors.gain,
  Moderate: Colors.warning,
  Weak: Colors.loss,
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const Tag = ({ label, color }: { label: string; color: string }) => (
  <View style={[styles.tag, { borderColor: color + "66", backgroundColor: color + "18" }]}>
    <Text style={[styles.tagText, { color }]}>{label}</Text>
  </View>
);

const SectionCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.sectionCard}>
    <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
    {children}
  </View>
);

const PriceBox = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) => (
  <View style={styles.priceBox}>
    <Text style={[styles.priceBoxValue, { color }]}>{typeof value === 'number' ? `₹${value}` : value}</Text>
    <Text style={styles.priceBoxLabel}>{label}</Text>
  </View>
);

const SignalDot = ({ signal }: { signal: string }) => (
  <View style={styles.signalRow}>
    <View style={[styles.signalDot, { backgroundColor: SIGNAL_COLORS[signal] ?? "#888" }]} />
    <Text style={[styles.signalText, { color: SIGNAL_COLORS[signal] ?? "#888" }]}>{signal}</Text>
  </View>
);

const SkeletonBlock = ({ width = "100%", height = 16, mb = 8 }: any) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={{
        width,
        height,
        backgroundColor: "#333",
        borderRadius: 6,
        marginBottom: mb,
        opacity,
      }}
    />
  );
};

const LoadingSkeleton = () => (
  <View style={{ padding: 16, gap: 12 }}>
    <View style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
      <SkeletonBlock width={80} height={36} />
      <SkeletonBlock width={100} height={20} />
      <SkeletonBlock width={80} height={20} />
    </View>
    <SkeletonBlock height={60} mb={12} />
    <SkeletonBlock height={20} width="60%" />
    <SkeletonBlock height={16} />
    <SkeletonBlock height={16} width="80%" />
    <SkeletonBlock height={16} width="90%" />
    <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
      {[1, 2, 3, 4].map((i) => <SkeletonBlock key={i} width={75} height={60} />)}
    </View>
    <SkeletonBlock height={16} mt={12} />
    <SkeletonBlock height={16} width="75%" />
    <SkeletonBlock height={16} width="85%" />
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────

interface AIInsightsCardProps {
  analysis: StockAnalysis | null;
  loading: boolean;
  error: string | null;
  onAskQuestion?: (question: string) => void;
  onRetry?: () => void;
  onRefresh?: () => void;
}

const AIInsightsCard: React.FC<AIInsightsCardProps> = ({
  analysis,
  loading,
  error,
  onAskQuestion,
  onRetry,
  onRefresh,
}) => {
  const [question, setQuestion] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (analysis && !loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [analysis, loading]);

  // ── Loading State ──
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.cardContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>✨ AI Insights</Text>
            <View style={styles.updatingBadge}>
              <ActivityIndicator size="small" color="#FF9100" />
              <Text style={styles.updatingText}>Analysing...</Text>
            </View>
          </View>
          <LoadingSkeleton />
        </View>
      </View>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.cardContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>✨ AI Insights</Text>
          </View>
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            {onRetry && (
              <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  // ── Empty State ──
  if (!analysis) {
    return (
      <View style={styles.container}>
        <View style={styles.cardContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>✨ AI Insights</Text>
          </View>
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Tap the refresh button to generate AI analysis</Text>
          </View>
        </View>
      </View>
    );
  }

  const colors = VERDICT_COLORS[analysis.verdictColor] ?? VERDICT_COLORS.blue;
  const { priceTargets: pt } = analysis;

  // ── Full Analysis ──
  return (
    <View style={styles.container}>
      <Animated.ScrollView
        style={{ opacity: fadeAnim, flex: 1 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.cardContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.headerTitle}>✨ AI Insights</Text>
              <Text style={styles.updatedText}>Just now</Text>
            </View>
            {onRefresh && (
              <TouchableOpacity onPress={onRefresh} disabled={loading} style={{ padding: 4 }}>
                <ActivityIndicator size="small" color={Colors.textTertiary} animating={loading} style={{ position: 'absolute' }} />
                <Ionicons name="refresh" size={18} color={Colors.textTertiary} style={{ opacity: loading ? 0 : 1 }} />
              </TouchableOpacity>
            )}
          </View>

          {/* ── VERDICT BANNER ── */}
          <View style={[styles.verdictBanner, { backgroundColor: colors.bg, borderColor: colors.border }]}>
            <View style={styles.verdictTopRow}>
              <View style={[styles.verdictBadge, { backgroundColor: colors.badge, borderColor: colors.border, borderWidth: 1 }]}>
                <Text style={[styles.verdictBadgeText, { color: colors.text }]}>{analysis.verdict}</Text>
              </View>
              <Tag label={analysis.sentimentTag} color={colors.text} />
            </View>
            <Text style={styles.summaryText}>{analysis.summary}</Text>
          </View>

          {/* ── YOUR SITUATION ── */}
          <SectionCard title="YOUR SITUATION">
            <View style={styles.priceGrid}>
          <PriceBox label="Avg Price" value={analysis.userSituation.avgPrice} color={Colors.textPrimary} />
          <PriceBox label="Current" value={analysis.userSituation.currentPrice} color={Colors.textPrimary} />
          <PriceBox label="P&L %" value={`${analysis.userSituation.pnlPercent}%`} color={analysis.userSituation.pnlPercent >= 0 ? Colors.gain : Colors.loss} />
          <PriceBox label="52W H/L" value={`${analysis.userSituation.high52w}/${analysis.userSituation.low52w}`} color={Colors.grey} />
            </View>
          </SectionCard>

          {/* ── SIGNALS ── */}
          <View style={styles.signalsRowBanner}>
            <View style={styles.signalBannerItem}>
              <Text style={styles.signalBannerLabel}>TECHNICAL</Text>
              <SignalDot signal={analysis.technicalSignal} />
            </View>
            <View style={styles.signalBannerItem}>
              <Text style={styles.signalBannerLabel}>FUNDAMENTAL</Text>
              <SignalDot signal={analysis.fundamentalSignal} />
            </View>
          </View>

          {/* ── INVEST NOW BOX ── */}
          <View
            style={[
              styles.investBox,
              {
                borderLeftColor: "#111111",
              },
            ]}
          >
        <Text style={[styles.investTitle, { color: analysis.investSuggestion.shouldInvest ? Colors.gain : Colors.loss }]}>
          {analysis.investSuggestion.shouldInvest ? "INVEST" : "AVOID"}
        </Text>
            {analysis.investSuggestion.shouldInvest ? (
              <View style={styles.investDetailRow}>
                <Text style={styles.investAmount}>{analysis.investSuggestion.amount}</Text>
                <Text style={styles.investEntry}> @ {analysis.investSuggestion.entryPrice}</Text>
              </View>
            ) : (
              <Text style={styles.investAmount}>Not recommended right now</Text>
            )}
          </View>

          {/* ── KEY INSIGHT ── */}
          <View style={styles.keyInsightBox}>
            <Text style={styles.keyInsightTitle}>{analysis.keyInsightTitle}</Text>
            <Text style={styles.keyInsightBody}>{analysis.keyInsightBody}</Text>
          </View>

          {/* ── BULLS vs BEARS ── */}
          <SectionCard title="BULLS vs BEARS">
            <View style={styles.bullsBearsContainer}>
              <View style={styles.bullsColumn}>
                <Text style={styles.bullsHeader}>BULLS SAY</Text>
                {analysis.bullsBears.bulls.map((b, i) => (
                  <View key={`bull-${i}`} style={styles.bullBearItem}>
                    <Text style={styles.bullBearIcon}>✓</Text>
                    <Text style={styles.bullText}>{b}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.bearsColumn}>
                <Text style={styles.bearsHeader}>BEARS SAY</Text>
                {analysis.bullsBears.bears.map((b, i) => (
                  <View key={`bear-${i}`} style={styles.bullBearItem}>
                    <Text style={styles.bullBearIcon}>✗</Text>
                    <Text style={styles.bearText}>{b}</Text>
                  </View>
                ))}
              </View>
            </View>
          </SectionCard>

          {/* ── PRICE SCENARIOS ── */}
          <SectionCard title="PRICE SCENARIOS">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {analysis.priceScenarios.map((sc, i) => (
                <View key={i} style={[styles.scenarioCard, sc.case === "Bearish" ? styles.scenarioBear : sc.case === "Bullish" ? styles.scenarioBull : styles.scenarioNeutral]}>
                  <Text style={styles.scenarioCase}>{sc.case}</Text>
                  <Text style={styles.scenarioPrice}>{sc.price}</Text>
                  <Text style={styles.scenarioTrigger}>{sc.trigger}</Text>
                </View>
              ))}
            </ScrollView>
          </SectionCard>

          {/* ── ACTION PLAN ── */}
          <SectionCard title="ACTION PLAN">
            {analysis.actionTable.map((act, i) => (
              <View key={i} style={[styles.actionRow, i === analysis.actionTable.length - 1 && { borderBottomWidth: 0 }, { backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F8F8F8' }]}>
                <Text style={styles.actionIcon}>{act.icon}</Text>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionName}>{act.action}</Text>
                  <Text style={styles.actionReason}>{act.reason}</Text>
                </View>
                <Text style={styles.actionPrice}>{act.priceLevel}</Text>
              </View>
            ))}
          </SectionCard>

          {/* ── PRICE TARGETS ── */}
          <SectionCard title="price levels">
            <View style={styles.priceGrid}>
              <PriceBox label="Support 1" value={pt.support1} color="#E65100" />
              <PriceBox label="Support 2" value={pt.support2} color="#E65100" />
              <PriceBox label="Resist 1" value={pt.resistance1} color="#2E7D32" />
              <PriceBox label="Resist 2" value={pt.resistance2} color="#2E7D32" />
              <PriceBox label="Stop Loss" value={pt.stopLoss} color="#C62828" />
              <PriceBox label="Target 1M" value={pt.target1Month} color="#1565C0" />
              <PriceBox label="Target 3M" value={pt.target3Month} color="#1565C0" />
            </View>
          </SectionCard>

          {/* ── KEY FACTORS ── */}
          <SectionCard title="key factors">
            {analysis.keyFactors.map((factor, i) => (
              <View key={i} style={[styles.factorRow, i === analysis.keyFactors.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.factorHeader}>
                  <Text style={styles.factorIcon}>{factor.icon}</Text>
                  <Text style={styles.factorLabel}>{factor.label}</Text>
                </View>
                <Text style={styles.factorDetail}>{factor.detail}</Text>
              </View>
            ))}
          </SectionCard>

          {/* ── RISKS ── */}
          {analysis.risks && analysis.risks.length > 0 && (
            <SectionCard title="key risks">
              {analysis.risks.map((risk, i) => (
                <View key={i} style={[styles.factorRow, i === analysis.risks.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.factorHeader}>
                    <Text style={styles.factorIcon}>⚠️</Text>
                    <Text style={[styles.factorLabel, { color: "#FF5252" }]}>{risk}</Text>
                  </View>
                </View>
              ))}
            </SectionCard>
          )}

          {/* ── FULL ANALYSIS ── */}
          <SectionCard title="analysis">
            <Text style={styles.bodyText}>{analysis.verdictReason}</Text>
          </SectionCard>

          {/* ── BOTTOM LINE ── */}
          <SectionCard title="BOTTOM LINE">
            <Text style={styles.bottomLineText}>{analysis.bottomLine}</Text>
          </SectionCard>

          {/* Disclaimer */}
          <Text style={styles.disclaimer}>
            ⚠️ AI-generated analysis. Not SEBI registered investment advice. Do your own research before investing.
          </Text>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  cardContent: {
    width: "100%",
    paddingVertical: 16,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  updatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  updatingText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  updatedText: {
    color: Colors.lightGrey,
    fontSize: 12,
  },

  // Verdict Banner
  verdictBanner: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
  },
  verdictTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  verdictBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  verdictBadgeText: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  summaryText: {
    color: "#777777",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "400",
    flexShrink: 1,
  },

  // Signals Banner
  signalsRowBanner: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#F8F8F8",
    borderRadius: 4,
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  signalBannerItem: {
    alignItems: "center",
    gap: 4,
  },
  signalBannerLabel: {
    color: "#BBBBBB",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  signalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  signalDot: {
    minWidth: 8,
    height: 8,
    borderRadius: 4,
  },
  signalText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Invest Box
  investBox: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: "#111111",
    backgroundColor: "#F8F8F8",
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  investTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  investDetailRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flex: 1,
    flexWrap: "wrap",
    gap: 4,
  },
  investAmount: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "600",
  },
  investEntry: {
    color: "#666666",
    fontSize: 12,
    fontWeight: "500",
  },

  // Section Card
  sectionCard: {
    backgroundColor: Colors.background,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    color: "#BBBBBB",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2.5,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  bodyText: {
    color: "#666666",
    fontSize: 13,
    lineHeight: 22,
  },

  // Price Grid
  priceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  priceBox: {
    width: "48%",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 4,
    backgroundColor: Colors.white,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priceBoxValue: {
    fontSize: 13,
    fontWeight: "bold",
  },
  priceBoxLabel: {
    color: "#888888",
    fontSize: 10,
    textAlign: "center",
  },

  // Key Factors
  factorRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#F0F0F0",
    gap: 4,
  },
  factorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  factorIcon: {
    fontSize: 14,
  },
  factorLabel: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "600",
  },
  factorDetail: {
    color: "#888888",
    fontSize: 12,
    lineHeight: 16,
    paddingLeft: 20,
  },

  // Lists
  listItem: {
    fontSize: 12.5,
    lineHeight: 18,
    paddingVertical: 2,
    color: "#666666",
  },

  // Error / Empty
  errorBox: {
    padding: 20,
    backgroundColor: "#F8F8F8",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderColor: "#C62828",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
  },
  errorIcon: { fontSize: 24 },
  errorText: { color: "#C62828", fontSize: 12.5, textAlign: "center", lineHeight: 18 },
  retryBtn: {
    marginTop: 8,
    backgroundColor: "#C62828",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryText: { color: "#FFFFFF", fontWeight: "700", fontSize: 12 },
  emptyBox: {
    padding: 20,
    alignItems: "center",
    marginHorizontal: 16,
  },
  emptyText: { color: "#666666", fontSize: 12.5, textAlign: "center" },

  // Disclaimer
  disclaimer: {
    color: "#CCCCCC",
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 24,
    lineHeight: 16,
    paddingHorizontal: 16,
  },

  // NEW STYLES
  keyInsightBox: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#1565C0",
    backgroundColor: "#F8F8F8",
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  keyInsightTitle: {
    color: "#111111",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 6,
  },
  keyInsightBody: {
    color: "#666666",
    fontSize: 13,
    lineHeight: 20,
  },

  bullsBearsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  bullsColumn: {
    flex: 1,
  },
  bearsColumn: {
    flex: 1,
  },
  bullsHeader: {
    color: "#2E7D32",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
  },
  bearsHeader: {
    color: "#C62828",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
  },
  bullBearItem: {
    flexDirection: "row",
    marginBottom: 6,
    gap: 6,
  },
  bullBearIcon: {
    fontSize: 12,
    marginTop: 2,
    color: "#AAAAAA",
  },
  bullText: {
    color: "#2E7D32",
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  bearText: {
    color: "#C62828",
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },

  scenarioCard: {
    width: 140,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  scenarioBear: {
    backgroundColor: "#FFF5F5",
    borderColor: "#C62828",
  },
  scenarioNeutral: {
    backgroundColor: "#F8F8F8",
    borderColor: "#CCCCCC",
  },
  scenarioBull: {
    backgroundColor: "#F0FFF4",
    borderColor: "#2E7D32",
  },
  scenarioCase: {
    color: "#AAAAAA",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  scenarioPrice: {
    color: "#111111",
    fontSize: 15,
    fontWeight: "800",
  },
  scenarioTrigger: {
    color: "#666666",
    fontSize: 11,
    lineHeight: 16,
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: "#F0F0F0",
    gap: 12,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionInfo: {
    flex: 1,
    gap: 2,
  },
  actionName: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "700",
  },
  actionReason: {
    color: "#666666",
    fontSize: 11,
    lineHeight: 16,
  },
  actionPrice: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "bold",
  },
  
  bottomLineText: {
    color: "#666666",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "500",
    fontStyle: "italic",
  },
});

export default AIInsightsCard;
