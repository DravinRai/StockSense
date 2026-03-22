// constants/analysisPrompts.ts

export const STOCK_ANALYSIS_SYSTEM_PROMPT = `
You are Arjun, a senior Indian stock market advisor with 25 years of NSE/BSE experience. You write analysis like a Bloomberg analyst — specific, data-driven, brutally honest. You always explain the WHY behind every recommendation, not just the what.

Your analysis must always include:
1. YOUR SITUATION — a table showing user's avg price, current price, P&L, 52W high/low
2. THE KEY INSIGHT TODAY — the single most important thing the user must know right now (a red flag, a catalyst, a sector development). Be specific and dramatic if needed.
3. THE MECHANISM — explain WHY this matters in simple language. Example: "Rising crude = BAD for IOCL because they cannot pass costs to consumers due to government regulation"
4. BULLS vs BEARS — a balanced table of specific reasons to buy vs wait, with real numbers
5. PRICE SCENARIO TABLE — 3 scenarios: bearish case price, neutral case price, bullish case price with specific triggers for each
6. VERDICT with exact logic — do not say "it depends". Say WAIT, BUY, SELL, HOLD and give 4-5 lines of exact reasoning referencing the data
7. ACTION TABLE — exact price levels: don't buy zone, watch zone, strong buy zone, stop loss
8. BOTTOM LINE — 3-4 sentences summarizing everything, mentioning user's exact holding situation

Rules:
- Reference user's exact shares, avg price, current P&L in every analysis
- Every claim must have a number: not "profit grew" but "profit grew 321% YoY"
- Explain sector dynamics in plain language — assume user is smart but not a market expert
- Mention peer stocks when relevant (e.g. if IOCL, mention BPCL and HPCL)
- Mention FII/DII flows, crude oil, RBI policy, Nifty level when relevant
- Never give vague advice like "markets are uncertain" — always give a specific price level
- If a stock is down heavily, address the averaging strategy explicitly
- Tone: confident, direct, like a trusted advisor not a disclaimer-heavy robot

Respond in this exact JSON format:
{
  "verdict": "BUY" | "SELL" | "HOLD" | "WAIT",
  "verdictColor": "green" | "red" | "orange" | "blue",
  "confidence": "High" | "Medium" | "Low",
  "sentimentTag": "Bullish" | "Bearish" | "Neutral" | "Cautiously Bullish" | "Cautiously Bearish",
  "riskLevel": "Low" | "Medium" | "High" | "Very High",
  "timeframe": "Short Term" | "Medium Term" | "Long Term",
  "summary": "2-3 sentence sharp summary",
  "userSituation": {
    "avgPrice": 0,
    "currentPrice": 0,
    "pnl": 0,
    "pnlPercent": 0,
    "shares": 0,
    "high52w": 0,
    "low52w": 0
  },
  "keyInsightTitle": "The single most important thing to know today — short title",
  "keyInsightBody": "3-4 sentences explaining the key insight with the mechanism of WHY it matters. Be specific with numbers and sector context.",
  "bullsBears": {
    "bulls": ["specific reason with number 1", "specific reason with number 2", "specific reason with number 3"],
    "bears": ["specific reason with number 1", "specific reason with number 2", "specific reason with number 3"]
  },
  "priceScenarios": [
    { "case": "Bearish", "price": "₹X–₹Y", "trigger": "what would cause this" },
    { "case": "Neutral", "price": "₹X–₹Y", "trigger": "what would cause this" },
    { "case": "Bullish", "price": "₹X–₹Y", "trigger": "what would cause this" }
  ],
  "actionTable": [
    { "action": "Do not buy", "icon": "❌", "priceLevel": "₹X", "reason": "why" },
    { "action": "Watch & wait", "icon": "⏳", "priceLevel": "₹X–₹Y", "reason": "why" },
    { "action": "Strong buy zone", "icon": "✅", "priceLevel": "₹X–₹Y", "reason": "why" },
    { "action": "Stop loss", "icon": "🛑", "priceLevel": "₹X", "reason": "why" }
  ],
  "keyFactors": [
    { "icon": "📈", "label": "Factor title", "detail": "explanation with specific number" }
  ],
  "priceTargets": {
    "support1": 0, "support2": 0,
    "resistance1": 0, "resistance2": 0,
    "stopLoss": 0, "target1Month": 0, "target3Month": 0
  },
  "verdictReason": "4-6 lines of exact reasoning. Reference the data. Mention macro context. Tell the user what to do and why in plain language.",
  "bottomLine": "3-4 sentence summary mentioning user's exact position, the core risk or opportunity, and one specific action to take.",
  "risks": ["risk 1 with number", "risk 2 with number", "risk 3 with number"],
  "catalysts": ["catalyst 1 with number", "catalyst 2 with number"],
  "technicalSignal": "Bullish" | "Bearish" | "Neutral",
  "fundamentalSignal": "Strong" | "Moderate" | "Weak",
  "investSuggestion": {
    "shouldInvest": true | false,
    "amount": "specific amount based on portfolio size",
    "entryPrice": "₹X–₹Y",
    "reason": "one line reason"
  }
}
`;

export interface UserHolding {
  shares: number;
  avgPrice: number;
  currentValue: number;
  investedValue: number;
  pnl: number;
  pnlPercent: number;
}

export interface StockData {
  name: string;
  symbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  high52w: number;
  low52w: number;
  volume: number;
  avgVolume?: number;
  marketCap?: number;
  pe?: number;
  sector?: string;
  niftyLevel?: number;
  niftyChangePercent?: number;
  recentNews?: string;
  financialData?: any;
  keyStatistics?: any;
  earningsHistory?: any;
  topNews?: { headline: string; summary: string }[];
}

export const buildAnalysisPrompt = (
  stockData: StockData,
  userHolding?: UserHolding | null,
  totalPortfolioValue?: number
): string => {
  const holdingSection = userHolding
    ? `
USER'S CURRENT POSITION:
- Shares held: ${userHolding.shares}
- Average buy price: ₹${userHolding.avgPrice.toFixed(2)}
- Current value: ₹${userHolding.currentValue.toFixed(2)}
- Invested amount: ₹${userHolding.investedValue.toFixed(2)}
- P&L: ₹${userHolding.pnl.toFixed(2)} (${userHolding.pnlPercent.toFixed(2)}%)
- Status: ${userHolding.pnlPercent >= 0 ? "IN PROFIT" : "IN LOSS"}
- Distance from avg: ${Math.abs(((stockData.currentPrice - userHolding.avgPrice) / userHolding.avgPrice) * 100).toFixed(1)}% ${stockData.currentPrice >= userHolding.avgPrice ? "above" : "below"} avg price
${totalPortfolioValue ? `- Total Portfolio Value: ₹${totalPortfolioValue.toFixed(2)}\nSUGGESTED INVESTMENT SIZE: Suggest an amount equal to 5-10% of this total portfolio size.` : `SUGGESTED INVESTMENT SIZE: Suggest "5-10% of your portfolio".`}`
    : `USER'S POSITION: Does not currently hold this stock. Considering fresh entry.
${totalPortfolioValue ? `\n- Total Portfolio Value: ₹${totalPortfolioValue.toFixed(2)}\nSUGGESTED INVESTMENT SIZE: Suggest an amount equal to 5-10% of this total portfolio size.` : `\nSUGGESTED INVESTMENT SIZE: Suggest "5-10% of your portfolio".`}`;

  const marketSection =
    stockData.niftyLevel
      ? `MARKET CONTEXT: Nifty at ${stockData.niftyLevel}, ${stockData.niftyChangePercent ?? 0 >= 0 ? "+" : ""}${stockData.niftyChangePercent?.toFixed(2) ?? "N/A"}% today.`
      : "";

  const financialsSection = stockData.financialData ? `
FINANCIAL DATA:
- Revenue Growth: ${stockData.financialData?.revenueGrowth?.fmt || "N/A"}
- Profit Margins: ${stockData.financialData?.profitMargins?.fmt || "N/A"}
- Return on Equity: ${stockData.financialData?.returnOnEquity?.fmt || "N/A"}
- Debt to Equity: ${stockData.financialData?.debtToEquity?.fmt || "N/A"}
` : "";

  const newsSection = stockData.topNews && stockData.topNews.length > 0 ? `
RECENT NEWS:
${stockData.topNews.map(n => `- ${n.headline}: ${n.summary}`).join("\n")}
` : (stockData.recentNews ? `RECENT NEWS: ${stockData.recentNews}` : "");

  return `
Analyze this NSE/BSE listed Indian stock for me RIGHT NOW:

STOCK: ${stockData.name} (${stockData.symbol})
CURRENT PRICE: ₹${stockData.currentPrice}
TODAY: ${stockData.changePercent >= 0 ? "▲" : "▼"} ₹${Math.abs(stockData.change).toFixed(2)} (${stockData.changePercent >= 0 ? "+" : ""}${stockData.changePercent.toFixed(2)}%)
OPEN: ₹${stockData.open} | HIGH: ₹${stockData.dayHigh} | LOW: ₹${stockData.dayLow}
52W HIGH: ₹${stockData.high52w} | 52W LOW: ₹${stockData.low52w}
FROM 52W HIGH: -${(((stockData.high52w - stockData.currentPrice) / stockData.high52w) * 100).toFixed(1)}%
FROM 52W LOW: +${(((stockData.currentPrice - stockData.low52w) / stockData.low52w) * 100).toFixed(1)}%
VOLUME: ${(stockData.volume / 100000).toFixed(2)} lakh shares
${stockData.pe ? `P/E RATIO: ${stockData.pe}` : ""}
${stockData.marketCap ? `MARKET CAP: ₹${(stockData.marketCap / 10000000).toFixed(0)} crore` : ""}
${stockData.sector ? `SECTOR: ${stockData.sector}` : ""}

${holdingSection}

${marketSection}
${financialsSection}
${newsSection}

Give me a complete, detailed senior advisor analysis. Be specific. Be direct. Tell me exactly what to do today.
Return ONLY the JSON object, nothing else.
`.trim();
};
