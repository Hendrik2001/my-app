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
    GRUNT_WORK_BASE: 800,   // per unused capacity point
};

const SETUP_DATA = {
    office: {
        basic: {
            name: "Basic Office",
            cost: 100000,
            clientBoost: 0,
            description: "Functional workspace. No frills, no impression."
        },
        modern: {
            name: "Modern Office",
            cost: 400000,
            clientBoost: 5,
            description: "Glass meeting rooms, decent coffee. Clients take you seriously."
        },
        premium: {
            name: "Premium HQ",
            cost: 800000,
            clientBoost: 12,
            description: "Corner office, city views. The address alone opens doors."
        }
    },

    tech: {
        basic: {
            name: "Basic Stack",
            cost: 50000,
            prodBoost: 0,
            description: "Email, spreadsheets, manual everything."
        },
        advanced: {
            name: "Advanced Stack",
            cost: 300000,
            prodBoost: 10,
            description: "Document management, templates, basic automation."
        },
        "cutting-edge": {
            name: "Cutting-Edge Stack",
            cost: 600000,
            prodBoost: 20,
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
            hireCost: 550000,
            capacity: 4,
            competency: 12,
            description: "Skilled. Essential for complex and elite matters.",
            maxAtSetup: 1
        },
        partners: {
            name: "Partner",
            hireCost: 900000,
            capacity: 3,
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
            { name: "Document Automation", cost: 300000, boost: 10, description: "Automate routine document review and generation." },
            { name: "AI Research Assistant", cost: 700000, boost: 15, description: "AI-powered legal research. Cuts prep time in half." },
            { name: "Full AI Integration", cost: 1500000, boost: 25, description: "End-to-end AI workflow. Industry-leading efficiency." },
        ]
    },
    client: {
        name: "Client Development",
        metric: "clientSatisfaction",
        levels: [
            { name: "Marketing Campaign", cost: 250000, boost: 10, description: "Brand awareness. Attract better clients." },
            { name: "Client Portal", cost: 600000, boost: 15, description: "Self-service portal with real-time case updates." },
            { name: "Industry Leadership", cost: 1200000, boost: 25, description: "Thought leadership, keynotes, top-tier reputation." },
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

export default {
    STARTING_CAPITAL, GAME_ID, SETUP_DATA, UPGRADES, ALL_PROJECTS_POOL,
    FORMULA_CONSTANTS, METRIC_INFO, COLORS,
};
