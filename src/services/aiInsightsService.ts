import AsyncStorage from '@react-native-async-storage/async-storage';

const GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_KEY;
const PRIMARY_MODEL = 'llama-3.3-70b-versatile';
const FALLBACK_MODEL = 'gemma2-9b-it';

const AI_CACHE_PREFIX = '@cache_ai_insight_';
const AI_CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

export interface AIInsight {
  verdict: 'Bullish' | 'Bearish' | 'Neutral';
  confidence: 'High' | 'Medium' | 'Low';
  summary: string;
  keyPoints: string[];
  risk: 'Low' | 'Medium' | 'High';
  targetPrice: number | null;
  timeHorizon: 'Short term' | 'Long term' | 'Medium term';
}

export interface StockDataForAI {
  name: string;
  symbol: string;
  price: number;
  change1D: number;
  change1Y: number;
  high52: number;
  low52: number;
  rsi: number;
  macd: string;
  volume: number;
  avgVolume: number;
  news: string[];
  marketOpen: boolean;
}

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const safeParseJSON = (text: string): AIInsight | null => {
  try {
    const clean = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const parsed = JSON.parse(clean);
    return parsed;
  } catch {
    try {
      const clean = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      const start = clean.indexOf('{');
      const end = clean.lastIndexOf('}');
      if (start >= 0 && end > start) {
        return JSON.parse(clean.slice(start, end + 1));
      }
      return null;
    } catch {
      return null;
    }
  }
};

const normalizeInsight = (value: any, currentPrice: number): AIInsight => {
  const verdict: AIInsight['verdict'] =
    value?.verdict === 'Bullish' || value?.verdict === 'Bearish' || value?.verdict === 'Neutral'
      ? value.verdict
      : 'Neutral';

  const confidence: AIInsight['confidence'] =
    value?.confidence === 'High' || value?.confidence === 'Medium' || value?.confidence === 'Low'
      ? value.confidence
      : 'Medium';

  const risk: AIInsight['risk'] =
    value?.risk === 'Low' || value?.risk === 'Medium' || value?.risk === 'High'
      ? value.risk
      : 'Medium';

  const timeHorizon: AIInsight['timeHorizon'] =
    value?.timeHorizon === 'Short term' || value?.timeHorizon === 'Medium term' || value?.timeHorizon === 'Long term'
      ? value.timeHorizon
      : 'Medium term';

  const keyPointsRaw = Array.isArray(value?.keyPoints)
    ? value.keyPoints.filter((item: unknown) => typeof item === 'string' && item.trim().length > 0)
    : [];

  const keyPoints = keyPointsRaw.length >= 3
    ? keyPointsRaw.slice(0, 3)
    : [
        ...keyPointsRaw,
        'Track quarterly results and management guidance.',
        'Watch sector momentum and overall market sentiment.',
        'Use staggered entries and risk controls for position sizing.',
      ].slice(0, 3);

  const targetPriceInput = typeof value?.targetPrice === 'number' ? value.targetPrice : null;

  return {
    verdict,
    confidence,
    summary:
      typeof value?.summary === 'string' && value.summary.trim().length > 0
        ? value.summary.trim()
        : 'AI analysis is currently limited. Review technical and fundamental indicators before making decisions.',
    keyPoints,
    risk,
    targetPrice: validateTargetPrice(targetPriceInput, currentPrice),
    timeHorizon,
  };
};

const validateTargetPrice = (
  target: number | null,
  current: number
): number | null => {
  if (!target) return null;
  if (target > current * 1.5 || target < current * 0.5) return null;
  return target;
};

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const mapAIStatusToMessage = (status: number): string => {
  if (status === 429) {
    return 'AI rate limit reached. Please wait a minute and try again.';
  }
  if (status === 401 || status === 403) {
    return 'AI API key is invalid or not authorized. Check EXPO_PUBLIC_GROQ_KEY.';
  }
  if (status === 404) {
    return 'Configured AI model is unavailable for this key.';
  }
  return `AI service error (${status}). Please try again.`;
};

const callGroq = async (
  model: string,
  prompt: string,
  maxOutputTokens: number
): Promise<{ ok: boolean; status: number; text: string }> => {
  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxOutputTokens,
        temperature: 0.7,
      }),
    }
  );

  if (!response.ok) {
    return { ok: false, status: response.status, text: '' };
  }

  const json = await response.json();
  const text = json.choices?.[0]?.message?.content ?? '';

  return { ok: true, status: response.status, text };
};

export const fetchAIInsight = async (
  data: StockDataForAI,
  retryCount = 0
): Promise<AIInsight> => {
  const cacheKey = `${AI_CACHE_PREFIX}${data.symbol}`;

  // Try reading from cache first
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const { insight, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < AI_CACHE_TTL) {
        return insight;
      }
    }
  } catch {}

  const prompt = `You are a professional Indian stock market analyst 
advising a first-time retail investor with a long term horizon (1-3 years).
Use simple English. No jargon. Be concise and honest.

Stock: ${data.name} (${data.symbol})
Price: Rs ${data.price}
1D Change: ${data.change1D}%
1Y Change: ${data.change1Y}%
52W High: Rs ${data.high52} | 52W Low: Rs ${data.low52}
RSI: ${data.rsi}
MACD: ${data.macd}
Volume: ${data.volume} (avg: ${data.avgVolume})
Market Status: ${data.marketOpen ? 'Open' : 'Closed - using last closing data'}
Recent News: 
  1. ${data.news[0] ?? 'N/A'}
  2. ${data.news[1] ?? 'N/A'}
  3. ${data.news[2] ?? 'N/A'}

Respond ONLY with this exact JSON, nothing else, no markdown:
{
  "verdict": "Bullish" | "Bearish" | "Neutral",
  "confidence": "High" | "Medium" | "Low",
  "summary": "max 2 sentences in plain english",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "risk": "Low" | "Medium" | "High",
  "targetPrice": number or null,
  "timeHorizon": "Short term" | "Medium term" | "Long term"
}`;

  try {
    let result = await callGroq(PRIMARY_MODEL, prompt, 1024);
    if (!result.ok) {
      result = await callGroq(FALLBACK_MODEL, prompt, 1024);
    }

    if (!result.ok) {
      // On rate limit, try returning stale cache
      if (result.status === 429) {
        try {
          const cached = await AsyncStorage.getItem(cacheKey);
          if (cached) {
            const { insight } = JSON.parse(cached);
            return insight;
          }
        } catch {}
      }
      throw new Error(mapAIStatusToMessage(result.status));
    }

    const parsed = safeParseJSON(result.text);
    if (!parsed) throw new Error('Invalid JSON response');

    const normalized = normalizeInsight(parsed, data.price);

    // Save to cache
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify({ insight: normalized, timestamp: Date.now() }));
    } catch {}

    return normalized;
  } catch (error) {
    if (retryCount < 1) {
      await sleep(3000);
      return fetchAIInsight(data, retryCount + 1);
    }
    throw error;
  }
};

export const askAIFollowUp = async (
  data: StockDataForAI,
  conversationHistory: AIChatMessage[],
  question: string,
  retryCount = 0
): Promise<string> => {
  const formattedHistory = conversationHistory
    .map((msg) => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
    .join('\n');

  const prompt = `You are assisting a first-time Indian stock investor.
Use plain English and keep your response concise (max 4 short lines).

Stock Context:
Stock: ${data.name} (${data.symbol})
Price: Rs ${data.price}
1D Change: ${data.change1D}%
1Y Change: ${data.change1Y}%
52W High: Rs ${data.high52}
52W Low: Rs ${data.low52}
RSI: ${data.rsi}
MACD: ${data.macd}
Volume: ${data.volume} (avg: ${data.avgVolume})
Market Status: ${data.marketOpen ? 'Open' : 'Closed - using last closing data'}
Recent News:
  1. ${data.news[0] ?? 'N/A'}
  2. ${data.news[1] ?? 'N/A'}
  3. ${data.news[2] ?? 'N/A'}

Conversation History:
${formattedHistory || 'No previous messages'}

New User Question:
${question}`;

  try {
    let result = await callGroq(PRIMARY_MODEL, prompt, 450);
    if (!result.ok) {
      result = await callGroq(FALLBACK_MODEL, prompt, 450);
    }

    if (!result.ok) {
      throw new Error(mapAIStatusToMessage(result.status));
    }

    const reply = result.text.trim();
    return reply || 'No reply received.';
  } catch (error) {
    if (retryCount < 1) {
      await sleep(3000);
      return askAIFollowUp(data, conversationHistory, question, retryCount + 1);
    }
    throw error;
  }
};
