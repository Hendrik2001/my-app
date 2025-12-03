import React from 'react';
import { auth } from '../../firebase/firebase.js';
import { LogOut, Briefcase, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';

export const TeamHeader = ({ teamData, gameState }) => {
    const handleLogout = () => {
        auth.signOut().catch(err => toast.error(`Logout failed: ${err.message}`));
    };

    return (
        <header className="bg-white shadow-md p-4 rounded-xl mb-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center mb-4 md:mb-0">
                    <Briefcase className="w-10 h-10 text-indigo-600" />
                    <h1 className="text-3xl font-bold text-gray-800 ml-3">{teamData.teamName}</h1>
                </div>
                <div className="flex items-center space-x-6">
                    <div className="text-center">
                        <div className="text-sm font-medium text-gray-500">Round</div>
                        <div className="text-2xl font-bold text-indigo-600">{gameState.currentRound || 0}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm font-medium text-gray-500">Current Phase</div>
                        <div className="text-2xl font-bold text-gray-700 capitalize">{gameState.stage || 'Loading'}</div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium py-2 px-4 rounded-lg transition"
                    >
                        <LogOut size={16} className="inline mr-2" />
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
};