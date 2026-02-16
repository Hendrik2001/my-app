import gameData from '../constants/gameData.js';
const { FORMULA_CONSTANTS, SETUP_DATA } = gameData;

export function calculateTotalCapacity(team) {
    let total = 0;
    Object.keys(team.employees || {}).forEach(type => {
        const d = SETUP_DATA.employees[type];
        if (d) total += (team.employees[type] || 0) * d.capacity;
    });
    return total;
}

export function calculateBaseCompetency(team) {
    let total = 0;
    Object.keys(team.employees || {}).forEach(type => {
        const d = SETUP_DATA.employees[type];
        if (d) total += (team.employees[type] || 0) * d.competency;
    });
    return total;
}

export function calculateActualCompetency(team) {
    // Competency is not affected by productivity -- it's a separate axis
    return calculateBaseCompetency(team);
}

export function calculateLeverageRatio(team) {
    const partners = team.employees?.partners || 1;
    const juniors = team.employees?.juniors || 0;
    return juniors / partners;
}

// ── PRODUCTIVITY COST REDUCTION ──
// At 0 productivity: 1.0x cost (no discount)
// At 20: 0.83x (17% savings)
// At 50: 0.67x (33% savings)
// At 80: 0.56x (44% savings)
// At 100: 0.50x (50% savings)
// Formula: 100 / (100 + productivity)
export function getProductivityMultiplier(productivity) {
    return 100 / (100 + (productivity || 0));
}

export function getProductivityDiscount(productivity) {
    return Math.round((1 - getProductivityMultiplier(productivity)) * 100);
}

// ── GRUNT WORK ──
// Base: unusedCapacity * GRUNT_WORK_BASE
// Productivity bonus: multiply by (1 + productivity/100)
// At 0 prod: 1x base
// At 50 prod: 1.5x base
// At 100 prod: 2x base
export function calculateGruntWorkRate(productivity) {
    const base = FORMULA_CONSTANTS.GRUNT_WORK_BASE || 800;
    return Math.round(base * (1 + (productivity || 0) / 100));
}

export function calculateGruntWork(team, capacityUsed) {
    const totalCap = calculateTotalCapacity(team);
    const unused = Math.max(0, totalCap - capacityUsed);
    const rate = calculateGruntWorkRate(team.metrics?.productivity || 0);
    return unused * rate;
}

// ── PROJECT COST ──
export function calculateProjectCost(team, project) {
    const { BASE_COST_PER_COMPLEXITY, LEVERAGE_COST_INCREASE } = FORMULA_CONSTANTS;
    const base = project.complexity * BASE_COST_PER_COMPLEXITY;
    const productivity = team.metrics?.productivity || 0;
    const efficiencyFactor = getProductivityMultiplier(productivity);
    const leverage = calculateLeverageRatio(team);
    const leverageFactor = 1.0 + (leverage * LEVERAGE_COST_INCREASE);
    return Math.floor(base * efficiencyFactor * leverageFactor);
}

// ── PROJECT SUCCESS ──
export function calculateProjectSuccessChance(team, project, burnoutPenalty = 0) {
    const { MIN_COMPETENCY_RATIO, SUCCESS_BASE, MAX_ACCEPTABLE_LEVERAGE, LEVERAGE_QUALITY_MULTIPLIER } = FORMULA_CONSTANTS;
    const requiredComp = project.complexity * MIN_COMPETENCY_RATIO;
    const actualComp = calculateActualCompetency(team);
    let successChance = (actualComp / requiredComp) * SUCCESS_BASE;
    const leverage = calculateLeverageRatio(team);
    if (leverage > MAX_ACCEPTABLE_LEVERAGE) {
        successChance *= Math.pow(LEVERAGE_QUALITY_MULTIPLIER, leverage - MAX_ACCEPTABLE_LEVERAGE);
    }
    if (burnoutPenalty > 0) successChance *= (1 - burnoutPenalty);
    successChance *= 0.9 + (Math.random() * 0.2);
    return Math.min(successChance, 0.95);
}

// ── BID SCORING ──
export function scoreBid(bid, team, project, allBids, currentProjects) {
    const marketPrice = project.hiddenMarketPrice || project.estimatedCost * 1.5;
    const bidAmount = bid.amount || bid.bidPrice || 0;
    const rawPrice = Math.min(120, (marketPrice / Math.max(bidAmount, 1)) * 100);
    const priceScore = rawPrice * 0.40; // 40% weight (was 35, redistributed from removed metrics)
    const reputationScore = (team.metrics?.clientSatisfaction || 0) * 0.35; // 35% weight (was 30)
    const requiredComp = project.complexity * (FORMULA_CONSTANTS.MIN_COMPETENCY_RATIO || 0.60);
    const actualComp = calculateActualCompetency(team);
    const competencyScore = Math.min(100, (actualComp / Math.max(requiredComp, 1)) * 80) * 0.25;
    return {
        totalScore: priceScore + reputationScore + competencyScore,
        breakdown: { priceScore, reputationScore, competencyScore },
        teamId: bid.teamId, bidPrice: bidAmount,
    };
}

export function selectBidWinners(allBids, currentProjects, allTeams) {
    const projectBids = {};
    allBids.forEach(bid => {
        if (!projectBids[bid.projectId]) projectBids[bid.projectId] = [];
        projectBids[bid.projectId].push(bid);
    });
    const winners = {}, results = {};
    for (const [projectId, bids] of Object.entries(projectBids)) {
        const project = currentProjects.find(p => p.id === projectId);
        if (!project) continue;
        const scored = bids.map(bid => {
            const team = allTeams.find(t => t.id === bid.teamId);
            if (!team) return null;
            const s = scoreBid(bid, team, project, allBids, currentProjects);
            return { ...s, teamName: bid.teamName, won: false, lossReasons: [] };
        }).filter(Boolean);
        scored.sort((a, b) => b.totalScore - a.totalScore);
        if (scored.length > 0) {
            scored[0].won = true;
            winners[projectId] = scored[0];
            for (let i = 1; i < scored.length; i++) {
                scored[i].lossReasons = determineLossReasons(scored[i].breakdown, scored[0].breakdown);
            }
        }
        results[projectId] = scored;
    }
    return { winners, results };
}

export function determineLossReasons(loserB, winnerB) {
    const reasons = [];
    const gap = (m) => winnerB[m] - loserB[m];
    if (gap('reputationScore') > 2) reasons.push("Reputation gap -- client trusted the winning firm more");
    if (gap('competencyScore') > 2) reasons.push("Competency gap -- winner better equipped for this complexity");
    if (gap('priceScore') > 3) reasons.push("Outpriced -- winning firm offered a more competitive rate");
    if (reasons.length === 0) reasons.push("Very close competition -- marginal differences decided it");
    if (loserB.priceScore > winnerB.priceScore && (gap('reputationScore') > 1 || gap('competencyScore') > 1)) {
        reasons.push("Your price was lower, but the client chose reputation and competency over cost");
    }
    return reasons;
}
