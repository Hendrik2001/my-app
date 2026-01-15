import React, { useState } from 'react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase.js';
import gameData from '../../constants/gameData.js';
import { toast } from 'sonner';

// Corrected: Accept gamePath as a prop
export const ProjectPanel = ({ teamPath, teamData, gameState, projects, gamePath }) => {
    const [bids, setBids] = useState(teamData.bids || {});
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

    const handleBidChange = (projectId, value) => {
        const newBids = { ...bids, [projectId]: Number(value) };
        setBids(newBids);
    };

    const handlePlaceBid = async (project) => {
        const bidAmount = bids[project.id];
        if (!bidAmount || bidAmount <= 0) {
            toast.error("Please enter a valid bid amount.");
            return;
        }

        if (bidAmount <= project.estimatedCost) {
            toast.error("Your bid must be higher than the estimated cost.");
            return;
        }

        // Ensure gamePath is valid before proceeding
        if (!gamePath) {
            toast.error("Game path is undefined. Please try again.");
            console.error("gamePath is null during bid attempt.");
            return;
        }

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
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Available Projects</h2>
            {isLocked && (
                <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg mb-4 text-center">
                    Bidding is locked during the {gameState.stage} phase.
                </div>
            )}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                <span className="text-lg font-medium text-gray-700">Team Capacity:</span>
                <span className={`text-2xl font-bold ${capacityUsed > teamCapacity ? 'text-red-600' : 'text-evergreen'}`}>
                    {capacityUsed} / {teamCapacity}
                </span>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {projects.map(project => {
                    const hasBid = !!teamData.bids?.[project.id];
                    return (
                        <div key={project.id} className={`p-4 rounded-lg border ${hasBid ? 'bg-gray-100' : 'bg-white'}`}>
                            <h3 className="text-lg font-semibold text-evergreen">{project.name}</h3>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-muted mt-2">
                                <p>Complexity: <span className="font-medium text-gray-800">{project.complexity}</span></p>
                                <p>Capacity Cost: <span className="font-medium text-gray-800">{project.capacityCost}</span></p>
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
                                    onClick={() => handlePlaceBid(project)}
                                    disabled={isLocked || hasBid}
                                    className="bg-evergreen text-white font-semibold px-4 py-2 rounded-lg hover:bg-opacity-90 disabled:opacity-50"
                                >
                                    {hasBid ? "Bid Placed" : "Place Bid"}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};