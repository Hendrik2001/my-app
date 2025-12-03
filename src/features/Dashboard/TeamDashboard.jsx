import React, { useState, useEffect } from 'react';
// Correctly import all components using named { } syntax
import { TeamHeader } from './TeamHeader.jsx';
import { MetricsPanel } from './MetricsPanel.jsx';
import { ProjectPanel } from './ProjectPanel.jsx';
import { LogPanel } from './LogPanel.jsx';
import { RoundResultModal } from './RoundResultModal.jsx'; // Import the new modal
import gameData from '../../constants/gameData.js'; // Import gameData

// Use export const to match all other components
export const TeamDashboard = ({ teamPath, teamData, gameState, projects, logs }) => {
    const [showModal, setShowModal] = useState(false);
    const [lastSeenRound, setLastSeenRound] = useState(gameState?.currentRound || 1);

    // Effect to trigger modal on new round
    useEffect(() => {
        if (gameState && gameState.currentRound > lastSeenRound) {
            setShowModal(true);
            setLastSeenRound(gameState.currentRound);
        }
    }, [gameState, lastSeenRound]);

    // Also show modal on initial load if we are in investment phase and haven't "done" it?
    // For simplicity, let's just rely on the round change for now, or maybe force it open if it's round > 1 and we just loaded?
    // Let's stick to the user request: "end of each round/beginning of each new round".
    // We can also add a button to manually open it.

    if (!teamData || !gameState) {
        // This is the "Loading dashboard data..." state
        return <div className="p-8">Loading dashboard data...</div>;
    }

    // Get the gameId from gameData
    const gameId = gameData.gameId || "game123";
    const fullGamePath = `games/${gameId}`;

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            <RoundResultModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                teamData={teamData}
                teamPath={teamPath}
                gameState={gameState}
                logs={logs}
            />

            <div className="max-w-7xl mx-auto">
                <TeamHeader teamData={teamData} gameState={gameState} />

                {/* Added button to reopen strategy modal manually */}
                <div className="mb-4 flex justify-end">
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-indigo-600 font-semibold hover:underline"
                    >
                        Reopen Strategy & Results
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (span 2) */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <MetricsPanel teamData={teamData} />
                        {/* Pass the 'logs' prop from App.jsx */}
                        <LogPanel logs={logs} />
                    </div>

                    {/* Right Column (span 1) */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        {/* InvestmentPanel REMOVED */}
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