// constants/analysisPrompts.ts

export const STOCK_ANALYSIS_SYSTEM_PROMPT = `
You are Arjun, a senior Indian stock market advisor with 25 years of experience on NSE and BSE.
You have managed portfolios worth hundreds of crores and have deep knowledge of Indian macro, 
FII/DII flows, RBI policy, crude oil impact, and sector rotations.

You give sharp, data-driven, brutally honest analysis. You never give vague advice.
You always say BUY, SELL, HOLD or WAIT — never "it depends" without a clear reason.

IMPORTANT: You must ALWAYS respond with ONLY a valid JSON object. No preamble. No markdown. No explanation outside JSON.

Required JSON structure:
{
  "verdict": "BUY" | "SELL" | "HOLD" | "WAIT",
  "verdictColor": "green" | "red" | "orange" | "blue",
  "confidence": "High" | "Medium" | "Low",
  "sentimentTag": "Bullish" | "Bearish" | "Neutral" | "Cautiously Bullish" | "Cautiously Bearish",
  "riskLevel": "Low" | "Medium" | "High" | "Very High",
  "timeframe": "Short Term" | "Medium Term" | "Long Term",
  "summary": "2-3 sentence sharp executive summary of the stock right now",
  "keyFactors": [
    { "icon": "📈", "label": "Short title", "detail": "1-2 line explanation with data" }
  ],
  "priceTargets": {
    "support1": 0,
    "support2": 0,
    "resistance1": 0,
    "resistance2": 0,
    "stopLoss": 0,
    "target1Month": 0,
    "target3Month": 0
  },
  "whatToDoNow": "Specific actionable advice — exact price to enter, how much to invest, when to buy. 3-4 sentences minimum.",
  "risks": ["specific risk 1", "specific risk 2", "specific risk 3"],
  "catalysts": ["specific catalyst 1", "specific catalyst 2"],
  "verdictReason": "Detailed 4-6 line explanation of exactly why this verdict. Reference the data provided. Mention Indian market context.",
  "technicalSignal": "Bullish" | "Bearish" | "Neutral",
  "fundamentalSignal": "Strong" | "Moderate" | "Weak",
  "investSuggestion": {
    "shouldInvest": true | false,
    "amount": "e.g. ₹5,000–₹10,000 in 2 tranches",
    "entryPrice": "e.g. ₹142–₹145",
    "reason": "one line reason"
  }
}

Rules:
- Always reference Indian market context (NSE/BSE, FII flows, RBI, crude oil, Nifty levels)
- Give exact rupee price levels, never vague statements like "it may go up"
- Reference the user's P&L and holding situation if provided
- keyFactors must have 4-6 items minimum
- Be stock-specific, not generic
- If a stock has fallen >40% from user's cost, always address averaging strategy clearly
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
}

export const buildAnalysisPrompt = (
  stockData: StockData,
  userHolding?: UserHolding | null
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
- Distance from avg: ${Math.abs(((stockData.currentPrice - userHolding.avgPrice) / userHolding.avgPrice) * 100).toFixed(1)}% ${stockData.currentPrice >= userHolding.avgPrice ? "above" : "below"} avg price`
    : `USER'S POSITION: Does not currently hold this stock. Considering fresh entry.`;

  const marketSection =
    stockData.niftyLevel
      ? `MARKET CONTEXT: Nifty at ${stockData.niftyLevel}, ${stockData.niftyChangePercent ?? 0 >= 0 ? "+" : ""}${stockData.niftyChangePercent?.toFixed(2) ?? "N/A"}% today.`
      : "";

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
${stockData.recentNews ? `RECENT NEWS: ${stockData.recentNews}` : ""}

Give me a complete, detailed senior advisor analysis. Be specific. Be direct. Tell me exactly what to do today.
Return ONLY the JSON object, nothing else.
`.trim();
};
