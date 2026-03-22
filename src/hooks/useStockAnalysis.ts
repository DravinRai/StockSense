// hooks/useStockAnalysis.ts

import { useState, useCallback } from "react";
import { getStockAnalysis, askStockQuestion, StockAnalysis } from "../services/aiAnalysisService";
import { StockData, UserHolding } from "../constants/analysisPrompts";

// ── Put your Groq API key here (or pull from env / constants) ──
// Best practice: store in app.config.js as extra.groqApiKey
import Constants from "expo-constants";
const GROQ_API_KEY: string = Constants.expoConfig?.extra?.groqApiKey ?? process.env.GROQ_API_KEY ?? "";

interface UseStockAnalysisReturn {
  analysis: StockAnalysis | null;
  loading: boolean;
  error: string | null;
  fetchAnalysis: (stockData: StockData, userHolding?: UserHolding | null, totalPortfolioValue?: number) => Promise<void>;
  askQuestion: (question: string, stockName: string) => Promise<string>;
  reset: () => void;
}

export const useStockAnalysis = (): UseStockAnalysisReturn => {
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(
    async (stockData: StockData, userHolding?: UserHolding | null, totalPortfolioValue?: number) => {
      if (!GROQ_API_KEY) {
        setError("Groq API key not configured. Add it to app.config.js.");
        return;
      }

      setLoading(true);
      setError(null);
      setAnalysis(null);

      try {
        const result = await getStockAnalysis(GROQ_API_KEY, stockData, userHolding, totalPortfolioValue);
        setAnalysis(result);
      } catch (err: any) {
        console.error("AI Analysis error:", err);
        setError(err?.message ?? "Failed to fetch analysis. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const askQuestion = useCallback(
    async (question: string, stockName: string): Promise<string> => {
      if (!GROQ_API_KEY) {
        throw new Error("Groq API key not configured.");
      }
      try {
        const answer = await askStockQuestion(GROQ_API_KEY, question, stockName, analysis);
        return answer;
      } catch (err: any) {
        console.error("Ask AI error:", err);
        throw new Error(err?.message ?? "Failed to get an answer. Please try again.");
      }
    },
    [analysis]
  );

  const reset = useCallback(() => {
    setAnalysis(null);
    setError(null);
    setLoading(false);
  }, []);

  return { analysis, loading, error, fetchAnalysis, askQuestion, reset };
};
