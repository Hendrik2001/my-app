import React from 'react';
// Import all with { }
import { CentralHeader } from './CentralHeader.jsx';
// import { CentralLeaderboard } from './CentralLeaderboard.jsx';
import { CentralChart } from './CentralChart.jsx';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';
import { Zap } from 'lucide-react';

// Use export const
export const CentralDashboard = ({ gameState, allTeams }) => {
    if (!gameState || !allTeams) {
        return <LoadingSpinner />;
    }

    const activeEvent = gameState.activeEvent;

    return (
        <div className="min-h-screen bg-gray-50">
            <CentralHeader gameState={gameState} />
            <main className="max-w-7xl mx-auto p-4 md:p-8">
                {activeEvent && (
                    <div className="mb-6 p-5 bg-amber-50 border-2 border-amber-400 flex items-start gap-3">
                        <Zap size={24} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <div className="font-bold text-lg text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>{activeEvent.name}</div>
                            <div className="text-sm text-gray-600 mt-1">{activeEvent.description}</div>
                            <div className="text-sm font-mono text-amber-800 mt-1 font-semibold">{activeEvent.display}</div>
                            {activeEvent.targetTeamName && (
                                <div className="text-sm text-amber-700 mt-1">Affects: <span className="font-bold">{activeEvent.targetTeamName}</span></div>
                            )}
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* <CentralLeaderboard teams={allTeams} /> */}
                    <CentralChart teams={allTeams} />
                </div>
            </main>
        </div>
    );
};
