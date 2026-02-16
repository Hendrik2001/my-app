import React, { useState } from 'react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase.js';
import gameData from '../../constants/gameData.js';
import { toast } from 'sonner';

// Corrected: Accept gamePath as a prop
export const ProjectPanel = ({ teamPath, teamData, gameState, projects, gamePath }) => {
    const [bids, setBids] = useState(teamData.bids || {});
    const [isSubmitting, setIsSubmitting] = useState(null); // Track which project is submitting
    const [confirmingBid, setConfirmingBid] = useState(null); // { projectId, isOverload, message }
    const isLocked = gameState.stage !== 'bidding';

    // Calculate team's total capacity
    const teamCapacity = Object.entries(teamData.employees).reduce((acc, [type, count]) => {
        return acc + (gameData.SETUP_DATA.employees[type].capacity * count);
    }, 0);

    // Calculate capacity used by current bids
    const capacityUsed = Object.keys(bids).reduce((acc, projectId) => {
        const project = projects.find(p => p.id === projectId);
        return acc + (project?.capacityCost || 0);
    }, 0);

    // Also count capacity from already-placed bids in teamData
    const committedCapacity = Object.keys(teamData.bids || {}).reduce((acc, projectId) => {
        const project = projects.find(p => p.id === projectId);
        return acc + (project?.capacityCost || 0);
    }, 0);

    const capacityRemaining = teamCapacity - committedCapacity;

    const handleBidChange = (projectId, value) => {
        const newBids = { ...bids, [projectId]: Number(value) };
        setBids(newBids);
    };

    // Step 1: Validate and show inline confirmation
    const handleInitiateBid = (project) => {
        const bidAmount = bids[project.id];
        if (!bidAmount || bidAmount <= 0) {
            toast.error("Please enter a valid bid amount.");
            return;
        }

        if (bidAmount <= project.estimatedCost) {
            toast.error("Your bid must be higher than the estimated cost.");
            return;
        }

        if (!gamePath) {
            toast.error("Game path is undefined. Please try again.");
            return;
        }

        const newCapacityUsed = committedCapacity + project.capacityCost;
        const isOverload = newCapacityUsed > teamCapacity;

        setConfirmingBid({ projectId: project.id, isOverload, newCapacityUsed });
    };

    // Step 2: Actually place the bid after confirmation
    const handlePlaceBid = async (project) => {
        setConfirmingBid(null);
        setIsSubmitting(project.id);

        const bidAmount = bids[project.id];

        const bidData = {
            amount: bidAmount,
            teamName: teamData.teamName,
            teamId: teamData.teamId,
            clientSat: teamData.metrics.clientSatisfaction,
        };

        try {
            // 1. Place the bid in the project's 'bids' subcollection
            // Path: games/game123/projects/<projectId>/bids/<teamId>
            const bidRef = doc(db, `${gamePath}/projects/${project.id}/bids`, teamData.teamId);
            await setDoc(bidRef, bidData);

            // 2. Also update the team's local list of bids
            const teamRef = doc(db, teamPath);
            await updateDoc(teamRef, {
                [`bids.${project.id}`]: bidAmount
            });
            toast.success(`Bid for "${project.name}" placed!`);
        } catch (err) {
            console.error(err);
            toast.error(`Failed to place bid: ${err.message}`);
        }
        setIsSubmitting(null);
    };

    const handleCancelBid = () => {
        setConfirmingBid(null);
    };

    const capacityPercent = teamCapacity > 0 ? Math.round((committedCapacity / teamCapacity) * 100) : 0;
    const isOverCapacity = committedCapacity > teamCapacity;

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Available Projects</h2>
            {isLocked && (
                <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg mb-4 text-center">
                    Bidding is locked during the {gameState.stage} phase.
                </div>
            )}

            {/* ── Enhanced Capacity Display ── */}
            <div className={`mb-4 p-4 rounded-lg ${isOverCapacity ? 'bg-red-50 border border-red-300' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-medium text-gray-700">Team Capacity:</span>
                    <span className={`text-2xl font-bold ${isOverCapacity ? 'text-red-600' : 'text-evergreen'}`}>
                        {committedCapacity} / {teamCapacity}
                    </span>
                </div>
                {/* Capacity bar */}
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                        className={`h-3 rounded-full transition-all ${isOverCapacity ? 'bg-red-500' : capacityPercent > 80 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                        style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                    />
                </div>
                {isOverCapacity && (
                    <p className="text-red-600 text-sm font-medium mt-2">
                        ⚠️ Your team is overloaded! Expect burnout penalties and lower project quality.
                    </p>
                )}
                {capacityPercent > 80 && !isOverCapacity && (
                    <p className="text-yellow-700 text-sm mt-2">
                        Nearing capacity — additional projects risk overwork.
                    </p>
                )}
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {projects.map(project => {
                    const hasBid = !!teamData.bids?.[project.id];
                    const wouldOverload = (committedCapacity + project.capacityCost) > teamCapacity;
                    return (
                        <div key={project.id} className={`p-4 rounded-lg border ${hasBid ? 'bg-green-50 border-green-200' : wouldOverload ? 'border-yellow-300 bg-yellow-50' : 'bg-white'}`}>
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-semibold text-evergreen">{project.name}</h3>
                                {hasBid && (
                                    <span className="text-xs font-bold bg-green-200 text-green-800 px-2 py-1 rounded-full">
                                        BID PLACED
                                    </span>
                                )}
                                {!hasBid && wouldOverload && (
                                    <span className="text-xs font-bold bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                                        ⚠️ OVERLOAD
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-muted mt-2">
                                <p>Complexity: <span className="font-medium text-gray-800">{project.complexity}</span></p>
                                <p>Capacity Cost: <span className={`font-medium ${wouldOverload && !hasBid ? 'text-yellow-700' : 'text-gray-800'}`}>{project.capacityCost}</span></p>
                                <p>Est. Cost: <span className="font-medium text-green-700">€{project.estimatedCost.toLocaleString()}</span></p>
                                <p>Market Price: <span className="font-medium text-red-600">~€{project.hiddenMarketPrice.toLocaleString()}</span></p>
                            </div>
                            <div className="mt-3 flex space-x-2">
                                <input
                                    type="number"
                                    placeholder="Your Bid Amount"
                                    className="flex-1 p-2 border rounded-lg"
                                    disabled={isLocked || hasBid}
                                    value={bids[project.id] || ''}
                                    onChange={(e) => handleBidChange(project.id, e.target.value)}
                                />
                                <button
                                    onClick={() => handleInitiateBid(project)}
                                    disabled={isLocked || hasBid || isSubmitting === project.id || confirmingBid?.projectId === project.id}
                                    className="bg-evergreen text-white font-semibold px-4 py-2 rounded-lg hover:bg-opacity-90 disabled:opacity-50"
                                >
                                    {isSubmitting === project.id ? "Placing..." : hasBid ? "Bid Placed ✓" : "Place Bid"}
                                </button>
                            </div>
                            {/* Inline bid confirmation */}
                            {confirmingBid?.projectId === project.id && (
                                <div className={`mt-3 p-3 rounded-lg border-2 ${confirmingBid.isOverload ? 'bg-red-50 border-red-300' : 'bg-blue-50 border-blue-300'
                                    }`}>
                                    {confirmingBid.isOverload ? (
                                        <>
                                            <p className="text-red-800 font-bold text-sm">⚠️ Overwork Warning</p>
                                            <p className="text-red-700 text-sm mt-1">
                                                This pushes capacity to {confirmingBid.newCapacityUsed}/{teamCapacity}.
                                                Employee satisfaction will drop and project quality will suffer.
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-blue-800 text-sm">
                                            <strong>Confirm:</strong> Bid €{(bids[project.id] || 0).toLocaleString()} on "{project.name}"
                                            — capacity {confirmingBid.newCapacityUsed}/{teamCapacity} after this bid. This cannot be undone.
                                        </p>
                                    )}
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={handleCancelBid}
                                            className="flex-1 bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-300 text-sm">
                                            Cancel
                                        </button>
                                        <button onClick={() => handlePlaceBid(project)}
                                            className={`flex-1 text-white font-semibold py-2 rounded-lg text-sm ${confirmingBid.isOverload
                                                ? 'bg-red-600 hover:bg-red-700'
                                                : 'bg-evergreen hover:bg-opacity-90'
                                                }`}>
                                            {confirmingBid.isOverload ? 'Place Bid Anyway' : 'Confirm Bid'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                {projects.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                        No projects available this round. Wait for the admin to set the bidding phase.
                    </div>
                )}
            </div>
        </div>
    );
};
