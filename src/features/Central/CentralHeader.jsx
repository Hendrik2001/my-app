import React from 'react';
import { Briefcase, LogOut } from 'lucide-react';
// 1. Import auth directly from firebase
import { auth } from '../../firebase/firebase.js';
import { toast } from 'sonner';

export const CentralHeader = ({ gameState }) => {
    if (!gameState) return null;

    // 2. Add a logout handler
    const handleLogout = () => {
        auth.signOut().catch(err => toast.error(`Logout failed: ${err.message}`));
    };

    return (
        <header className="bg-white shadow p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <Briefcase size={32} className="text-indigo-600" />
                <h1 className="text-3xl font-bold text-indigo-700">Law Firm Sim - Leaderboard</h1>
            </div>
            <div className="flex items-center gap-6 text-right">
                 <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg">
                    <p className="text-sm font-bold">CURRENT EVENT</p>
                    <p className="text-lg">None</p>
                </div>
                <div>
                    <div className="text-sm text-gray-500">Round</div>
                    <div className="text-3xl font-bold text-indigo-600">{gameState.currentRound}</div>
                </div>
                <div>
                    <div className="text-sm text-gray-500">Stage</div>
                    <div className="text-3xl font-bold text-indigo-600 capitalize">{gameState.stage}</div>
                </div>
                {/* 3. Add the logout button */}
                <button
                    onClick={handleLogout}
                    className="bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium py-2 px-4 rounded-lg transition"
                >
                    <LogOut size={16} className="inline mr-2" />
                    Back to Login
                </button>
            </div>
        </header>
    );
};