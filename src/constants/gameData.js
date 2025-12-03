// --- Static Game Data (from GDD) ---
const STARTING_CAPITAL = 8000000;

const SETUP_DATA = {
    office: {
        basic: { name: "Basic Office", cost: 250000, roundCost: 20000, clientBoost: 0, empBoost: 0 },
        modern: { name: "Modern Office", cost: 750000, roundCost: 60000, clientBoost: 5, empBoost: 5 },
        premium: { name: "Premium HQ", cost: 1500000, roundCost: 120000, clientBoost: 12, empBoost: 10 }
    },
    tech: {
        basic: { name: "Basic Stack", cost: 100000, prodBoost: 0 },
        advanced: { name: "Advanced Stack", cost: 500000, prodBoost: 10 },
        "cutting-edge": { name: "Cutting-Edge Stack", cost: 1000000, prodBoost: 20 }
    },
    employees: {
        juniors: { name: "Juniors", hireCost: 20000, baseSalary: 40000, capacity: 10, competency: 3 },
        mediors: { name: "Mediors", hireCost: 40000, baseSalary: 70000, capacity: 8, competency: 6 },
        seniors: { name: "Seniors", hireCost: 80000, baseSalary: 100000, capacity: 5, competency: 10 },
        partners: { name: "Partners", hireCost: 150000, baseSalary: 150000, capacity: 5, competency: 15 }
    },
    salaryMultipliers: [0.8, 1.0, 1.2],
    salarySatisfactionBoost: [-5, 0, 5]
};

const ALL_PROJECTS_POOL = [
    { id: 1, name: "Simple Contract Review", complexity: 30, capacityCost: 10, estimatedCost: 30000, hiddenMarketPrice: 60000 },
    { id: 2, name: "Startup Incorporation", complexity: 40, capacityCost: 15, estimatedCost: 50000, hiddenMarketPrice: 90000 },
    { id: 3, name: "Employment Dispute", complexity: 50, capacityCost: 20, estimatedCost: 80000, hiddenMarketPrice: 140000 },
    { id: 4, name: "Mid-Market M&A", complexity: 70, capacityCost: 35, estimatedCost: 180000, hiddenMarketPrice: 300000 },
    { id: 5, "name": "Patent Litigation", complexity: 90, capacityCost: 50, estimatedCost: 300000, hiddenMarketPrice: 450000 },
    { id: 6, name: "Real Estate Zoning", complexity: 45, capacityCost: 20, estimatedCost: 60000, hiddenMarketPrice: 110000 },
    { id: 7, name: "Corporate Restructuring", complexity: 80, capacityCost: 45, estimatedCost: 250000, hiddenMarketPrice: 400000 },
    { id: 8, name: "IPO Filing", complexity: 100, capacityCost: 60, estimatedCost: 400000, hiddenMarketPrice: 700000 },
    { id: 9, name: "Small Claims Court", complexity: 20, capacityCost: 5, estimatedCost: 10000, hiddenMarketPrice: 25000 },
    { id: 10, name: "Data Privacy Audit", complexity: 60, capacityCost: 25, estimatedCost: 100000, hiddenMarketPrice: 180000 },
    { id: 11, name: "Tax Advisory", complexity: 55, capacityCost: 20, estimatedCost: 90000, hiddenMarketPrice: 160000 },
    { id: 12, name: "Global Antitrust Filing", complexity: 95, capacityCost: 55, estimatedCost: 350000, hiddenMarketPrice: 600000 }
];

const MARKET_EVENTS = [
    { title: "AI Boom!", description: "Firms with 'Cutting-Edge' tech get a 1.5x productivity boost this round." },
    { title: "Economic Downturn", description: "All project rewards are 20% lower this round." },
    { title: "New Firm Enters", description: "A new competitor enters. Bid competition is higher (Client Sat boost is halved)." },
    { title: "War for Talent", description: "Firms with 'Low' salaries suffer a -15 Employee Satisfaction hit." }
];

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#6366F1'];

// Wrap all constants in a single object and export it
const gameData = {
    STARTING_CAPITAL,
    SETUP_DATA,
    ALL_PROJECTS_POOL,
    MARKET_EVENTS,
    COLORS
};

export default gameData;