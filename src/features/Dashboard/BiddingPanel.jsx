import React, { useState, useMemo } from 'react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase.js';
import gameData from '../../constants/gameData.js';
import { calculateActualCompetency, calculateTotalCapacity, calculateProjectCost, getProductivityDiscount, calculateGruntWorkRate } from '../../utils/gameCalculations.js';
import { toast } from 'sonner';
import { X, Lock, AlertTriangle, CheckCircle } from 'lucide-react';
import { ConfirmBar } from '../../components/ConfirmBar.jsx';

export const BiddingPanel = ({ isOpen, onClose, onFinishBidding, teamPath, teamData, gameState, projects, gamePath }) => {
    const [bids, setBids] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(null);
    const [confirmState, setConfirmState] = useState(null); // { type, projectId, message, detail, onConfirm }

    const teamCapacity = useMemo(() => calculateTotalCapacity(teamData), [teamData]);
    const actualCompetency = useMemo(() => calculateActualCompetency(teamData), [teamData]);
    const productivity = teamData.metrics?.productivity || 0;
    const discount = getProductivityDiscount(productivity);
    const gruntRate = calculateGruntWorkRate(productivity);
    const existingBids = teamData.bids || {};

    const committedCapacity = useMemo(() => {
        return Object.keys(existingBids).reduce((acc, pid) => {
            const p = projects.find(pr => pr.id === pid);
            return acc + (p?.capacityCost || 0);
        }, 0);
    }, [existingBids, projects]);

    const capacityRemaining = teamCapacity - committedCapacity;
    const capacityPercent = teamCapacity > 0 ? Math.round((committedCapacity / teamCapacity) * 100) : 0;
    const gruntIncome = Math.max(0, capacityRemaining) * gruntRate;
    const sortedProjects = useMemo(() => [...projects].sort((a, b) => a.complexity - b.complexity), [projects]);

    const getProjectStatus = (project) => {
        const reqComp = project.complexity * (gameData.FORMULA_CONSTANTS.MIN_COMPETENCY_RATIO || 0.6);
        if (existingBids[project.id]) return { status: 'bid', canBid: false };
        if (actualCompetency < reqComp) return { status: 'locked', label: `Requires ${reqComp.toFixed(0)} competency (you have ${actualCompetency.toFixed(0)})`, canBid: false };
        return { status: 'available', canBid: true };
    };

    const handleBidChange = (pid, val) => setBids(prev => ({ ...prev, [pid]: Number(val) }));

    const requestPlaceBid = (project) => {
        const amt = bids[project.id];
        if (!amt || amt <= 0) { toast.error("Enter a valid bid."); return; }
        if (amt <= project.estimatedCost) { toast.error("Bid must exceed estimated cost."); return; }
        if (!gamePath) { toast.error("Game path undefined."); return; }

        const newCap = committedCapacity + project.capacityCost;
        const isOverwork = newCap > teamCapacity;
        const overPct = isOverwork ? Math.round(((newCap - teamCapacity) / teamCapacity) * 100) : 0;
        const actualCost = calculateProjectCost(teamData, project);

        setConfirmState({
            type: 'bid', projectId: project.id,
            variant: isOverwork ? 'danger' : 'info',
            message: isOverwork
                ? `OVERWORK: This pushes capacity to ${newCap}/${teamCapacity} (${overPct}% over). Quality will drop.`
                : `Place bid for "${project.name}" at ${amt.toLocaleString()}?`,
            detail: `Capacity after: ${newCap}/${teamCapacity} | Est. execution cost: ${actualCost.toLocaleString()} | Cannot be changed after placing.`,
            confirmLabel: isOverwork ? "Bid Anyway" : "Place Bid",
            onConfirm: () => executePlaceBid(project, amt),
        });
    };

    const executePlaceBid = async (project, amt) => {
        setIsSubmitting(project.id);
        try {
            await setDoc(doc(db, `${gamePath}/projects/${project.id}/bids`, teamData.teamId), {
                amount: amt, teamName: teamData.teamName, teamId: teamData.teamId,
                clientSat: teamData.metrics?.clientSatisfaction || 0,
            });
            await updateDoc(doc(db, teamPath), { [`bids.${project.id}`]: amt });
            toast.success(`Bid placed for "${project.name}".`);
        } catch (err) { toast.error(`Failed: ${err.message}`); }
        setIsSubmitting(null);
    };

    const requestFinishBidding = () => {
        if (Object.keys(existingBids).length === 0) {
            setConfirmState({
                type: 'finish', variant: 'warning',
                message: `No bids placed. Your firm will only earn grunt work (~${(teamCapacity * gruntRate).toLocaleString()}) this round.`,
                confirmLabel: "Continue Without Bids",
                onConfirm: () => onFinishBidding(),
            });
        } else {
            onFinishBidding();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-stone-50 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-emerald-900 text-white shadow-lg">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>Project Bidding &mdash; Round {gameState.currentRound}</h2>
                        <p className="text-sm text-emerald-200">
                            Unused capacity earns {gruntRate.toLocaleString()} per point.
                            {discount > 0 && ` Productivity: ${discount}% cost reduction.`}
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <div className="text-xs text-emerald-300 uppercase tracking-wider">Capacity</div>
                            <div className={`text-lg font-mono font-bold ${committedCapacity > teamCapacity ? 'text-red-400' : 'text-white'}`}>
                                {committedCapacity} / {teamCapacity}
                            </div>
                            <div className="w-28 bg-emerald-800 h-1.5 mt-1">
                                <div className={`h-1.5 ${committedCapacity > teamCapacity ? 'bg-red-400' : capacityPercent > 80 ? 'bg-amber-400' : 'bg-emerald-300'}`}
                                    style={{ width: `${Math.min(capacityPercent, 100)}%` }} />
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-emerald-300 uppercase tracking-wider">Competency</div>
                            <div className="text-lg font-mono font-bold">{actualCompetency.toFixed(0)}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-emerald-300 uppercase tracking-wider">Cash</div>
                            <div className="text-lg font-mono font-bold">{(teamData.money || 0).toLocaleString()}</div>
                        </div>
                        <button onClick={onClose} className="text-emerald-300 hover:text-white ml-2"><X size={22} /></button>
                    </div>
                </div>
            </div>

            {/* Top-level confirm bar */}
            {confirmState && confirmState.type === 'finish' && (
                <div className="max-w-6xl mx-auto px-4 mt-4">
                    <ConfirmBar {...confirmState} onCancel={() => setConfirmState(null)} />
                </div>
            )}

            {/* Grunt work info */}
            {capacityRemaining > 0 && Object.keys(existingBids).length > 0 && (
                <div className="max-w-6xl mx-auto px-4 mt-4">
                    <div className="bg-stone-100 border border-stone-300 p-3 text-sm text-gray-700">
                        <strong>{capacityRemaining}</strong> unused capacity will earn approx. <strong>{gruntIncome.toLocaleString()}</strong> in grunt work.
                    </div>
                </div>
            )}

            {/* Projects */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedProjects.map(project => {
                        const { status, label, canBid } = getProjectStatus(project);
                        const isLocked = status === 'locked';
                        const hasBid = status === 'bid';
                        const wouldOverload = canBid && (committedCapacity + project.capacityCost) > teamCapacity;
                        const reqComp = (project.complexity * (gameData.FORMULA_CONSTANTS.MIN_COMPETENCY_RATIO || 0.6)).toFixed(0);
                        const actualCost = calculateProjectCost(teamData, project);
                        const tierLabel = project.complexity <= 35 ? 'Routine' : project.complexity <= 55 ? 'Standard' : project.complexity <= 75 ? 'Complex' : 'Elite';
                        const tierColor = project.complexity <= 35 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : project.complexity <= 55 ? 'bg-blue-100 text-blue-800 border-blue-300' : project.complexity <= 75 ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-red-100 text-red-800 border-red-300';
                        const isConfirming = confirmState?.type === 'bid' && confirmState?.projectId === project.id;

                        return (
                            <div key={project.id} className={`p-5 border-2 transition-all ${
                                hasBid ? 'border-emerald-600 bg-emerald-50' :
                                isLocked ? 'border-gray-200 bg-gray-50 opacity-50' :
                                wouldOverload ? 'border-amber-400 bg-amber-50' :
                                'border-gray-200 bg-white hover:border-emerald-700'
                            }`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            {isLocked && <Lock size={14} className="text-gray-400" />}
                                            {hasBid && <CheckCircle size={14} className="text-emerald-700" />}
                                            {wouldOverload && !hasBid && <AlertTriangle size={14} className="text-amber-600" />}
                                            <h3 className={`font-semibold ${isLocked ? 'text-gray-400' : 'text-gray-900'}`} style={{ fontFamily: 'Georgia, serif' }}>{project.name}</h3>
                                        </div>
                                        {isLocked && <p className="text-xs text-red-600 mt-1">{label}</p>}
                                        {hasBid && <p className="text-xs text-emerald-700 font-medium mt-1">Bid: {existingBids[project.id]?.toLocaleString()}</p>}
                                    </div>
                                    <span className={`px-2 py-0.5 text-xs font-bold border ${tierColor}`}>{tierLabel} {project.complexity}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
                                    <div><span className="text-gray-500">Capacity: </span><span className={`font-mono font-semibold ${wouldOverload ? 'text-amber-700' : 'text-gray-800'}`}>{project.capacityCost}</span></div>
                                    <div><span className="text-gray-500">Min comp: </span><span className={`font-mono font-semibold ${actualCompetency >= reqComp ? 'text-emerald-700' : 'text-red-600'}`}>{reqComp}</span></div>
                                    <div><span className="text-gray-500">Market: </span><span className="font-mono text-indigo-700">~{project.hiddenMarketPrice.toLocaleString()}</span></div>
                                    <div>
                                        <span className="text-gray-500">Your cost: </span>
                                        <span className="font-mono font-semibold text-gray-800">{actualCost.toLocaleString()}</span>
                                        {discount > 0 && <span className="text-xs text-amber-700 ml-1">(-{discount}%)</span>}
                                    </div>
                                </div>

                                {/* Inline confirm for this project */}
                                {isConfirming && (
                                    <div className="mb-3">
                                        <ConfirmBar {...confirmState} onCancel={() => setConfirmState(null)} />
                                    </div>
                                )}

                                {canBid && !hasBid && !isConfirming && (
                                    <div className="flex gap-2 mt-3">
                                        <input type="number" placeholder={`Min ${(project.estimatedCost + 1).toLocaleString()}`}
                                            className="flex-1 p-2 border border-gray-300 text-sm font-mono"
                                            value={bids[project.id] || ''} onChange={(e) => handleBidChange(project.id, e.target.value)} />
                                        <button onClick={() => requestPlaceBid(project)} disabled={isSubmitting === project.id}
                                            className="bg-emerald-900 text-white font-semibold px-4 py-2 hover:bg-emerald-800 disabled:opacity-50 text-sm tracking-wide">
                                            {isSubmitting === project.id ? "..." : "PLACE BID"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {projects.length === 0 && <div className="text-center py-12 text-gray-500">No projects available this round.</div>}

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t-2 border-emerald-900 p-4 mt-6 -mx-4 shadow-lg">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            {Object.keys(existingBids).length} bid(s) placed
                            {capacityRemaining > 0 && ` / ${capacityRemaining} capacity remaining`}
                            {capacityRemaining > 0 && ` / ~${gruntIncome.toLocaleString()} grunt work`}
                        </div>
                        <button onClick={requestFinishBidding}
                            className="bg-emerald-900 text-white font-bold py-3 px-8 hover:bg-emerald-800 transition tracking-wide">
                            FINISH BIDDING
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
