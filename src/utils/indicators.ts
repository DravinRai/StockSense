export function calculateRSI(prices: number[], period = 14) {
    if (prices.length <= period) return 50;
    let gains = 0, losses = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
        const diff = prices[i] - prices[i - 1];
        if (diff > 0) gains += diff;
        else losses -= diff;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

export function calculateBollingerBands(prices: number[], period = 20, stdDev = 2) {
    if (prices.length < period) return { upper: 0, middle: 0, lower: 0 };
    const slice = prices.slice(-period);
    const sum = slice.reduce((a, b) => a + b, 0);
    const sma = sum / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - sma, 2), 0) / period;
    const std = Math.sqrt(variance);
    return {
        upper: sma + stdDev * std,
        middle: sma,
        lower: sma - stdDev * std
    };
}

export function calculateEMA(prices: number[], period: number) {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    const k = 2 / (period + 1);
    let ema = prices[0];
    for (let i = 1; i < prices.length; i++) {
        ema = prices[i] * k + ema * (1 - k);
    }
    return ema;
}

export function calculateMACD(prices: number[]) {
    if (prices.length < 26) return { macdLine: 0, signalLine: 0, histogram: 0 };
    // Build MACD line series for signal EMA
    const k12 = 2 / 13, k26 = 2 / 27;
    let ema12 = prices[0], ema26 = prices[0];
    const macdSeries: number[] = [];
    for (let i = 1; i < prices.length; i++) {
        ema12 = prices[i] * k12 + ema12 * (1 - k12);
        ema26 = prices[i] * k26 + ema26 * (1 - k26);
        if (i >= 25) macdSeries.push(ema12 - ema26);
    }
    const macdLine = macdSeries[macdSeries.length - 1] || 0;
    // Signal line = 9-period EMA of MACD series
    const k9 = 2 / 10;
    let signal = macdSeries[0] || 0;
    for (let i = 1; i < macdSeries.length; i++) {
        signal = macdSeries[i] * k9 + signal * (1 - k9);
    }
    const histogram = macdLine - signal;
    return { macdLine, signalLine: signal, histogram };
}
