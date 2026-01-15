import { PHASES } from '../constants/targets';

export const useRiskAnalysis = (assets, totalNetWorth) => {
    const currentYear = new Date().getFullYear();

    // Determine current phase
    let currentPhase = null;
    for (const [phaseId, phase] of Object.entries(PHASES)) {
        if (currentYear >= phase.years[0] && currentYear <= phase.years[1]) {
            currentPhase = { id: phaseId, ...phase };
            break;
        }
    }

    if (!currentPhase) return { riskLevel: 'unknown', message: null };

    // Calculate High Risk Allocation (Crypto + Stocks)
    // Assuming 'stock' and 'crypto' are the high risk types
    // ETFs might be considered lower risk depending on the definition, 
    // but SRD says "High-risk assets = Bitcoin + Individual Stocks (excluding ETFs)"

    const highRiskValue = assets.reduce((sum, asset) => {
        if (asset.type === 'crypto' || asset.type === 'stock') {
            return sum + asset.currentValue;
        }
        return sum;
    }, 0);

    const riskRatio = totalNetWorth > 0 ? highRiskValue / totalNetWorth : 0;

    let riskLevel = 'safe';
    let message = null;

    if (riskRatio > currentPhase.riskLimit) {
        if (currentPhase.id === '3') { // Preservation Phase
            riskLevel = 'critical';
            message = `CRITICAL RISK ALERT: High-risk exposure (${(riskRatio * 100).toFixed(1)}%) exceeds safe threshold for preservation phase. Immediate rebalancing recommended.`;
        } else if (currentPhase.id === '2') { // Scaling Phase
            riskLevel = 'warning';
            message = `Risk Alert: High-risk exposure (${(riskRatio * 100).toFixed(1)}%) may not align with scaling phase.`;
        } else {
            // Phase 1: Aggressive Growth - generally ok, but maybe warn if 100%?
            // SRD says "No warning" for Phase 1 if >50%.
            riskLevel = 'safe';
        }
    }

    return {
        currentPhase,
        riskRatio,
        riskLevel,
        message
    };
};
