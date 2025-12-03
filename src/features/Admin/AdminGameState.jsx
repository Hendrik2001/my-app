import React, { useState } from 'react';
import { db } from '../../firebase/firebase.js';
// Added setDoc for creating/resetting game document
import { doc, writeBatch, collection, getDocs, updateDoc, setDoc } from 'firebase/firestore'; 
import gameData from '../../constants/gameData.js';
import { toast } from 'sonner';

// Helper function to calculate results (this is the core engine)
const calculateRoundResults = (team, allBidsForTeam, projects, gameState, gameConfig) => {
    const logs = [];
    let profit = 0;
    const { employees, config } = team;
    const salaryMultiplier = gameConfig.salaryMultipliers[config.salaryIndex];
    let fixedCosts = 0;
    let totalCapacity = 0;
    let totalCompetency = 0;
    for (const [type, count] of Object.entries(employees)) {
        const stats = gameConfig.employees[type];
        fixedCosts += stats.baseSalary * salaryMultiplier * count;
        totalCapacity += stats.capacity * count;
        totalCompetency += stats.competency * count;
    }
    const officeCost = gameConfig.office[config.office].roundCost;
    fixedCosts += officeCost;
    profit -= fixedCosts;
    logs.push({ message: `Paid fixed costs (salaries, office): €${fixedCosts.toLocaleString()}` });
    const { investments } = team;
    let newMetrics = { ...team.metrics };
    if (investments.ai > 0) {
        newMetrics.productivity += (investments.ai / 50000);
        profit -= investments.ai;
        logs.push({ message: `Invested €${investments.ai.toLocaleString()} in AI & Tech.` });
    }
    if (investments.client > 0) {
        newMetrics.clientSatisfaction += (investments.client / 25000);
        profit -= investments.client;
        logs.push({ message: `Invested €${investments.client.toLocaleString()} in Client Relations.` });
    }
    if (investments.dividends > 0) {
        newMetrics.partnerSatisfaction += (investments.dividends / 100000);
        profit -= investments.dividends;
        logs.push({ message: `Paid €${investments.dividends.toLocaleString()} in dividends.` });
    }
    let capacityUsed = 0;
    let projectsWon = 0;
    for (const bid of allBidsForTeam) {
        const project = projects.find(p => p.id === bid.projectId);
        if (!project) continue;
        const bidIsCompetitive = bid.amount <= project.hiddenMarketPrice;
        const winChance = team.metrics.clientSatisfaction / 100;
        if (bidIsCompetitive && Math.random() < winChance) {
            projectsWon++;
            capacityUsed += project.capacityCost;
            const projectProfit = bid.amount - project.estimatedCost;
            profit += projectProfit;
            logs.push({ message: `✅ Won project "${project.name}"! Profit: €${projectProfit.toLocaleString()}` });
        } else {
            logs.push({ message: `❌ Lost bid for "${project.name}".` });
        }
    }
    if (projectsWon === 0) {
        newMetrics.partnerSatisfaction -= 5;
        logs.push({ message: "No projects won. Partners are unhappy." });
    }
    if (capacityUsed > totalCapacity) {
        const overload = (capacityUsed / totalCapacity) * 10;
        newMetrics.employeeSatisfaction -= overload;
        logs.push({ message: `Team is overworked! (${capacityUsed}/${totalCapacity} capacity). Employee Sat. decreased.` });
    } else {
        newMetrics.employeeSatisfaction += 2;
    }
    if (profit < 0) {
        newMetrics.partnerSatisfaction -= 5;
    } else if (profit > 100000) {
        newMetrics.partnerSatisfaction += (profit / 100000);
    }
    Object.keys(newMetrics).forEach(key => {
        newMetrics[key] = Math.max(10, Math.min(newMetrics[key], 100));
    });
    const finalMoney = team.money + profit;
    return {
        newMoney: finalMoney,
        newMetrics: newMetrics,
        profit: profit,
        logs: logs,
        newInvestments: { ai: 0, client: 0, dividends: 0 },
        newBids: {},
    };
};

export const AdminGameState = ({ gamePath, gameState, allTeams, projects }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    // Function to create/start the game
    const handleStartGame = async () => {
        if (!window.confirm("Are you sure you want to START a new game? This will create 'games/game123' and set it to Round 1.")) {
            return;
        }
        setIsLoading(true);
        try {
            const gameDocRef = doc(db, gamePath);
            await setDoc(gameDocRef, { 
                currentRound: 1, 
                stage: 'investment' 
            });
            toast.success("Game Started! Set to Round 1, Investment Phase.");
        } catch (err) {
            console.error(err);
            toast.error(`Failed to start game: ${err.message}`);
        }
        setIsLoading(false);
    };

    // Function to hard reset the game
    const handleResetGame = async () => {
        if (!window.confirm("ARE YOU SURE you want to reset the game? This will delete ALL projects and force ALL teams back to the setup screen.")) {
            return;
        }
        setIsResetting(true);
        try {
            const batch = writeBatch(db);

            // 1. Reset all teams
            for (const team of allTeams) {
                const teamRef = doc(db, gamePath, 'teams', team.id);
                batch.update(teamRef, {
                    money: 0,
                    metrics: {},
                    config: {},
                    investments: {},
                    bids: {},
                    profit: 0,
                    needsSetup: true // This forces them back to FirmSetup
                });
            }

            // 2. Delete all projects in the 'projects' subcollection
            const projectsRef = collection(db, gamePath, 'projects');
            const projectsSnap = await getDocs(projectsRef);
            projectsSnap.forEach(projectDoc => {
                batch.delete(projectDoc.ref);
            });

            // 3. Reset the main game document
            const gameDocRef = doc(db, gamePath);
            batch.set(gameDocRef, { // Use setDoc to overwrite
                currentRound: 1,
                stage: 'investment'
            });

            await batch.commit();
            toast.success("Game has been reset! All teams must re-run setup.");

        } catch (err) {
            console.error(err);
            toast.error(`Failed to reset game: ${err.message}`);
        }
        setIsResetting(false);
    };

    // Function to set stage (investment/bidding)
    const setStage = async (stage) => {
        setIsLoading(true);
        try {
            const gameDocRef = doc(db, gamePath);
            await updateDoc(gameDocRef, { stage: stage });
            toast.success(`Game stage set to: ${stage}`);
        } catch (err) {
            console.error(err);
            toast.error(`Failed to set stage: ${err.message}`);
        }
        setIsLoading(false);
    };

    // Function to advance round
    const advanceRound = async () => {
        if (!window.confirm("Are you sure you want to advance to the next round? This will process all team results.")) {
            return;
        }
        
        setIsLoading(true);
        const nextRound = gameState.currentRound + 1;
        const currentProjects = projects.filter(p => p.round === gameState.currentRound);

        try {
            const batch = writeBatch(db);
            
            const allBids = [];
            for (const project of currentProjects) {
                const bidsRef = collection(db, gamePath, 'projects', project.id, 'bids');
                const bidsSnap = await getDocs(bidsRef);
                bidsSnap.forEach(bidDoc => {
                    allBids.push({
                        projectId: project.id,
                        teamId: bidDoc.id,
                        ...bidDoc.data()
                    });
                });
            }

            for (const team of allTeams) {
                const teamBids = allBids.filter(b => b.teamId === team.id);
                const teamRef = doc(db, gamePath, 'teams', team.id);
                
                const results = calculateRoundResults(
                    team,
                    teamBids,
                    currentProjects,
                    gameState,
                    gameData.SETUP_DATA
                );

                batch.update(teamRef, {
                    money: results.newMoney,
                    metrics: results.newMetrics,
                    profit: results.profit,
                    investments: results.newInvestments,
                    bids: results.newBids,
                });

                const logCollectionRef = collection(db, teamRef.path, 'logs');
                results.logs.forEach(log => {
                    const logRef = doc(logCollectionRef);
                    batch.set(logRef, {
                        ...log,
                        round: gameState.currentRound
                    });
                });
            }

            const gameDocRef = doc(db, gamePath);
            batch.update(gameDocRef, {
                currentRound: nextRound,
                stage: "investment",
            });

            await batch.commit();
            toast.success(`Advanced to Round ${nextRound}!`);

        } catch (err) {
            console.error(err);
            toast.error(`Round failed to advance: ${err.message}`);
        }
        setIsLoading(false);
    };

    // --- RENDER LOGIC ---
    if (!gameState) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">No Active Game Found</h2>
                <p className="text-gray-600 mb-6">The document at <strong>{gamePath}</strong> does not exist.</p>
                <button
                    onClick={handleStartGame}
                    disabled={isLoading}
                    className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-green-700 disabled:opacity-50"
                >
                    {isLoading ? "Starting..." : "Start New Game (Round 1)"}
                </button>
            </div>
        );
    }

    // If the game *does* exist, show the normal controls
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Game Controls</h2>
            <div className="flex flex-wrap gap-4">
                <button
                    onClick={() => setStage('investment')}
                    disabled={isLoading || gameState.stage === 'investment'}
                    className="flex-1 bg-blue-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-blue-600 disabled:opacity-50"
                >
                    Set to INVESTMENT
                </button>
                <button
                    onClick={() => setStage('bidding')}
                    disabled={isLoading || gameState.stage === 'bidding'}
                    className="flex-1 bg-yellow-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-yellow-600 disabled:opacity-50"
                >
                    Set to BIDDING
                </button>
                <button
                    onClick={advanceRound}
                    disabled={isLoading}
                    className="flex-1 bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-green-700 disabled:opacity-50"
                >
                    {isLoading ? "Processing..." : `Advance to Round ${gameState.currentRound + 1}`}
                </button>
            </div>
            
            {/* --- NEW RESET BUTTON SECTION --- */}
            <div className="mt-6 border-t pt-6">
                <button
                    onClick={handleResetGame}
                    disabled={isResetting || isLoading}
                    className="w-full bg-red-800 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-red-900 disabled:opacity-50"
                >
                    {isResetting ? "Resetting Game..." : "HARD RESET GAME"}
                </button>
                <p className="text-sm text-gray-600 mt-2 text-center">
                    Warning: This deletes all projects and forces all teams back to the setup screen.
                </p>
            </div>
        </div>
    );
};