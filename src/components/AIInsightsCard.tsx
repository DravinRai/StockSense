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
import { StockAnalysis } from "../services/aiAnalysisService";

// ─── Color Map ───────────────────────────────────────────────────────────────
const VERDICT_COLORS = {
  green:  { bg: "#0a1f12", border: "#00C853", text: "#00E676", badge: "#00C853" },
  red:    { bg: "#1f0a0a", border: "#FF1744", text: "#FF5252", badge: "#FF1744" },
  orange: { bg: "#1f1200", border: "#FF6D00", text: "#FF9100", badge: "#FF6D00" },
  blue:   { bg: "#0a1020", border: "#2979FF", text: "#448AFF", badge: "#2979FF" },
};

const RISK_COLORS: Record<string, string> = {
  Low: "#00C853",
  Medium: "#FF6D00",
  High: "#FF1744",
  "Very High": "#D50000",
};

const SIGNAL_COLORS: Record<string, string> = {
  Bullish: "#00C853",
  Bearish: "#FF1744",
  Neutral: "#888",
  Strong: "#00C853",
  Moderate: "#FF6D00",
  Weak: "#FF1744",
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
  accentColor = "#333",
}: {
  title: string;
  children: React.ReactNode;
  accentColor?: string;
}) => (
  <View style={[styles.sectionCard, { borderLeftColor: accentColor }]}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const PriceBox = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <View style={[styles.priceBox, { borderColor: color + "44", backgroundColor: color + "12" }]}>
    <Text style={[styles.priceBoxValue, { color }]}>₹{value}</Text>
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
}

const AIInsightsCard: React.FC<AIInsightsCardProps> = ({
  analysis,
  loading,
  error,
  onAskQuestion,
  onRetry,
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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>✨ AI Insights</Text>
          <View style={styles.updatingBadge}>
            <ActivityIndicator size="small" color="#FF9100" />
            <Text style={styles.updatingText}>Analysing...</Text>
          </View>
        </View>
        <LoadingSkeleton />
      </View>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <View style={styles.container}>
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
    );
  }

  // ── Empty State ──
  if (!analysis) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>✨ AI Insights</Text>
        </View>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Tap the refresh button to generate AI analysis</Text>
        </View>
      </View>
    );
  }

  const colors = VERDICT_COLORS[analysis.verdictColor] ?? VERDICT_COLORS.blue;
  const { priceTargets: pt } = analysis;

  // ── Full Analysis ──
  return (
    <Animated.ScrollView
      style={[styles.container, { opacity: fadeAnim }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>✨ AI Insights</Text>
        <Text style={styles.updatedText}>Just now</Text>
      </View>

      {/* ── VERDICT BANNER ── */}
      <View style={[styles.verdictBanner, { backgroundColor: colors.bg, borderColor: colors.border }]}>
        <View style={styles.verdictTopRow}>
          <View style={[styles.verdictBadge, { backgroundColor: colors.badge }]}>
            <Text style={styles.verdictBadgeText}>{analysis.verdict}</Text>
          </View>
          <View style={styles.signalsRow}>
            <View style={styles.signalItem}>
              <Text style={styles.signalLabel}>Technical</Text>
              <SignalDot signal={analysis.technicalSignal} />
            </View>
            <View style={styles.signalItem}>
              <Text style={styles.signalLabel}>Fundamental</Text>
              <SignalDot signal={analysis.fundamentalSignal} />
            </View>
          </View>
        </View>

        {/* Tags */}
        <View style={styles.tagsRow}>
          <Tag label={analysis.sentimentTag} color={colors.text} />
          <Tag label={`Risk: ${analysis.riskLevel}`} color={RISK_COLORS[analysis.riskLevel] ?? "#888"} />
          <Tag label={analysis.timeframe} color="#888" />
          <Tag label={`${analysis.confidence} Confidence`} color="#888" />
        </View>

        {/* Summary */}
        <Text style={styles.summaryText}>{analysis.summary}</Text>
      </View>

      {/* ── INVEST NOW BOX ── */}
      <View
        style={[
          styles.investBox,
          {
            borderColor: analysis.investSuggestion.shouldInvest ? "#00C853" : "#FF1744",
            backgroundColor: analysis.investSuggestion.shouldInvest ? "#0a1f12" : "#1f0a0a",
          },
        ]}
      >
        <Text style={[styles.investTitle, { color: analysis.investSuggestion.shouldInvest ? "#00E676" : "#FF5252" }]}>
          {analysis.investSuggestion.shouldInvest ? "✅ Invest Today?" : "🚫 Invest Today?"}
        </Text>
        {analysis.investSuggestion.shouldInvest ? (
          <>
            <Text style={styles.investAmount}>{analysis.investSuggestion.amount}</Text>
            <Text style={styles.investEntry}>Entry: {analysis.investSuggestion.entryPrice}</Text>
          </>
        ) : (
          <Text style={styles.investAmount}>Not recommended right now</Text>
        )}
        <Text style={styles.investReason}>{analysis.investSuggestion.reason}</Text>
      </View>

      {/* ── WHAT TO DO NOW ── */}
      <SectionCard title="🎯 What To Do Now" accentColor="#FF9100">
        <Text style={styles.bodyText}>{analysis.whatToDoNow}</Text>
      </SectionCard>

      {/* ── PRICE TARGETS ── */}
      <SectionCard title="📊 Key Price Levels" accentColor="#2979FF">
        <View style={styles.priceGrid}>
          <PriceBox label="Support 1" value={pt.support1} color="#FF9100" />
          <PriceBox label="Support 2" value={pt.support2} color="#FF6D00" />
          <PriceBox label="Resistance 1" value={pt.resistance1} color="#00C853" />
          <PriceBox label="Resistance 2" value={pt.resistance2} color="#00E676" />
          <PriceBox label="Stop Loss 🛑" value={pt.stopLoss} color="#FF1744" />
          <PriceBox label="Target 1M 🎯" value={pt.target1Month} color="#448AFF" />
          <PriceBox label="Target 3M 🚀" value={pt.target3Month} color="#7C4DFF" />
        </View>
      </SectionCard>

      {/* ── KEY FACTORS ── */}
      <SectionCard title="💡 Key Factors" accentColor="#7C4DFF">
        {analysis.keyFactors.map((factor, i) => (
          <View key={i} style={styles.factorRow}>
            <Text style={styles.factorIcon}>{factor.icon}</Text>
            <View style={styles.factorContent}>
              <Text style={styles.factorLabel}>{factor.label}</Text>
              <Text style={styles.factorDetail}>{factor.detail}</Text>
            </View>
          </View>
        ))}
      </SectionCard>

      {/* ── VERDICT REASON ── */}
      <SectionCard title="📝 Full Analysis" accentColor={colors.border}>
        <Text style={styles.bodyText}>{analysis.verdictReason}</Text>
      </SectionCard>

      {/* ── CATALYSTS ── */}
      {analysis.catalysts?.length > 0 && (
        <SectionCard title="🚀 Upside Catalysts" accentColor="#00C853">
          {analysis.catalysts.map((c, i) => (
            <Text key={i} style={[styles.listItem, { color: "#B9F6CA" }]}>
              {"▲  "}{c}
            </Text>
          ))}
        </SectionCard>
      )}

      {/* ── RISKS ── */}
      <SectionCard title="⚠️ Key Risks" accentColor="#FF1744">
        {analysis.risks.map((r, i) => (
          <Text key={i} style={[styles.listItem, { color: "#FFCDD2" }]}>
            {"▼  "}{r}
          </Text>
        ))}
      </SectionCard>

      {/* ── ASK AI ── */}
      {onAskQuestion && (
        <View style={styles.askBox}>
          <Text style={styles.askTitle}>Ask AI anything about this stock</Text>
          <View style={styles.askInputRow}>
            <TextInput
              style={styles.askInput}
              placeholder="e.g. Should I average down?"
              placeholderTextColor="#555"
              value={question}
              onChangeText={setQuestion}
              onSubmitEditing={() => {
                if (question.trim()) {
                  onAskQuestion(question.trim());
                  setQuestion("");
                }
              }}
            />
            <TouchableOpacity
              style={[styles.askBtn, { opacity: question.trim() ? 1 : 0.4 }]}
              onPress={() => {
                if (question.trim()) {
                  onAskQuestion(question.trim());
                  setQuestion("");
                }
              }}
            >
              <Text style={styles.askBtnText}>→</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Disclaimer */}
      <Text style={styles.disclaimer}>
        ⚠️ AI-generated analysis. Not SEBI registered investment advice. Do your own research before investing.
      </Text>
    </Animated.ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  updatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1A1200",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FF9100",
  },
  updatingText: {
    color: "#FF9100",
    fontSize: 12,
    fontWeight: "600",
  },
  updatedText: {
    color: "#555",
    fontSize: 12,
  },

  // Verdict Banner
  verdictBanner: {
    margin: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
  },
  verdictTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  verdictBadge: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  verdictBadgeText: {
    color: "#000",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  signalsRow: {
    flexDirection: "row",
    gap: 14,
  },
  signalItem: {
    alignItems: "center",
    gap: 3,
  },
  signalLabel: {
    color: "#666",
    fontSize: 10,
    fontWeight: "500",
  },
  signalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  signalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  signalText: {
    fontSize: 11,
    fontWeight: "700",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  summaryText: {
    color: "#CCC",
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: "400",
    marginTop: 2,
  },

  // Invest Box
  investBox: {
    marginHorizontal: 12,
    marginBottom: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 4,
  },
  investTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  investAmount: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "800",
  },
  investEntry: {
    color: "#AAA",
    fontSize: 13,
    fontWeight: "600",
  },
  investReason: {
    color: "#888",
    fontSize: 12,
    marginTop: 4,
  },

  // Section Card
  sectionCard: {
    backgroundColor: "#141414",
    marginHorizontal: 12,
    marginBottom: 10,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 3,
    gap: 8,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  bodyText: {
    color: "#BBBBBB",
    fontSize: 13.5,
    lineHeight: 21,
  },

  // Price Grid
  priceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  priceBox: {
    width: "30%",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    gap: 3,
  },
  priceBoxValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  priceBoxLabel: {
    color: "#888",
    fontSize: 10,
    textAlign: "center",
  },

  // Key Factors
  factorRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E1E",
  },
  factorIcon: {
    fontSize: 20,
    width: 28,
    textAlign: "center",
  },
  factorContent: {
    flex: 1,
  },
  factorLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  factorDetail: {
    color: "#999",
    fontSize: 12,
    lineHeight: 17,
  },

  // Lists
  listItem: {
    fontSize: 13,
    lineHeight: 20,
    paddingVertical: 2,
  },

  // Ask Box
  askBox: {
    backgroundColor: "#141414",
    marginHorizontal: 12,
    marginBottom: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2C2C2C",
  },
  askTitle: {
    color: "#888",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 10,
  },
  askInputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  askInput: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#FFF",
    fontSize: 13,
    borderWidth: 1,
    borderColor: "#2C2C2C",
  },
  askBtn: {
    backgroundColor: "#00C853",
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  askBtnText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "900",
  },

  // Error / Empty
  errorBox: {
    margin: 16,
    padding: 20,
    backgroundColor: "#1f0a0a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FF1744",
    alignItems: "center",
    gap: 8,
  },
  errorIcon: { fontSize: 28 },
  errorText: { color: "#FF5252", fontSize: 13, textAlign: "center", lineHeight: 19 },
  retryBtn: {
    marginTop: 8,
    backgroundColor: "#FF1744",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
  emptyBox: {
    margin: 16,
    padding: 20,
    alignItems: "center",
  },
  emptyText: { color: "#555", fontSize: 13, textAlign: "center" },

  // Disclaimer
  disclaimer: {
    color: "#444",
    fontSize: 11,
    textAlign: "center",
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 24,
    lineHeight: 16,
  },
});

export default AIInsightsCard;
