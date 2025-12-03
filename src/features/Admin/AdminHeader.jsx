import React from 'react';
import { auth } from '../../firebase/firebase.js';
import { LogOut, Shield } from 'lucide-react';
import { toast } from 'sonner';

export const AdminHeader = ({ gameState }) => {
    const handleLogout = () => {
        auth.signOut().catch(err => toast.error(`Logout failed: ${err.message}`));
    };

    return (
        <header className="bg-white shadow-md p-4 rounded-xl mb-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Shield size={32} className="text-red-600" />
                    <h1 className="text-3xl font-bold text-gray-800">Admin Control Panel</h1>
                </div>
                <div className="flex items-center space-x-6">
                    <div className="text-center">
                        <div className="text-sm font-medium text-gray-500">Round</div>
                        <div className="text-2xl font-bold text-red-600">{gameState.currentRound || 0}</div>
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