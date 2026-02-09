// src/constants/gameData.js
// Complete updated version with balanced economics

const STARTING_CAPITAL = 8000000;

// ============================================================================
// FORMULA CONSTANTS (From simulator testing)
// ============================================================================

const FORMULA_CONSTANTS = {
    // Leverage penalties
    MAX_ACCEPTABLE_LEVERAGE: 5.5,
    LEVERAGE_QUALITY_MULTIPLIER: 0.72,

    // Capacity & Burnout
    OVERWORK_THRESHOLD: 1.0,
    BURNOUT_EMP_SAT_PENALTY: 15,
    BURNOUT_QUALITY_PENALTY: 0.10,

    // Project complexity
    MIN_COMPETENCY_RATIO: 0.60,
    SUCCESS_BASE: 1.2,

    // Investment effects (per €)
    AI_INVESTMENT_EFFECT: 0.0003,       // DOUBLED from original
    CLIENT_INVESTMENT_EFFECT: 0.0002,
    DIVIDEND_INVESTMENT_EFFECT: 0.00005,

    // Bidding
    MAX_WIN_CHANCE: 0.80,

    // Costs
    BASE_COST_PER_COMPLEXITY: 1000,
    LEVERAGE_COST_INCREASE: 0.05,
};

// ============================================================================
// SETUP DATA
// ============================================================================

const SETUP_DATA = {
    office: {
        basic: {
            name: "Basic Office",
            cost: 250000,
            roundCost: 20000,
            clientBoost: 0,
            empBoost: 0
        },
        modern: {
            name: "Modern Office",
            cost: 750000,
            roundCost: 60000,
            clientBoost: 5,
            empBoost: 5
        },
        premium: {
            name: "Premium HQ",
            cost: 1500000,
            roundCost: 120000,
            clientBoost: 12,
            empBoost: 10
        }
    },

    tech: {
        basic: {
            name: "Basic Stack",
            cost: 100000,
            prodBoost: 0
        },
        advanced: {
            name: "Advanced Stack",
            cost: 500000,
            prodBoost: 10
        },
        "cutting-edge": {
            name: "Cutting-Edge Stack",
            cost: 1000000,
            prodBoost: 20
        }
    },

    // UPDATED: Salaries reduced by 40%
    employees: {
        juniors: {
            name: "Juniors",
            hireCost: 20000,
            baseSalary: 25000,    // Was 40000
            capacity: 10,
            competency: 3
        },
        mediors: {
            name: "Mediors",
            hireCost: 40000,
            baseSalary: 45000,    // Was 70000
            capacity: 8,
            competency: 6
        },
        seniors: {
            name: "Seniors",
            hireCost: 80000,
            baseSalary: 65000,    // Was 100000
            capacity: 5,
            competency: 10
        },
        partners: {
            name: "Partners",
            hireCost: 150000,
            baseSalary: 100000,   // Was 150000
            capacity: 5,
            competency: 15
        }
    },

    salaryMultipliers: [0.8, 1.0, 1.2],
    salarySatisfactionBoost: [-5, 0, 5]
};

// ============================================================================
// PROJECT POOL (UPDATED: Increased values by 50%)
// ============================================================================

const ALL_PROJECTS_POOL = [
    {
        id: 1,
        name: "Simple Contract Review",
        complexity: 30,
        capacityCost: 10,
        estimatedCost: 45000,      // Was 30000
        hiddenMarketPrice: 90000    // Was 60000
    },
    {
        id: 2,
        name: "Startup Incorporation",
        complexity: 40,
        capacityCost: 15,
        estimatedCost: 67500,      // Was 50000
        hiddenMarketPrice: 135000   // Was 90000
    },
    {
        id: 3,
        name: "Employment Dispute",
        complexity: 50,
        capacityCost: 20,
        estimatedCost: 105000,     // Was 80000
        hiddenMarketPrice: 210000   // Was 140000
    },
    {
        id: 4,
        name: "Mid-Market M&A",
        complexity: 70,
        capacityCost: 35,
        estimatedCost: 225000,     // Was 180000
        hiddenMarketPrice: 450000   // Was 300000
    },
    {
        id: 5,
        name: "Patent Litigation",
        complexity: 90,
        capacityCost: 50,
        estimatedCost: 337500,     // Was 300000
        hiddenMarketPrice: 675000   // Was 450000
    },
    {
        id: 6,
        name: "Real Estate Zoning",
        complexity: 45,
        capacityCost: 20,
        estimatedCost: 82500,      // Was 60000
        hiddenMarketPrice: 165000   // Was 110000
    },
    {
        id: 7,
        name: "Corporate Restructuring",
        complexity: 80,
        capacityCost: 45,
        estimatedCost: 300000,     // Was 250000
        hiddenMarketPrice: 600000   // Was 400000
    },
    {
        id: 8,
        name: "IPO Filing",
        complexity: 100,
        capacityCost: 60,
        estimatedCost: 525000,     // Was 400000
        hiddenMarketPrice: 1050000  // Was 700000
    },
    {
        id: 9,
        name: "Small Claims Court",
        complexity: 20,
        capacityCost: 5,
        estimatedCost: 15000,
        hiddenMarketPrice: 37500    // Was 25000
    },
    {
        id: 10,
        name: "Data Privacy Audit",
        complexity: 60,
        capacityCost: 25,
        estimatedCost: 135000,     // Was 100000
        hiddenMarketPrice: 270000   // Was 180000
    },
    {
        id: 11,
        name: "Tax Advisory",
        complexity: 55,
        capacityCost: 20,
        estimatedCost: 120000,     // Was 90000
        hiddenMarketPrice: 240000   // Was 160000
    },
    {
        id: 12,
        name: "Global Antitrust Filing",
        complexity: 95,
        capacityCost: 55,
        estimatedCost: 450000,     // Was 350000
        hiddenMarketPrice: 900000   // Was 600000
    }
];

// ============================================================================
// MARKET EVENTS (unchanged)
// ============================================================================

const MARKET_EVENTS = [
    {
        title: "AI Boom!",
        description: "Firms with 'Cutting-Edge' tech get a 1.5x productivity boost this round."
    },
    {
        title: "Economic Downturn",
        description: "All project rewards are 20% lower this round."
    },
    {
        title: "Talent War",
        description: "Employee satisfaction decreases by 10 for all firms unless salary is 'High'."
    }
];

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    STARTING_CAPITAL,
    SETUP_DATA,
    ALL_PROJECTS_POOL,
    MARKET_EVENTS,
    FORMULA_CONSTANTS  // NEW
};