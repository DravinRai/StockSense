// HOW TO USE — Drop this into your existing StockDetailScreen.tsx
// Just copy the relevant parts into your existing file.

import React, { useEffect } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import AIInsightsCard from "../components/AIInsightsCard";
import { useStockAnalysis } from "../hooks/useStockAnalysis";
import { StockData, UserHolding } from "../constants/analysisPrompts";

// ── Example: Your existing stock detail screen ──────────────────────────────
// Assuming you already have stockInfo (from Yahoo Finance) and holdingInfo
// (from your portfolio data), just add this section to your screen.

const StockDetailScreen = ({ stockInfo, holdingInfo }: any) => {
  const { analysis, loading, error, fetchAnalysis } = useStockAnalysis();

  // ── Build StockData from your Yahoo Finance response ──
  const stockData: StockData = {
    name: stockInfo.longName ?? stockInfo.shortName,
    symbol: stockInfo.symbol,
    currentPrice: stockInfo.regularMarketPrice,
    change: stockInfo.regularMarketChange,
    changePercent: stockInfo.regularMarketChangePercent,
    open: stockInfo.regularMarketOpen,
    dayHigh: stockInfo.regularMarketDayHigh,
    dayLow: stockInfo.regularMarketDayLow,
    high52w: stockInfo.fiftyTwoWeekHigh,
    low52w: stockInfo.fiftyTwoWeekLow,
    volume: stockInfo.regularMarketVolume,
    avgVolume: stockInfo.averageDailyVolume3Month,
    marketCap: stockInfo.marketCap,
    pe: stockInfo.trailingPE,
    sector: stockInfo.sector,
    // Optional: pass current Nifty level for better context
    niftyLevel: 23500,
    niftyChangePercent: -0.5,
  };

  // ── Build UserHolding if the user holds this stock ──
  const userHolding: UserHolding | null = holdingInfo
    ? {
        shares: holdingInfo.quantity,
        avgPrice: holdingInfo.averagePrice,
        currentValue: holdingInfo.quantity * stockInfo.regularMarketPrice,
        investedValue: holdingInfo.quantity * holdingInfo.averagePrice,
        pnl:
          holdingInfo.quantity * stockInfo.regularMarketPrice -
          holdingInfo.quantity * holdingInfo.averagePrice,
        pnlPercent:
          ((stockInfo.regularMarketPrice - holdingInfo.averagePrice) /
            holdingInfo.averagePrice) *
          100,
      }
    : null;

  // Auto-fetch on mount (or remove this if you want manual trigger only)
  useEffect(() => {
    fetchAnalysis(stockData, userHolding);
  }, [stockInfo.symbol]);

  return (
    <View style={{ flex: 1, backgroundColor: "#0D0D0D" }}>
      {/* ... your existing stock header, chart etc ... */}

      {/* ── Refresh Button ── */}
      <TouchableOpacity
        style={styles.refreshBtn}
        onPress={() => fetchAnalysis(stockData, userHolding)}
        disabled={loading}
      >
        <Text style={styles.refreshText}>
          {loading ? "Analysing..." : "🔄 Refresh Analysis"}
        </Text>
      </TouchableOpacity>

      {/* ── AI Insights Card ── */}
      <AIInsightsCard
        analysis={analysis}
        loading={loading}
        error={error}
        onRetry={() => fetchAnalysis(stockData, userHolding)}
        onAskQuestion={(question) => {
          // Optional: handle follow-up questions
          // You can open a chat modal or pass to another screen
          console.log("User asked:", question);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  refreshBtn: {
    marginHorizontal: 12,
    marginTop: 8,
    padding: 12,
    backgroundColor: "#141414",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2C2C2C",
    alignItems: "center",
  },
  refreshText: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default StockDetailScreen;
