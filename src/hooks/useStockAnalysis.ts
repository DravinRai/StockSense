// hooks/useStockAnalysis.ts

import { useState, useCallback, useEffect } from "react";
import { getStockAnalysis, askStockQuestion, StockAnalysis } from "../services/aiAnalysisService";
import { StockData, UserHolding } from "../constants/analysisPrompts";

interface UseStockAnalysisReturn {
  analysis: StockAnalysis | null;
  loading: boolean;
  error: string | null;
  cooldown: number; // Seconds remaining in cooldown
  fetchAnalysis: (stockData: StockData, userHolding?: UserHolding | null, totalPortfolioValue?: number) => Promise<void>;
  askQuestion: (question: string, stockName: string) => Promise<string>;
  reset: () => void;
}

export const useStockAnalysis = (): UseStockAnalysisReturn => {
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const fetchAnalysis = useCallback(
    async (stockData: StockData, userHolding?: UserHolding | null, totalPortfolioValue?: number) => {
      if (cooldown > 0) {
        setError(`Please wait ${cooldown}s before requesting another analysis.`);
        return;
      }

      setLoading(true);
      setError(null);
      setAnalysis(null);

      try {
        const result = await getStockAnalysis(stockData, userHolding, totalPortfolioValue);
        setAnalysis(result);
        setCooldown(30); // 30 second cooldown after success
      } catch (err: any) {
        console.error("AI Analysis error:", err);
        setError(err?.message ?? "Failed to fetch analysis. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [cooldown]
  );

  const askQuestion = useCallback(
    async (question: string, stockName: string): Promise<string> => {
      try {
        const answer = await askStockQuestion(question, stockName, analysis);
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

  return { analysis, loading, error, cooldown, fetchAnalysis, askQuestion, reset };
};
