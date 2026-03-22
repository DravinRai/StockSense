// services/aiAnalysisService.ts

import {
  STOCK_ANALYSIS_SYSTEM_PROMPT,
  buildAnalysisPrompt,
  StockData,
  UserHolding,
} from "../constants/analysisPrompts";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export interface PriceTargets {
  support1: number;
  support2: number;
  resistance1: number;
  resistance2: number;
  stopLoss: number;
  target1Month: number;
  target3Month: number;
}

export interface KeyFactor {
  icon: string;
  label: string;
  detail: string;
}

export interface InvestSuggestion {
  shouldInvest: boolean;
  amount: string;
  entryPrice: string;
  reason: string;
}

export interface StockAnalysis {
  verdict: "BUY" | "SELL" | "HOLD" | "WAIT";
  verdictColor: "green" | "red" | "orange" | "blue";
  confidence: "High" | "Medium" | "Low";
  sentimentTag: string;
  riskLevel: "Low" | "Medium" | "High" | "Very High";
  timeframe: string;
  summary: string;
  keyFactors: KeyFactor[];
  priceTargets: PriceTargets;
  whatToDoNow: string;
  risks: string[];
  catalysts: string[];
  verdictReason: string;
  technicalSignal: "Bullish" | "Bearish" | "Neutral";
  fundamentalSignal: "Strong" | "Moderate" | "Weak";
  investSuggestion: InvestSuggestion;
}

export const getStockAnalysis = async (
  groqApiKey: string,
  stockData: StockData,
  userHolding?: UserHolding | null
): Promise<StockAnalysis> => {
  const userPrompt = buildAnalysisPrompt(stockData, userHolding);

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqApiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.2,       // Low temp = focused, consistent responses
      max_tokens: 2000,        // Much higher than before
      response_format: { type: "json_object" }, // Force JSON output
      messages: [
        {
          role: "system",
          content: STOCK_ANALYSIS_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content;

  if (!raw) throw new Error("Empty response from Groq");

  // Strip markdown fences if model ignored JSON mode
  const cleaned = raw.replace(/```json|```/g, "").trim();

  try {
    const analysis: StockAnalysis = JSON.parse(cleaned);
    return analysis;
  } catch {
    throw new Error("Failed to parse analysis JSON: " + cleaned.slice(0, 200));
  }
};
