import React, { useMemo } from 'react';
// // Import with { }
// import { FirmVisual } from './FirmVisual.jsx'; 

// // Use export const
// export const CentralLeaderboard = ({ teams }) => {
//     const sortedTeams = useMemo(() => {
//         return [...teams].sort((a, b) => (b.money || 0) - (a.money || 0));
//     }, [teams]);

//     return (
//         <div className="bg-white p-6 rounded-xl shadow-2xl col-span-1">
//             <h2 className="text-2xl font-semibold mb-4 text-gray-800">Leaderboard</h2>
//             <ul className="space-y-4">
//                 {sortedTeams.map((team, index) => (
//                     <li key={team.id} className={`p-4 rounded-lg flex items-center gap-4 ${index === 0 ? 'bg-indigo-50 border-2 border-indigo-200' : 'bg-gray-50'}`}>
//                         <div className={`text-2xl font-bold w-10 text-center ${index === 0 ? 'text-indigo-600' : 'text-gray-500'}`}>
//                             {index + 1}
//                         </div>
//                         <FirmVisual visuals={team.visuals} />
//                         <div>
//                             <p className="text-lg font-semibold text-gray-900">{team.teamName}</p>
//                             <p className="text-2xl font-bold text-indigo-700">€{(team.money || 0).toLocaleString()}</p>
//                             <p className={`text-sm font-medium ${team.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
//                                 (Profit: €{(team.profit || 0).toLocaleString()})
//                             </label>
//                         </div>
//                     </li>
//                 ))}
//             </ul>
//         </div>
//     );
// };