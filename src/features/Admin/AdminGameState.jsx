import React, { useState } from 'react';
import { db } from '../../firebase/firebase.js';
// Added setDoc for creating/resetting game document
import { doc, writeBatch, collection, getDocs, updateDoc, setDoc } from 'firebase/firestore';
import gameData from '../../constants/gameData.js';
import { toast } from 'sonner';
// First, add these imports at the top of AdminGameState.jsx:
import {
    calculateTotalCapacity,
    calculateActualCompetency,
    calculateProjectCost,
    calculateProjectSuccessChance,
    applyInvestmentEffects,
    calculateFixedCosts
} from '../../utils/gameCalculations.js';
// Helper function to calculate results (this is the core engine)
function calculateRoundResults(team, teamBids, currentProjects, gameState, setupData) {
    const { FORMULA_CONSTANTS } = gameData;
    const logs = [];
    let profit = 0;

    // Calculate fixed costs
    const fixedCosts = calculateFixedCosts(team);
    profit -= fixedCosts;
    logs.push({ message: `Fixed costs: €${fixedCosts.toLocaleString()}` });

    // Pay investments
    const totalInvestments = (team.investments?.ai || 0) +
        (team.investments?.client || 0) +
        (team.investments?.dividends || 0);
    profit -= totalInvestments;
    logs.push({ message: `Investments: €${totalInvestments.toLocaleString()}` });

    // Apply investment effects to metrics
    let newMetrics = applyInvestmentEffects(team.metrics || {}, team.investments || {});

    // Calculate capacity usage
    const totalCapacity = calculateTotalCapacity(team);
    let capacityUsed = 0;

    teamBids.forEach(bid => {
        const project = currentProjects.find(p => p.id === bid.projectId);
        if (project) {
            capacityUsed += project.capacityCost;
        }
    });

    // Check for overwork
    let burnoutPenalty = 0;
    const { OVERWORK_THRESHOLD, BURNOUT_EMP_SAT_PENALTY, BURNOUT_QUALITY_PENALTY } = FORMULA_CONSTANTS;

    if (capacityUsed > totalCapacity * OVERWORK_THRESHOLD) {
        const overloadPct = (capacityUsed - totalCapacity) / totalCapacity;
        const empSatLoss = (overloadPct / 0.1) * BURNOUT_EMP_SAT_PENALTY;
        burnoutPenalty = (overloadPct / 0.1) * BURNOUT_QUALITY_PENALTY;

        newMetrics.employeeSatisfaction = (newMetrics.employeeSatisfaction || 50) - empSatLoss;
        logs.push({
            message: `⚠️ Overworked! ${capacityUsed}/${totalCapacity} capacity. Emp Sat -${empSatLoss.toFixed(1)}, Quality -${(burnoutPenalty * 100).toFixed(0)}%`
        });
    } else {
        logs.push({ message: `Capacity: ${capacityUsed}/${totalCapacity} ✓` });
    }

    // Execute projects
    let projectsSucceeded = 0;
    let projectsFailed = 0;

    teamBids.forEach(bid => {
        const project = currentProjects.find(p => p.id === bid.projectId);
        if (!project) return;

        const cost = calculateProjectCost(team, project);
        const successChance = calculateProjectSuccessChance(team, project, burnoutPenalty);
        const success = Math.random() < successChance;

        // Fix: Use bid.amount if bid.bidPrice is undefined (legacy/new naming issue)
        const bidAmount = bid.bidPrice || bid.amount || 0;

        if (success) {
            const projectProfit = bidAmount - cost;
            profit += projectProfit;
            newMetrics.clientSatisfaction = (newMetrics.clientSatisfaction || 50) + 5;
            projectsSucceeded++;
            logs.push({
                message: `✓ Completed "${project.name}" for €${bidAmount.toLocaleString()} (cost: €${cost.toLocaleString()}, profit: €${projectProfit.toLocaleString()})`
            });
        } else {
            const penalty = Math.floor(cost * 0.5);
            profit -= penalty;
            newMetrics.clientSatisfaction = (newMetrics.clientSatisfaction || 50) - 10;
            projectsFailed++;
            logs.push({
                message: `✗ Failed "${project.name}" - Quality issues. Paid €${penalty.toLocaleString()} penalty (${(successChance * 100).toFixed(0)}% success chance)`
            });
        }
    });

    // Grunt work if no projects won
    if (teamBids.length === 0) {
        const actualComp = calculateActualCompetency(team);
        const gruntProfit = Math.floor(actualComp * 100 - fixedCosts);
        if (gruntProfit > 0) {
            profit += gruntProfit;
            newMetrics.partnerSatisfaction = (newMetrics.partnerSatisfaction || 50) - 5;
            logs.push({ message: `No projects won. Did grunt work for €${gruntProfit.toLocaleString()} (partners unhappy)` });
        } else {
            logs.push({ message: `No projects won and no grunt work available.` });
        }
    }

    // Partner satisfaction based on profit
    if (profit > 100000) {
        const boost = profit / 100000;
        newMetrics.partnerSatisfaction = (newMetrics.partnerSatisfaction || 50) + boost;
    } else if (profit < 0) {
        newMetrics.partnerSatisfaction = (newMetrics.partnerSatisfaction || 50) - 10;
    }

    // Clamp all metrics between 10 and 100
    Object.keys(newMetrics).forEach(key => {
        newMetrics[key] = Math.max(10, Math.min(100, newMetrics[key]));
    });

    const finalMoney = team.money + profit;

    // Summary log
    logs.push({
        message: `Round Summary: Profit €${profit.toLocaleString()}, Cash: €${finalMoney.toLocaleString()}`
    });

    return {
        newMoney: finalMoney,
        newMetrics: newMetrics,
        profit: profit,
        logs: logs,
        newInvestments: { ai: 0, client: 0, dividends: 0 },
        newBids: {},
        projectsSucceeded,
        projectsFailed
    };
}

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
        if (!window.confirm("ARE YOU SURE you want to reset the game? This will force ALL teams back to the setup screen. Projects will remain.")) {
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

            // 2. (REMOVED) Delete all projects in the 'projects' subcollection
            // Projects now persist across resets.

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

        const nextRound = gameState.currentRound + 1;
        if (nextRound > 10) {
            toast.error("Game Over! Max rounds reached (10).");
            return;
        }

        setIsLoading(true);
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