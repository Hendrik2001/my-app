import React from 'react';
import { auth } from '../../firebase/firebase.js';
import { LogOut, Briefcase, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export const TeamHeader = ({ teamData, gameState }) => {
    const handleLogout = () => {
        auth.signOut().catch(err => toast.error(`Logout failed: ${err.message}`));
    };

    const isInDebt = (teamData.money || 0) < 0;

    return (
        <header className="bg-white shadow-md p-4 rounded-xl mb-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center mb-4 md:mb-0">
                    <Briefcase className="w-10 h-10 text-evergreen" />
                    <h1 className="text-3xl font-bold text-evergreen ml-3">{teamData.teamName}</h1>
                </div>
                <div className="flex items-center space-x-6">
                    {/* ── Cash / Debt Indicator ── */}
                    <div className={`text-center px-4 py-2 rounded-lg ${isInDebt ? 'bg-red-100 border border-red-300' : ''}`}>
                        <div className={`text-sm font-medium ${isInDebt ? 'text-red-700' : 'text-slate-muted'}`}>
                            {isInDebt ? '⚠️ DEBT' : 'Cash'}
                        </div>
                        <div className={`text-2xl font-bold ${isInDebt ? 'text-red-600' : 'text-green-600'}`}>
                            €{(teamData.money || 0).toLocaleString()}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm font-medium text-slate-muted">Round</div>
                        <div className="text-2xl font-bold text-evergreen">{gameState.currentRound || 0}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm font-medium text-slate-muted">Phase</div>
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

            {/* ── Persistent Debt Banner ── */}
            {isInDebt && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                    <AlertTriangle size={20} className="text-red-600 flex-shrink-0" />
                    <p className="text-red-700 text-sm">
                        <span className="font-bold">Your firm is in debt.</span> You owe €{Math.abs(teamData.money || 0).toLocaleString()}.
                        Focus on winning profitable projects and reducing costs to recover.
                    </p>
                </div>
            )}
        </header>
    );
};
