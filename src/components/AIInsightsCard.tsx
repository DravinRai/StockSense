import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LoadingShimmer from './common/LoadingShimmer';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../constants/theme';
import {
  askAIFollowUp,
  AIChatMessage,
  AIInsight,
  StockDataForAI,
} from '../services/aiInsightsService';

interface AIInsightsCardProps {
  insight: AIInsight | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  marketOpen: boolean;
  stockData: StockDataForAI;
  onRefresh: () => void;
  onRetry: () => void;
}

const getVerdictColor = (verdict: AIInsight['verdict']) => {
  if (verdict === 'Bullish') return '#00B386';
  if (verdict === 'Bearish') return '#E74C3C';
  return '#8C8C8C';
};

const getRiskColor = (risk: AIInsight['risk']) => {
  if (risk === 'Low') return '#00B386';
  if (risk === 'Medium') return '#F5A623';
  return '#E74C3C';
};

const getRelativeTime = (timestamp: number | null) => {
  if (!timestamp) return 'Updated just now';
  const mins = Math.max(1, Math.floor((Date.now() - timestamp) / 60000));
  if (mins < 60) return `Updated ${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  return `Updated ${hours}h ago`;
};

const formatUpside = (current: number, target: number) => {
  const pct = ((target - current) / current) * 100;
  const direction = pct >= 0 ? 'upside' : 'downside';
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% ${direction}`;
};

export default function AIInsightsCard({
  insight,
  isLoading,
  error,
  lastUpdated,
  marketOpen,
  stockData,
  onRefresh,
  onRetry,
}: AIInsightsCardProps) {
  const [question, setQuestion] = useState('');
  const [conversationHistory, setConversationHistory] = useState<AIChatMessage[]>([]);
  const [limitMessage, setLimitMessage] = useState('');
  const [askLoading, setAskLoading] = useState(false);
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    if (!askLoading) return;
    const id = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 350);
    return () => clearInterval(id);
  }, [askLoading]);

  useEffect(() => {
    setConversationHistory([]);
    setLimitMessage('');
    setQuestion('');
  }, [stockData.symbol]);

  const askPlaceholder = useMemo(() => '.'.repeat(dotCount), [dotCount]);

  const handleAsk = async () => {
    const userQuestion = question.trim();
    if (!userQuestion || askLoading) return;

    const askedCount = conversationHistory.filter((msg) => msg.role === 'user').length;
    if (askedCount >= 5) {
      setLimitMessage('Refresh for new analysis');
      return;
    }

    setLimitMessage('');
    const nextHistory: AIChatMessage[] = [
      ...conversationHistory,
      { role: 'user', content: userQuestion },
    ];
    setConversationHistory(nextHistory);
    setQuestion('');
    setAskLoading(true);

    try {
      const response = await askAIFollowUp(stockData, conversationHistory, userQuestion);
      setConversationHistory((prev) => [...prev, { role: 'assistant', content: response }]);
    } catch {
      setConversationHistory((prev) => [
        ...prev,
        { role: 'assistant', content: 'Unable to fetch response right now. Please try again.' },
      ]);
    } finally {
      setAskLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.card}>
        <LoadingShimmer width={120} height={18} style={styles.skeletonGap} />
        <LoadingShimmer width={'68%'} height={24} style={styles.skeletonGap} />
        <LoadingShimmer width={'100%'} height={16} style={styles.skeletonGap} />
        <LoadingShimmer width={'92%'} height={16} style={styles.skeletonGap} />
      </View>
    );
  }

  if (error || !insight) {
    return (
      <View style={styles.card}>
        <Text style={styles.errorTitle}>Unable to load AI insights</Text>
        {!!error && <Text style={styles.errorSubtext}>{error}</Text>}
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>AI Insights ✨</Text>
        <View style={styles.headerRight}>
          <Text style={styles.timestamp}>{getRelativeTime(lastUpdated)}</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.verdictRow}>
        <View style={[styles.verdictPill, { backgroundColor: getVerdictColor(insight.verdict) }]}>
          <Text style={styles.verdictText}>{insight.verdict}</Text>
        </View>
        <Text style={styles.confidenceText}>
          {insight.confidence === 'High' ? 'High confidence' : insight.confidence}
        </Text>
      </View>

      <Text style={styles.summary}>{insight.summary}</Text>

      <View style={styles.keyPointsWrap}>
        {insight.keyPoints.slice(0, 3).map((point, index) => (
          <Text key={`${point}-${index}`} style={styles.keyPoint}>
            {'\u2022'} {point}
          </Text>
        ))}
      </View>

      <View style={styles.tagsRow}>
        <View style={[styles.riskTag, { backgroundColor: `${getRiskColor(insight.risk)}20` }]}>
          <Text style={[styles.riskText, { color: getRiskColor(insight.risk) }]}>Risk: {insight.risk}</Text>
        </View>
        <View style={styles.horizonTag}>
          <Text style={styles.horizonText}>{insight.timeHorizon}</Text>
        </View>
      </View>

      {typeof insight.targetPrice === 'number' && (
        <View style={styles.targetRow}>
          <Text style={styles.targetPrice}>🎯 Target Rs {insight.targetPrice.toFixed(2)}</Text>
          <Text style={styles.upsideText}>({formatUpside(stockData.price, insight.targetPrice)})</Text>
        </View>
      )}

      {!marketOpen && (
        <View style={styles.staleBanner}>
          <Text style={styles.staleText}>⚠️ Based on last closing data</Text>
        </View>
      )}

      <View style={styles.askBox}>
        <View style={styles.askInputRow}>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder="Ask AI anything..."
            style={styles.askInput}
            placeholderTextColor={Colors.textTertiary}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleAsk} disabled={askLoading}>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {!!limitMessage && <Text style={styles.limitText}>{limitMessage}</Text>}

        <View style={styles.threadWrap}>
          {conversationHistory.map((msg, index) => (
            <View
              key={`${msg.role}-${index}`}
              style={[
                styles.messageRow,
                msg.role === 'user' ? styles.userRow : styles.assistantRow,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    msg.role === 'user' ? styles.userBubbleText : styles.assistantBubbleText,
                  ]}
                >
                  {msg.content}
                </Text>
              </View>
            </View>
          ))}

          {askLoading && (
            <View style={[styles.messageRow, styles.assistantRow]}>
              <View style={[styles.bubble, styles.assistantBubble]}>
                <Text style={[styles.bubbleText, styles.assistantBubbleText]}>
                  Getting AI analysis{askPlaceholder}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.disclaimer}>
        AI-generated analysis. Not SEBI registered investment advice. Do your own research.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  skeletonGap: {
    marginBottom: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  refreshBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verdictRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  verdictPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  verdictText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: FontWeight.bold,
  },
  confidenceText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  summary: {
    color: '#666666',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  keyPointsWrap: {
    marginBottom: Spacing.md,
    gap: 4,
  },
  keyPoint: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textPrimary,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  riskTag: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  riskText: {
    fontSize: 12,
    fontWeight: FontWeight.semibold,
  },
  horizonTag: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: Colors.surfaceLight,
  },
  horizonText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
    gap: 4,
  },
  targetPrice: {
    color: Colors.gain,
    fontSize: 14,
    fontWeight: FontWeight.bold,
  },
  upsideText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  staleBanner: {
    marginTop: 2,
    marginBottom: Spacing.sm,
    backgroundColor: '#FFF7D6',
    borderRadius: BorderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  staleText: {
    color: '#8A6D1D',
    fontSize: 12,
    fontWeight: FontWeight.semibold,
  },
  askBox: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  askInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  askInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.gain,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDots: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    paddingHorizontal: 2,
  },
  limitText: {
    marginTop: Spacing.xs,
    marginLeft: 4,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  threadWrap: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  messageRow: {
    width: '100%',
    flexDirection: 'row',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '84%',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  userBubble: {
    backgroundColor: Colors.gain,
  },
  assistantBubble: {
    backgroundColor: Colors.surfaceLight,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  userBubbleText: {
    color: Colors.white,
  },
  assistantBubbleText: {
    color: Colors.textPrimary,
  },
  disclaimer: {
    fontSize: 11,
    fontStyle: 'italic',
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  errorTitle: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    fontWeight: FontWeight.semibold,
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.gain,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: 12,
  },
  errorSubtext: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
});
