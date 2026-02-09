// src/utils/gameCalculations.js
// All game calculation functions

import gameData from '../constants/gameData.js';

const { FORMULA_CONSTANTS, SETUP_DATA } = gameData;

// ============================================================================
// TEAM CALCULATIONS
// ============================================================================

export function calculateTotalCapacity(team) {
    let total = 0;
    Object.keys(team.employees || {}).forEach(empType => {
        const count = team.employees[empType] || 0;
        const empData = SETUP_DATA.employees[empType];
        if (empData) {
            total += count * empData.capacity;
        }
    });
    return total;
}

export function calculateBaseCompetency(team) {
    let total = 0;
    Object.keys(team.employees || {}).forEach(empType => {
        const count = team.employees[empType] || 0;
        const empData = SETUP_DATA.employees[empType];
        if (empData) {
            total += count * empData.competency;
        }
    });
    return total;
}

export function calculateActualCompetency(team) {
    const base = calculateBaseCompetency(team);
    const productivity = team.metrics?.productivity || 50;
    return base * (productivity / 50);
}

export function calculateLeverageRatio(team) {
    const partners = team.employees?.partners || 1;
    const juniors = team.employees?.juniors || 0;
    return juniors / partners;
}

// ============================================================================
// PROJECT COST CALCULATION (CRITICAL - THIS IS THE KEY MECHANIC!)
// ============================================================================

export function calculateProjectCost(team, project) {
    const { BASE_COST_PER_COMPLEXITY, LEVERAGE_COST_INCREASE } = FORMULA_CONSTANTS;

    const base = project.complexity * BASE_COST_PER_COMPLEXITY;

    // Efficiency factor: Exponential productivity benefit
    // At 50 productivity: 1.0x cost
    // At 100 productivity: 0.25x cost (75% discount!)
    // At 25 productivity: 2.8x cost
    const productivity = team.metrics?.productivity || 50;
    const efficiencyFactor = Math.pow(50 / productivity, 1.5);

    // Leverage factor: More juniors = higher costs
    const leverage = calculateLeverageRatio(team);
    const leverageFactor = 1.0 + (leverage * LEVERAGE_COST_INCREASE);

    return Math.floor(base * efficiencyFactor * leverageFactor);
}

// ============================================================================
// PROJECT SUCCESS CALCULATION
// ============================================================================

export function calculateProjectSuccessChance(team, project, burnoutPenalty = 0) {
    const {
        MIN_COMPETENCY_RATIO,
        SUCCESS_BASE,
        MAX_ACCEPTABLE_LEVERAGE,
        LEVERAGE_QUALITY_MULTIPLIER
    } = FORMULA_CONSTANTS;

    const requiredComp = project.complexity * MIN_COMPETENCY_RATIO;
    const actualComp = calculateActualCompetency(team);

    // Base success chance
    let successChance = (actualComp / requiredComp) * SUCCESS_BASE;

    // Apply leverage penalty
    const leverage = calculateLeverageRatio(team);
    if (leverage > MAX_ACCEPTABLE_LEVERAGE) {
        const excess = leverage - MAX_ACCEPTABLE_LEVERAGE;
        const penalty = Math.pow(LEVERAGE_QUALITY_MULTIPLIER, excess);
        successChance *= penalty;
    }

    // Apply burnout penalty if applicable
    if (burnoutPenalty > 0) {
        successChance *= (1 - burnoutPenalty);
    }

    // Random variance
    const variance = 0.9 + (Math.random() * 0.2); // 0.9 to 1.1
    successChance *= variance;

    return Math.min(successChance, 0.95); // Cap at 95%
}

// ============================================================================
// BIDDING ELIGIBILITY
// ============================================================================

export function canTeamBidOnProject(team, project) {
    const { MIN_COMPETENCY_RATIO } = FORMULA_CONSTANTS;

    const required = project.complexity * MIN_COMPETENCY_RATIO;
    const actual = calculateActualCompetency(team);

    if (actual < required) {
        return {
            canBid: false,
            reason: `Insufficient competency (need ${required.toFixed(0)}, have ${actual.toFixed(0)})`
        };
    }

    return { canBid: true };
}

// ============================================================================
// INVESTMENT EFFECTS
// ============================================================================

export function applyInvestmentEffects(metrics, investments) {
    const {
        AI_INVESTMENT_EFFECT,
        CLIENT_INVESTMENT_EFFECT,
        DIVIDEND_INVESTMENT_EFFECT
    } = FORMULA_CONSTANTS;

    const newMetrics = { ...metrics };

    // Apply investment effects
    newMetrics.productivity = (newMetrics.productivity || 50) + (investments.ai || 0) * AI_INVESTMENT_EFFECT;
    newMetrics.clientSatisfaction = (newMetrics.clientSatisfaction || 50) + (investments.client || 0) * CLIENT_INVESTMENT_EFFECT;
    newMetrics.partnerSatisfaction = (newMetrics.partnerSatisfaction || 50) + (investments.dividends || 0) * DIVIDEND_INVESTMENT_EFFECT;
    newMetrics.employeeSatisfaction = newMetrics.employeeSatisfaction || 50;

    // Clamp all metrics between 10 and 100
    Object.keys(newMetrics).forEach(key => {
        newMetrics[key] = Math.max(10, Math.min(100, newMetrics[key]));
    });

    return newMetrics;
}

// ============================================================================
// FIXED COSTS CALCULATION
// ============================================================================

export function calculateFixedCosts(team) {
    let totalSalary = 0;

    Object.keys(team.employees || {}).forEach(empType => {
        const count = team.employees[empType] || 0;
        const empData = SETUP_DATA.employees[empType];
        if (empData) {
            totalSalary += count * empData.baseSalary;
        }
    });

    // Apply salary multiplier
    const salaryMult = SETUP_DATA.salaryMultipliers[team.config?.salaryLevel || 1] || 1.0;
    totalSalary *= salaryMult;

    // Add office cost
    const officeData = SETUP_DATA.office[team.config?.office || 'basic'];
    const officeCost = officeData?.roundCost || 0;

    return totalSalary + officeCost;
}