import React from 'react';
// Correctly import all components using named { } syntax
import { TeamHeader } from './TeamHeader.jsx';
import { MetricsPanel } from './MetricsPanel.jsx';
import { InvestmentPanel } from './InvestmentPanel.jsx';
import { ProjectPanel } from './ProjectPanel.jsx';
import { LogPanel } from './LogPanel.jsx';
import gameData from '../../constants/gameData.js'; // Import gameData

// Use export const to match all other components
export const TeamDashboard = ({ teamPath, teamData, gameState, projects, logs }) => {
    if (!teamData || !gameState) {
        // This is the "Loading dashboard data..." state
        return <div className="p-8">Loading dashboard data...</div>;
    }

    // Get the gameId from gameData
    const gameId = gameData.gameId || "game123";
    const fullGamePath = `games/${gameId}`;

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <TeamHeader teamData={teamData} gameState={gameState} />
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (span 2) */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <MetricsPanel teamData={teamData} />
                        {/* Pass the 'logs' prop from App.jsx */}
                        <LogPanel logs={logs} />
                    </div>

                    {/* Right Column (span 1) */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <InvestmentPanel 
                            teamPath={teamPath} 
                            teamData={teamData} 
                            gameState={gameState} 
                        />
                        <ProjectPanel 
                            teamPath={teamPath}
                            // Pass the team's ID for the bid logic
                            teamData={{ ...teamData, teamId: teamPath.split('/')[3] }} 
                            gameState={gameState}
                            projects={projects}
                            gamePath={fullGamePath} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};