// src/constants/gameData.js

const STARTING_CAPITAL = 2000000;
const GAME_ID = 'game123';

const FORMULA_CONSTANTS = {
    MAX_ACCEPTABLE_LEVERAGE: 5.5,
    LEVERAGE_QUALITY_MULTIPLIER: 0.72,
    OVERWORK_THRESHOLD: 1.0,
    BURNOUT_QUALITY_PENALTY: 0.10,
    MIN_COMPETENCY_RATIO: 0.60,
    SUCCESS_BASE: 1.2,
    BASE_COST_PER_COMPLEXITY: 1000,
    LEVERAGE_COST_INCREASE: 0.05,
    GRUNT_WORK_BASE: 3200,  // per unused capacity point (4x base)
};

const SETUP_DATA = {
    office: {
        basic: {
            name: "Basic Office",
            cost: 100000,
            clientBoost: 0,
            capacityBoost: 0,
            description: "Functional workspace. No frills, no impression."
        },
        modern: {
            name: "Modern Office",
            cost: 400000,
            clientBoost: 5,
            capacityBoost: 5,
            description: "Glass meeting rooms, decent coffee. Clients take you seriously."
        },
        premium: {
            name: "Premium HQ",
            cost: 800000,
            clientBoost: 12,
            capacityBoost: 15,
            description: "Corner office, city views. The address alone opens doors."
        }
    },

    tech: {
        basic: {
            name: "Basic Stack",
            cost: 50000,
            prodBoost: 0,
            competencyBoost: 0,
            description: "Email, spreadsheets, manual everything."
        },
        advanced: {
            name: "Advanced Stack",
            cost: 300000,
            prodBoost: 10,
            competencyBoost: 5,
            description: "Document management, templates, basic automation."
        },
        "cutting-edge": {
            name: "Cutting-Edge Stack",
            cost: 600000,
            prodBoost: 20,
            competencyBoost: 15,
            description: "AI-assisted research, automated workflows, analytics."
        }
    },

    employees: {
        juniors: {
            name: "Junior Associate",
            hireCost: 100000,
            capacity: 8,
            competency: 1,
            description: "Cheap capacity. Can handle volume but not complexity.",
            maxAtSetup: 3
        },
        mediors: {
            name: "Mid-Level Associate",
            hireCost: 300000,
            capacity: 6,
            competency: 5,
            description: "Balanced. Can handle standard work independently.",
            maxAtSetup: 2
        },
        seniors: {
            name: "Senior Associate",
            hireCost: 500000,
            capacity: 7,
            competency: 12,
            description: "Skilled. Essential for complex and elite matters.",
            maxAtSetup: 1
        },
        partners: {
            name: "Partner",
            hireCost: 850000,
            capacity: 8,
            competency: 20,
            description: "Highest competency. Required for elite-tier projects.",
            maxAtSetup: 1,
            minAtSetup: 1
        }
    },
};

// Only 2 upgrade tracks: AI (productivity) and Client (clientSatisfaction)
const UPGRADES = {
    ai: {
        name: "AI & Automation",
        metric: "productivity",
        levels: [
            { name: "Document Automation", cost: 300000, boost: 10, capacityBoost: 3, description: "Automate routine document review and generation." },
            { name: "AI Research Assistant", cost: 700000, boost: 15, capacityBoost: 6, description: "AI-powered legal research. Cuts prep time in half." },
            { name: "Full AI Integration", cost: 1500000, boost: 25, capacityBoost: 12, description: "End-to-end AI workflow. Industry-leading efficiency." },
        ]
    },
    client: {
        name: "Client Development",
        metric: "clientSatisfaction",
        levels: [
            { name: "Marketing Campaign", cost: 250000, boost: 10, capacityBoost: 2, description: "Brand awareness. Attract better clients." },
            { name: "Client Portal", cost: 600000, boost: 15, capacityBoost: 4, description: "Self-service portal with real-time case updates." },
            { name: "Industry Leadership", cost: 1200000, boost: 25, capacityBoost: 8, description: "Thought leadership, keynotes, top-tier reputation." },
        ]
    },
};

// Only 2 metrics now
const METRIC_INFO = {
    productivity: {
        name: "Productivity",
        color: "amber",
        shortDesc: "How efficiently your team works",
        longDesc: "Directly reduces project execution costs and increases grunt work income. Higher productivity means higher profit margins on everything you do.",
        improvedBy: "AI & Automation upgrades, advanced tech stack"
    },
    clientSatisfaction: {
        name: "Client Satisfaction",
        color: "blue",
        shortDesc: "How much clients trust your firm",
        longDesc: "Worth 30% of your bid score. Higher satisfaction lets you charge more and still win bids. Increases when you complete projects successfully, decreases when you fail.",
        improvedBy: "Client Development upgrades, completing projects successfully"
    },
    cash: {
        name: "Cash",
        color: "emerald",
        longDesc: "Your firm's liquid capital. Used for hiring staff and buying upgrades. If you drop below zero, you'll need to generate profit quickly to avoid bankruptcy.",
        improvedBy: "Winning bids, completing projects, grunt work"
    },
    capacity: {
        name: "Capacity",
        color: "blue",
        longDesc: "Total work units your team can handle each round. Each project consumes a specific amount of capacity.",
        improvedBy: "Hiring more staff (juniors provide the most capacity)"
    },
    competency: {
        name: "Competency",
        color: "purple",
        longDesc: "The technical skill level of your firm. Higher total competency is required for more complex projects to succeed.",
        improvedBy: "Hiring senior staff and partners"
    },
    leverage: {
        name: "Leverage",
        color: "orange",
        longDesc: "The ratio of junior/mid staff to senior/partners. High leverage reduces success chances on complex projects (complexity > 40) but keeps costs lower.",
        improvedBy: "Balancing your team with more senior staff"
    },
    gruntWork: {
        name: "Grunt Work",
        color: "stone",
        longDesc: "Revenue generated from any unused capacity at the end of a round. Represents small administrative tasks and minor filings.",
        improvedBy: "Higher productivity multipliers"
    }
};

const ALL_PROJECTS_POOL = [
    { id: 1, name: "Simple Contract Review", complexity: 30, capacityCost: 10, estimatedCost: 45000, hiddenMarketPrice: 90000 },
    { id: 2, name: "Startup Incorporation", complexity: 40, capacityCost: 15, estimatedCost: 67500, hiddenMarketPrice: 135000 },
    { id: 3, name: "Employment Dispute", complexity: 50, capacityCost: 20, estimatedCost: 105000, hiddenMarketPrice: 210000 },
    { id: 4, name: "Mid-Market M&A", complexity: 70, capacityCost: 35, estimatedCost: 225000, hiddenMarketPrice: 450000 },
    { id: 5, name: "Patent Litigation", complexity: 90, capacityCost: 50, estimatedCost: 337500, hiddenMarketPrice: 675000 },
    { id: 6, name: "Real Estate Zoning", complexity: 45, capacityCost: 20, estimatedCost: 82500, hiddenMarketPrice: 165000 },
    { id: 7, name: "Corporate Restructuring", complexity: 80, capacityCost: 45, estimatedCost: 300000, hiddenMarketPrice: 600000 },
    { id: 8, name: "IPO Filing", complexity: 100, capacityCost: 60, estimatedCost: 525000, hiddenMarketPrice: 1050000 },
    { id: 9, name: "Small Claims Court", complexity: 20, capacityCost: 5, estimatedCost: 15000, hiddenMarketPrice: 37500 },
    { id: 10, name: "Data Privacy Audit", complexity: 60, capacityCost: 25, estimatedCost: 135000, hiddenMarketPrice: 270000 },
    { id: 11, name: "Tax Advisory", complexity: 55, capacityCost: 20, estimatedCost: 120000, hiddenMarketPrice: 240000 },
    { id: 12, name: "Global Antitrust Filing", complexity: 95, capacityCost: 55, estimatedCost: 450000, hiddenMarketPrice: 900000 }
];

const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#06B6D4'];

const GAME_EVENTS = [
    // Global events
    { id: 'recession', name: 'Recession', description: 'Clients cut budgets due to economic downturn.', type: 'global', effect: 'marketPriceMod', value: -0.20, display: 'Market prices -20% next round' },
    { id: 'legal_boom', name: 'Legal Boom', description: 'New regulation wave creates extra demand.', type: 'global', effect: 'bonusProjects', value: 3, display: '+3 bonus medium-complexity projects' },
    { id: 'grad_flood', name: 'Graduate Flood', description: 'Law school graduates flood the market.', type: 'global', effect: 'hiringDiscount', value: 0.50, target: 'juniors', display: 'Junior hiring cost -50%' },
    { id: 'reputation_matters', name: 'Reputation Matters', description: 'Major client scandal makes reputation critical.', type: 'global', effect: 'clientSatWeight', value: 2.0, display: 'Client Satisfaction counts double in bids' },
    { id: 'ai_regulation', name: 'AI Regulation Change', description: 'New AI regulations penalize firms without AI upgrades.', type: 'global', effect: 'productivityPenalty', value: -5, condition: 'noAiUpgrade', display: 'Teams without AI upgrades: Productivity -5' },
    { id: 'new_ai_tool', name: 'New AI Tool Released', description: 'A breakthrough AI tool boosts all firms.', type: 'global', effect: 'productivityBonus', value: 5, display: 'All teams: Productivity +5' },
    { id: 'interest_hike', name: 'Interest Rate Hike', description: 'High interest rates benefit cash-rich firms.', type: 'global', effect: 'interestBonus', value: 0.05, display: 'Cash reserves earn 5% interest' },
    // Targeted events
    { id: 'windfall', name: 'Windfall Referral', description: 'A random team gets a lucky referral.', type: 'targeted', targetRule: 'random', effect: 'cashBonus', value: 100000, display: 'Random team gets 100k bonus' },
    { id: 'partner_defection', name: 'Partner Defection', description: 'A partner leaves a random firm.', type: 'targeted', targetRule: 'random', effect: 'loseEmployee', target: 'partners', value: 1, display: 'Random team loses 1 partner' },
    { id: 'talent_poaching', name: 'Talent Poaching', description: 'Competitor poaches from the richest firm.', type: 'targeted', targetRule: 'highestMoney', effect: 'loseEmployee', target: 'seniors', value: 1, display: 'Richest team loses 1 senior' },
    { id: 'underdog_bonus', name: 'Underdog Bonus', description: 'The struggling firm gets client goodwill.', type: 'targeted', targetRule: 'lowestProfit', effect: 'clientSatBonus', value: 10, display: 'Lowest-profit team: Client Sat +10' },
    { id: 'leader_scrutiny', name: 'Market Leader Scrutiny', description: 'Regulators scrutinize the top firm.', type: 'targeted', targetRule: 'highestProfit', effect: 'clientSatPenalty', value: -5, display: 'Highest-profit team: Client Sat -5' },
    { id: 'pro_bono', name: 'Pro Bono Mandate', description: 'Bar association mandates free work from the most reputable firm.', type: 'targeted', targetRule: 'highestClientSat', effect: 'cashPenalty', value: -50000, display: 'Highest client-sat team: -50k (pro bono)' },
    { id: 'big_referral', name: 'Big Client Referral', description: 'A major client refers business to the best-performing firm.', type: 'targeted', targetRule: 'highestRoundProfit', effect: 'cashBonus', value: 150000, display: 'Best round-profit team gets 150k bonus' },
];

const data = {
    STARTING_CAPITAL, GAME_ID, SETUP_DATA, UPGRADES, ALL_PROJECTS_POOL,
    FORMULA_CONSTANTS, METRIC_INFO, COLORS, GAME_EVENTS,
};

export default data;
