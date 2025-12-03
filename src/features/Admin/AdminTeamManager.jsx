import React from 'react';
import { db } from '../../firebase/firebase.js';
import { doc, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Trash2, User } from 'lucide-react';

// Must be export const
export const AdminTeamManager = ({ allTeams, gamePath }) => {

    const removeTeam = async (team) => {
        if (!window.confirm(`Are you sure you want to remove ${team.teamName}? This will delete their team data and user profile.`)) {
            return;
        }

        try {
            // 1. Delete the team document from the game
            const teamDocRef = doc(db, gamePath, 'teams', team.id);
            await deleteDoc(teamDocRef);

            // 2. Delete the user's profile from the 'users' collection
            const userDocRef = doc(db, 'users', team.id);
            await deleteDoc(userDocRef);

            toast.success(`Removed team: ${team.teamName}`);
        } catch (err) {
            console.error(err);
            toast.error(`Failed to remove team: ${err.message}`);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Team Management</h2>
            <div className="space-y-3">
                {allTeams.length === 0 && (
                    <p className="text-gray-500">No teams have signed up yet.</p>
                )}
                {allTeams.map(team => (
                    <div key={team.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <User className="text-gray-600" />
                            <div>
                                <p className="font-semibold text-gray-800">{team.teamName}</p>
                                <p className="text-sm text-gray-500">Money: €{(team.money || 0).toLocaleString()}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => removeTeam(team)}
                            className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"
                            title="Remove Team"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};