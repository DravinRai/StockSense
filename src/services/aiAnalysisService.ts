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
  groqApiKey: string,
  stockData: StockData,
  userHolding?: UserHolding | null,
  totalPortfolioValue?: number
): Promise<StockAnalysis> => {
  const userPrompt = buildAnalysisPrompt(stockData, userHolding, totalPortfolioValue);

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqApiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.15,       // Lower temp = more consistent
      max_tokens: 3000,        // Much higher max tokens per request
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

export const askStockQuestion = async (
  groqApiKey: string,
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

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqApiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.3,
      max_tokens: 500,
      messages: [
        { role: "user", content: prompt },
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
  
  return raw.trim();
};
