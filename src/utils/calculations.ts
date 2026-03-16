// Financial calculation utilities

/**
 * SIP Calculator
 * Calculate future value of Systematic Investment Plan
 *
 * Formula: FV = P × [{(1+r)^n - 1} / r] × (1+r)
 * Where: P = Monthly investment, r = Monthly rate, n = Total months
 *
 * @param monthlyInvestment - Monthly SIP amount in ₹
 * @param annualReturn - Expected annual return rate (e.g., 12 for 12%)
 * @param years - Investment duration in years
 */
export function calculateSIP(
    monthlyInvestment: number,
    annualReturn: number,
    years: number
): { futureValue: number; totalInvested: number; totalReturns: number } {
    const monthlyRate = annualReturn / 100 / 12;
    const totalMonths = years * 12;

    const futureValue =
        monthlyInvestment *
        ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) *
        (1 + monthlyRate);

    const totalInvested = monthlyInvestment * totalMonths;
    const totalReturns = futureValue - totalInvested;

    return {
        futureValue: Math.round(futureValue),
        totalInvested: Math.round(totalInvested),
        totalReturns: Math.round(totalReturns),
    };
}

/**
 * Lumpsum Calculator
 * Calculate future value of one-time investment
 *
 * Formula: FV = PV × (1 + r)^n
 * Where: PV = Present value, r = Annual rate, n = Years
 */
export function calculateLumpsum(
    principal: number,
    annualReturn: number,
    years: number
): { futureValue: number; totalInvested: number; totalReturns: number } {
    const rate = annualReturn / 100;
    const futureValue = principal * Math.pow(1 + rate, years);
    const totalReturns = futureValue - principal;

    return {
        futureValue: Math.round(futureValue),
        totalInvested: principal,
        totalReturns: Math.round(totalReturns),
    };
}

/**
 * CAGR Calculator
 * Compound Annual Growth Rate
 *
 * Formula: CAGR = (FV/PV)^(1/n) - 1
 */
export function calculateCAGR(
    initialValue: number,
    finalValue: number,
    years: number
): number {
    if (initialValue <= 0 || years <= 0) return 0;
    return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
}

/**
 * Goal-based SIP Planner
 * How much to invest monthly to reach ₹X in Y years
 *
 * Formula: P = FV × r / [{(1+r)^n - 1} × (1+r)]
 */
export function calculateGoalSIP(
    targetAmount: number,
    annualReturn: number,
    years: number
): number {
    const monthlyRate = annualReturn / 100 / 12;
    const totalMonths = years * 12;

    const monthlySIP =
        (targetAmount * monthlyRate) /
        ((Math.pow(1 + monthlyRate, totalMonths) - 1) * (1 + monthlyRate));

    return Math.round(monthlySIP);
}

/**
 * XIRR Calculation (Extended Internal Rate of Return)
 * Uses Newton-Raphson method to find the rate
 *
 * @param cashflows - Array of { amount: number, date: Date }
 *   Negative amounts = investments, Positive amounts = redemptions/current value
 */
export function calculateXIRR(
    cashflows: Array<{ amount: number; date: Date }>
): number {
    if (cashflows.length < 2) return 0;

    const sortedFlows = [...cashflows].sort(
        (a, b) => a.date.getTime() - b.date.getTime()
    );

    const firstDate = sortedFlows[0].date;

    // Get year fractions
    const yearFractions = sortedFlows.map(
        (cf) => (cf.date.getTime() - firstDate.getTime()) / (365.25 * 86400000)
    );

    // Newton-Raphson method
    let rate = 0.1; // Initial guess: 10%
    const maxIterations = 100;
    const tolerance = 1e-7;

    for (let i = 0; i < maxIterations; i++) {
        let fValue = 0;
        let fDerivative = 0;

        for (let j = 0; j < sortedFlows.length; j++) {
            const t = yearFractions[j];
            const pv = sortedFlows[j].amount / Math.pow(1 + rate, t);
            fValue += pv;
            fDerivative -= t * sortedFlows[j].amount / Math.pow(1 + rate, t + 1);
        }

        if (Math.abs(fDerivative) < 1e-10) break;

        const newRate = rate - fValue / fDerivative;

        if (Math.abs(newRate - rate) < tolerance) {
            return newRate * 100; // Return as percentage
        }

        rate = newRate;
    }

    return rate * 100;
}

/**
 * Calculate RSI (Relative Strength Index)
 * @param prices - Array of closing prices
 * @param period - RSI period (default 14)
 */
export function calculateRSI(prices: number[], period = 14): number {
    if (prices.length < period + 1) return 50;

    const changes = [];
    for (let i = 1; i < prices.length; i++) {
        changes.push(prices[i] - prices[i - 1]);
    }

    let avgGain = 0;
    let avgLoss = 0;

    // Initial average
    for (let i = 0; i < period; i++) {
        if (changes[i] > 0) avgGain += changes[i];
        else avgLoss -= changes[i];
    }

    avgGain /= period;
    avgLoss /= period;

    // Smoothed average
    for (let i = period; i < changes.length; i++) {
        if (changes[i] > 0) {
            avgGain = (avgGain * (period - 1) + changes[i]) / period;
            avgLoss = (avgLoss * (period - 1)) / period;
        } else {
            avgGain = (avgGain * (period - 1)) / period;
            avgLoss = (avgLoss * (period - 1) - changes[i]) / period;
        }
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
}
