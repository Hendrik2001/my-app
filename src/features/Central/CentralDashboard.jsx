import React from 'react';
// Import all with { }
import { CentralHeader } from './CentralHeader.jsx';
// import { CentralLeaderboard } from './CentralLeaderboard.jsx';
import { CentralChart } from './CentralChart.jsx';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx'; 

// Use export const
export const CentralDashboard = ({ gameState, allTeams }) => {
    if (!gameState || !allTeams) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen bg-gray-100">
           <CentralHeader gameState={gameState} />
            <main className="max-w-7xl mx-auto p-4 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* <CentralLeaderboard teams={allTeams} /> */}
                    <CentralChart teams={allTeams} />
                </div>
            </main>
        </div>
    );
};
