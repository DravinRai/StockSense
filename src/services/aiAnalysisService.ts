// services/aiAnalysisService.ts

import {
  STOCK_ANALYSIS_SYSTEM_PROMPT,
  buildAnalysisPrompt,
  StockData,
  UserHolding,
} from "../constants/analysisPrompts";
import { API_ENDPOINTS, REQUEST_TIMEOUT } from "../config/apiConfig";

export interface PriceTargets {
  // ... (same as before)
  support1: number;
  support2: number;
  resistance1: number;
  resistance2: number;
  stopLoss: number;
  target1Month: number;
  target3Month: number;
}

export interface PriceScenario {
  case: "Bearish" | "Neutral" | "Bullish";
  price: string;
  trigger: string;
}

export interface ActionPlanItem {
  action: string;
  icon: string;
  priceLevel: string;
  reason: string;
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
  userSituation: {
    avgPrice: number;
    currentPrice: number;
    pnl: number;
    pnlPercent: number;
    shares: number;
    high52w: number;
    low52w: number;
  };
  keyInsightTitle: string;
  keyInsightBody: string;
  bullsBears: {
    bulls: string[];
    bears: string[];
  };
  priceScenarios: PriceScenario[];
  actionTable: ActionPlanItem[];
  keyFactors: KeyFactor[];
  priceTargets: PriceTargets;
  verdictReason: string;
  bottomLine: string;
  risks: string[];
  catalysts: string[];
  technicalSignal: "Bullish" | "Bearish" | "Neutral";
  fundamentalSignal: "Strong" | "Moderate" | "Weak";
  investSuggestion: InvestSuggestion;
}

export const getStockAnalysis = async (
  stockData: StockData,
  userHolding?: UserHolding | null,
  totalPortfolioValue?: number
): Promise<StockAnalysis> => {
  const userPrompt = buildAnalysisPrompt(stockData, userHolding, totalPortfolioValue);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(API_ENDPOINTS.ANALYZE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        stockData,
        userHolding,
        totalPortfolioValue,
        systemPrompt: STOCK_ANALYSIS_SYSTEM_PROMPT,
        userPrompt: userPrompt,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Analysis error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content;

    if (!raw) throw new Error("Empty response from analysis server");

    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error: any) {
    if (error.name === 'AbortError') throw new Error("Analysis request timed out");
    throw error;
  }
};

export const askStockQuestion = async (
  question: string,
  stockName: string,
  contextAnalysis: StockAnalysis | null
): Promise<string> => {
  const contextText = contextAnalysis ? JSON.stringify(contextAnalysis, null, 2) : "No prior analysis available.";
  const prompt = `You are Arjun, a senior Indian stock market advisor.
The user is asking a question about ${stockName}.
Here is your previous detailed analysis for context:
${contextText}

QUESTION: ${question}

Provide a direct, helpful, and concise answer (3-4 sentences max). Be specific to the Indian market and reference your previous analysis if relevant. Do not include JSON formatting, just plain text.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(API_ENDPOINTS.ANALYZE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        systemPrompt: "You are a helpful AI stock advisor.",
        userPrompt: prompt,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Question error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Empty response from analysis server");
    
    return raw.trim();
  } catch (error: any) {
    if (error.name === 'AbortError') throw new Error("Question request timed out");
    throw error;
  }
};
