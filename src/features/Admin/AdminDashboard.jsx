import React from 'react';
import { AdminHeader } from './AdminHeader.jsx';
import { AdminGameState } from './AdminGameState.jsx';
import { AdminProjectCreator } from './AdminProjectCreator.jsx';
import { AdminTeamManager } from './AdminTeamManager.jsx';
import { AdminProjectList } from './AdminProjectList.jsx';
import { EventPanel } from './EventPanel.jsx';

export const AdminDashboard = ({ gamePath, gameState, allTeams, projects }) => {

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto flex flex-col gap-6">
                <AdminHeader gameState={gameState || { currentRound: 0, stage: 'No Game' }} />

                <AdminGameState
                    gamePath={gamePath}
                    gameState={gameState}
                    allTeams={allTeams}
                    projects={projects}
                />

                {gameState && (
                    <>
                        <EventPanel gamePath={gamePath} gameState={gameState} allTeams={allTeams} />
                        <AdminProjectCreator
                            gamePath={gamePath}
                            currentRound={gameState.currentRound}
                        />
                        <AdminProjectList
                            projects={projects}
                            gamePath={gamePath}
                        />
                        <AdminTeamManager
                            allTeams={allTeams}
                            gamePath={gamePath}
                        />
                    </>
                )}
            </div>
        </div>
    );
};