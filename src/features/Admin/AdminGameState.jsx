import React, { useState, useMemo } from 'react';
import { db } from '../../firebase/firebase.js';
import { doc, writeBatch, collection, getDocs, updateDoc, setDoc } from 'firebase/firestore';
import gameData from '../../constants/gameData.js';
import { toast } from 'sonner';
import { ConfirmBar } from '../../components/ConfirmBar.jsx';
import {
    calculateTotalCapacity, calculateActualCompetency, calculateProjectCost,
    calculateProjectSuccessChance, calculateGruntWork, selectBidWinners
} from '../../utils/gameCalculations.js';
import { CheckCircle, Clock } from 'lucide-react';

function getProjectsForRound(projects, round) {
    return projects.filter(p => {
        if (p.rounds && Array.isArray(p.rounds)) return p.rounds.includes(round);
        return p.round === round;
    });
}

function calculateRoundResults(team, wonBids, currentProjects) {
    const { FORMULA_CONSTANTS } = gameData;
    const logs = [];
    let profit = 0;

    const totalCapacity = calculateTotalCapacity(team);
    let capacityUsed = 0;
    wonBids.forEach(bid => {
        const p = currentProjects.find(pr => pr.id === bid.projectId);
        if (p) capacityUsed += p.capacityCost;
    });

    let burnoutPenalty = 0;
    let newMetrics = { ...(team.metrics || { productivity: 0, clientSatisfaction: 0 }) };

    if (capacityUsed > totalCapacity * FORMULA_CONSTANTS.OVERWORK_THRESHOLD) {
        const overloadPct = (capacityUsed - totalCapacity) / totalCapacity;
        burnoutPenalty = (overloadPct / 0.1) * FORMULA_CONSTANTS.BURNOUT_QUALITY_PENALTY;
        logs.push({ message: `[WARN] Overworked: ${capacityUsed}/${totalCapacity} capacity. Project quality reduced.` });
    } else if (wonBids.length > 0) {
        logs.push({ message: `Capacity usage: ${capacityUsed}/${totalCapacity}` });
    }

    wonBids.forEach(bid => {
        const project = currentProjects.find(p => p.id === bid.projectId);
        if (!project) return;
        const cost = calculateProjectCost(team, project);
        const successChance = calculateProjectSuccessChance(team, project, burnoutPenalty);
        const success = Math.random() < successChance;
        const bidAmount = bid.bidPrice || bid.amount || 0;

        if (success) {
            const projectProfit = bidAmount - cost;
            profit += projectProfit;
            // Client satisfaction increases on success
            newMetrics.clientSatisfaction = Math.min(100, (newMetrics.clientSatisfaction || 0) + 3);
            logs.push({ message: `[OK] Completed "${project.name}" for ${bidAmount.toLocaleString()} (cost: ${cost.toLocaleString()}, profit: ${(bidAmount - cost).toLocaleString()}) | Client Sat +3` });
        } else {
            const penalty = Math.floor(cost * 0.5);
            profit -= penalty;
            newMetrics.clientSatisfaction = Math.max(0, (newMetrics.clientSatisfaction || 0) - 5);
            logs.push({ message: `[FAIL] Failed "${project.name}" -- quality issues. Penalty: ${penalty.toLocaleString()} (${(successChance * 100).toFixed(0)}% chance) | Client Sat -5` });
        }
    });

    // Grunt work
    const gruntIncome = calculateGruntWork(team, capacityUsed);
    if (gruntIncome > 0) {
        const unusedCap = Math.max(0, totalCapacity - capacityUsed);
        profit += gruntIncome;
        logs.push({ message: `Grunt work: ${unusedCap} unused cap = ${gruntIncome.toLocaleString()}` });
    }

    if (wonBids.length === 0 && gruntIncome === 0) {
        logs.push({ message: `No projects won and no capacity for grunt work.` });
    }

    // Clamp metrics
    Object.keys(newMetrics).forEach(k => { newMetrics[k] = Math.max(0, Math.min(100, newMetrics[k])); });
    const finalMoney = (team.money || 0) + profit;
    logs.push({ message: `Round Summary: ${profit >= 0 ? '+' : ''}${profit.toLocaleString()} | Cash: ${finalMoney.toLocaleString()}` });

    return { newMoney: finalMoney, newMetrics, profit, logs, newBids: {} };
}

export const AdminGameState = ({ gamePath, gameState, allTeams, projects }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [confirmState, setConfirmState] = useState(null);

    const { readyTeams, notReadyTeams, allReady, activeTeams, setupTeams } = useMemo(() => {
        const active = allTeams.filter(t => !t.needsSetup);
        const setup = allTeams.filter(t => t.needsSetup);
        const ready = active.filter(t => t.ready === true);
        const notReady = active.filter(t => t.ready !== true);
        return { readyTeams: ready, notReadyTeams: notReady, allReady: active.length > 0 && notReady.length === 0, activeTeams: active, setupTeams: setup };
    }, [allTeams]);

    // ── Helpers to delete all logs for a team ──
    const deleteTeamLogs = async (teamRef) => {
        const logsSnap = await getDocs(collection(db, teamRef.path, 'logs'));
        if (logsSnap.empty) return;
        const batch = writeBatch(db);
        logsSnap.forEach(d => batch.delete(d.ref));
        await batch.commit();
    };

    // ── ACTIONS ──
    const executeStartGame = async () => {
        setIsLoading(true);
        try {
            await setDoc(doc(db, gamePath), { currentRound: 1, stage: 'active' });
            toast.success("Game started. Round 1.");
        } catch (err) { toast.error(`Failed: ${err.message}`); }
        setIsLoading(false);
        setConfirmState(null);
    };

    const executeResetGame = async () => {
        setIsResetting(true);
        try {
            const batch = writeBatch(db);
            for (const team of allTeams) {
                const teamRef = doc(db, gamePath, 'teams', team.id);
                batch.update(teamRef, {
                    money: 0, metrics: {}, config: {}, employees: {}, upgrades: {},
                    investments: {}, bids: {}, profit: 0, needsSetup: true, ready: false,
                });
            }
            batch.set(doc(db, gamePath), { currentRound: 1, stage: 'active' });
            await batch.commit();

            // Delete all logs for each team (requires separate batches due to subcollections)
            for (const team of allTeams) {
                const teamRef = doc(db, gamePath, 'teams', team.id);
                await deleteTeamLogs(teamRef);
            }

            toast.success("Game reset. All logs cleared.");
        } catch (err) { toast.error(`Failed: ${err.message}`); }
        setIsResetting(false);
        setConfirmState(null);
    };

    const executeProcessRound = async (force = false) => {
        if (!force && !allReady) { toast.error("Not all teams ready."); return; }
        const nextRound = gameState.currentRound + 1;
        if (nextRound > 10) { toast.error("Game over."); return; }

        setIsLoading(true);
        const currentProjects = getProjectsForRound(projects, gameState.currentRound);

        try {
            const batch = writeBatch(db);
            const allBids = [];
            for (const project of currentProjects) {
                const bidsSnap = await getDocs(collection(db, gamePath, 'projects', project.id, 'bids'));
                bidsSnap.forEach(bidDoc => { allBids.push({ projectId: project.id, teamId: bidDoc.id, ...bidDoc.data() }); });
            }

            const { winners, results: bidResults } = selectBidWinners(allBids, currentProjects, allTeams);

            for (const team of allTeams) {
                if (team.needsSetup) continue;
                const teamRef = doc(db, gamePath, 'teams', team.id);
                const wonBids = Object.entries(winners).filter(([_, w]) => w.teamId === team.id).map(([pid, w]) => ({ ...w, projectId: pid }));
                const roundResults = calculateRoundResults(team, wonBids, currentProjects);

                const bidLogs = [];
                wonBids.forEach(bid => {
                    const p = currentProjects.find(pr => pr.id === bid.projectId);
                    if (!p) return;
                    const b = bid.breakdown;
                    bidLogs.push({ message: `[WON] "${p.name}" -- Score: ${bid.totalScore.toFixed(1)} (Price ${b.priceScore.toFixed(0)} | Rep ${b.reputationScore.toFixed(0)} | Comp ${b.competencyScore.toFixed(0)})` });
                });

                for (const [pid, scoredBids] of Object.entries(bidResults)) {
                    const p = currentProjects.find(pr => pr.id === pid);
                    if (!p) continue;
                    const myBid = scoredBids.find(b => b.teamId === team.id);
                    if (!myBid || myBid.won) continue;
                    const winner = scoredBids.find(b => b.won);
                    const reasons = myBid.lossReasons?.join(' | ') || 'Close competition';
                    bidLogs.push({ message: `[LOST] "${p.name}" (${myBid.totalScore.toFixed(1)} vs ${winner?.totalScore.toFixed(1)}) -- ${reasons}` });
                }

                batch.update(teamRef, { money: roundResults.newMoney, metrics: roundResults.newMetrics, profit: roundResults.profit, bids: roundResults.newBids, ready: false });
                const logRef = collection(db, teamRef.path, 'logs');
                [...bidLogs, ...roundResults.logs].forEach(log => { batch.set(doc(logRef), { ...log, round: gameState.currentRound }); });
            }

            for (const project of currentProjects) {
                const bidsSnap = await getDocs(collection(db, gamePath, 'projects', project.id, 'bids'));
                bidsSnap.forEach(bidDoc => batch.delete(bidDoc.ref));
            }

            batch.update(doc(db, gamePath), { currentRound: nextRound, stage: 'active' });
            await batch.commit();
            toast.success(`Round ${gameState.currentRound} processed. Now Round ${nextRound}.`);
        } catch (err) { console.error(err); toast.error(`Failed: ${err.message}`); }
        setIsLoading(false);
        setConfirmState(null);
    };

    // ── REQUEST (show inline confirm) ──
    const requestStart = () => setConfirmState({
        variant: 'info', message: "Start a new game at Round 1?",
        confirmLabel: "Start Game", onConfirm: executeStartGame,
    });
    const requestReset = () => setConfirmState({
        variant: 'danger', message: "HARD RESET: All teams return to setup. All logs will be deleted.",
        detail: "This cannot be undone.",
        confirmLabel: "Reset Everything", onConfirm: executeResetGame,
    });
    const requestProcess = (force) => {
        const round = gameState.currentRound;
        const msg = force
            ? `FORCE PROCESS Round ${round}? Some teams are not ready.`
            : `Process Round ${round}? All teams are ready.`;
        setConfirmState({
            variant: force ? 'warning' : 'info', message: msg,
            detail: `${getProjectsForRound(projects, round).length} projects this round.`,
            confirmLabel: `Process Round ${round}`, onConfirm: () => executeProcessRound(force),
        });
    };

    // ── RENDER ──
    if (!gameState) {
        return (
            <div className="bg-white p-6 border border-gray-200">
                <h2 className="text-lg font-semibold mb-4 text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>No Active Game</h2>
                {confirmState && <div className="mb-4"><ConfirmBar {...confirmState} onCancel={() => setConfirmState(null)} /></div>}
                <button onClick={requestStart} disabled={isLoading}
                    className="w-full bg-emerald-900 text-white font-semibold py-3 px-6 hover:bg-emerald-800 disabled:opacity-50 tracking-wide">
                    {isLoading ? "Starting..." : "START NEW GAME"}
                </button>
            </div>
        );
    }

    const roundProjectCount = getProjectsForRound(projects, gameState.currentRound).length;

    return (
        <div className="bg-white p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b border-gray-200 pb-2" style={{ fontFamily: 'Georgia, serif' }}>Game Controls</h2>

            <div className="mb-4 p-3 bg-stone-50 border border-stone-200 text-sm text-gray-600 font-mono">
                Round {gameState.currentRound} | {activeTeams.length} active teams | {roundProjectCount} projects this round
            </div>

            {activeTeams.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Team Status</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activeTeams.map(team => {
                            const isReady = team.ready === true;
                            const bidCount = Object.keys(team.bids || {}).length;
                            return (
                                <div key={team.id} className={`p-3 border-2 flex items-center gap-3 ${
                                    isReady ? 'border-emerald-400 bg-emerald-50' : 'border-amber-400 bg-amber-50'
                                }`}>
                                    {isReady ? <CheckCircle size={18} className="text-emerald-700" /> : <Clock size={18} className="text-amber-600" />}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-gray-900 text-sm truncate">{team.teamName}</div>
                                        <div className="text-xs text-gray-500 font-mono">
                                            {bidCount} bid(s) | {(team.money || 0).toLocaleString()}
                                            | Prod {(team.metrics?.productivity || 0).toFixed(0)}
                                            | CSat {(team.metrics?.clientSatisfaction || 0).toFixed(0)}
                                        </div>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-0.5 ${isReady ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'}`}>
                                        {isReady ? 'READY' : 'ACTIVE'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    {setupTeams.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">In setup: {setupTeams.map(t => t.teamName).join(', ')}</div>
                    )}
                </div>
            )}

            {/* Inline confirm bar */}
            {confirmState && (
                <div className="mb-4">
                    <ConfirmBar {...confirmState} onCancel={() => setConfirmState(null)} />
                </div>
            )}

            <div className="flex flex-wrap gap-3">
                {allReady ? (
                    <button onClick={() => requestProcess(false)} disabled={isLoading}
                        className="flex-1 bg-emerald-900 text-white font-bold py-3 px-6 hover:bg-emerald-800 disabled:opacity-50 tracking-wide">
                        {isLoading ? "Processing..." : `ALL READY -- PROCESS ROUND ${gameState.currentRound}`}
                    </button>
                ) : (
                    <>
                        <div className="flex-1 bg-amber-100 text-amber-800 font-semibold py-3 px-6 text-center border border-amber-300">
                            Waiting for {notReadyTeams.length} team(s)...
                        </div>
                        <button onClick={() => requestProcess(true)} disabled={isLoading}
                            className="bg-amber-700 text-white font-bold py-3 px-6 hover:bg-amber-800 disabled:opacity-50">
                            {isLoading ? "..." : "FORCE PROCESS"}
                        </button>
                    </>
                )}
            </div>

            <div className="mt-6 border-t border-gray-200 pt-4">
                <button onClick={requestReset} disabled={isResetting || isLoading}
                    className="w-full bg-red-900 text-white font-semibold py-3 px-6 hover:bg-red-800 disabled:opacity-50 tracking-wide">
                    {isResetting ? "Resetting..." : "HARD RESET GAME"}
                </button>
            </div>
        </div>
    );
};
