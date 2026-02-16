import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase.js';
import { TeamHeader } from './TeamHeader.jsx';
import { MetricsPanel } from './MetricsPanel.jsx';
import { LogPanel } from './LogPanel.jsx';
import { BiddingPanel } from './BiddingPanel.jsx';
import { RoundResultModal } from './RoundResultModal.jsx';
import gameData from '../../constants/gameData.js';
import { toast } from 'sonner';

export const TeamDashboard = ({ teamPath, teamId, teamData, gameState, projects, logs }) => {
    const [showBidding, setShowBidding] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const [lastSeenRound, setLastSeenRound] = useState(gameState?.currentRound || 1);

    useEffect(() => {
        if (gameState && gameState.currentRound > lastSeenRound) {
            setShowResultModal(true);
            setLastSeenRound(gameState.currentRound);
        }
    }, [gameState, lastSeenRound]);

    if (!teamData || !gameState) return <div className="p-8">Loading...</div>;

    const fullGamePath = `games/${gameData.GAME_ID || 'game123'}`;
    const isReady = teamData.ready === true;
    const bidCount = Object.keys(teamData.bids || {}).length;

    const handleFinishBidding = () => { setShowBidding(false); setShowResultModal(true); };
    const handleConfirmStrategy = async () => {
        try { await updateDoc(doc(db, teamPath), { ready: true }); toast.success("Strategy confirmed."); }
        catch (err) { toast.error(`Failed: ${err.message}`); }
    };

    return (
        <div className="min-h-screen bg-stone-50 p-4 md:p-8">
            <BiddingPanel isOpen={showBidding} onClose={() => setShowBidding(false)} onFinishBidding={handleFinishBidding}
                teamPath={teamPath} teamData={{ ...teamData, teamId }} gameState={gameState} projects={projects} gamePath={fullGamePath} />
            <RoundResultModal isOpen={showResultModal} onClose={() => setShowResultModal(false)} onConfirmStrategy={handleConfirmStrategy}
                teamData={teamData} teamPath={teamPath} gameState={gameState} logs={logs} />

            <div className="max-w-7xl mx-auto">
                <TeamHeader teamData={teamData} gameState={gameState} />

                {/* Action Bar */}
                <div className="mb-6 p-4 bg-white border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-700">
                        {isReady
                            ? <span className="text-emerald-800 font-semibold">Strategy confirmed -- waiting for other teams.</span>
                            : bidCount > 0
                                ? <span className="text-amber-800 font-semibold">{bidCount} bid(s) placed. Finish bidding when ready.</span>
                                : <span className="text-gray-600">Open bidding to select projects for this round.</span>
                        }
                    </div>
                    <div className="flex gap-3">
                        {!isReady && (
                            <button onClick={() => setShowBidding(true)}
                                className="bg-emerald-900 text-white font-semibold py-2 px-6 hover:bg-emerald-800 transition tracking-wide text-sm">
                                {bidCount > 0 ? 'EDIT BIDS' : 'OPEN BIDDING'}
                            </button>
                        )}
                        <button onClick={() => setShowResultModal(true)}
                            className="bg-white border border-gray-300 text-gray-700 font-medium py-2 px-6 hover:bg-gray-50 transition text-sm">
                            {isReady ? 'View Strategy' : 'Upgrades & Hiring'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <MetricsPanel teamData={teamData} />
                        <LogPanel logs={logs} />
                    </div>
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <div className="bg-white p-6 border border-gray-200">
                            <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b border-gray-200 pb-2" style={{ fontFamily: 'Georgia, serif' }}>Your Bids</h2>
                            {bidCount === 0
                                ? <p className="text-gray-500 text-sm">No bids placed this round.</p>
                                : <div className="space-y-2">
                                    {Object.entries(teamData.bids || {}).map(([pid, amt]) => {
                                        const p = projects.find(pr => pr.id === pid);
                                        return (
                                            <div key={pid} className="p-3 bg-emerald-50 border-l-4 border-emerald-600">
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-sm text-gray-800">{p?.name || 'Unknown'}</span>
                                                    <span className="font-mono font-bold text-emerald-800 text-sm">{amt.toLocaleString()}</span>
                                                </div>
                                                {p && <div className="text-xs text-gray-500 mt-1">Complexity {p.complexity} | Cap {p.capacityCost}</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            }
                        </div>
                        <div className="bg-white p-6 border border-gray-200">
                            <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b border-gray-200 pb-2" style={{ fontFamily: 'Georgia, serif' }}>Your Team</h2>
                            <div className="space-y-2">
                                {Object.entries(teamData.employees || {}).map(([type, count]) => {
                                    if (count === 0) return null;
                                    const d = gameData.SETUP_DATA.employees[type];
                                    return (
                                        <div key={type} className="flex justify-between items-center p-2 bg-stone-50 border border-stone-200">
                                            <div>
                                                <span className="font-medium text-sm text-gray-800">{d?.name || type}</span>
                                                <span className="text-xs text-gray-500 ml-2 font-mono">Cap {d?.capacity} | Comp {d?.competency}</span>
                                            </div>
                                            <span className="font-mono font-bold text-gray-800">x{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
