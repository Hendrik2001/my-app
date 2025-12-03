import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import gameData from '../../constants/gameData.js'; 

// Use export const
export const CentralChart = ({ teams }) => {
    const chartData = useMemo(() => {
        return teams.map((team, i) => ({
            name: team.teamName,
            Productivity: team.metrics?.productivity || 50,
            "Client Sat.": team.metrics?.clientSatisfaction || 50,
            "Employee Sat.": team.metrics?.employeeSatisfaction || 50,
            "Partner Sat.": team.metrics?.partnerSatisfaction || 50,
            fill: gameData.COLORS[i % gameData.COLORS.length]
        }));
    }, [teams]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-2xl col-span-2">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Firm Metrics Comparison</h2>
            <div style={{ width: '100%', height: 500 }}>
                <ResponsiveContainer>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Productivity" fill="#F59E0B" />
                        <Bar dataKey="Client Sat." fill="#3B82F6" />
                        <Bar dataKey="Employee Sat." fill="#10B981" />
                        <Bar dataKey="Partner Sat." fill="#8B5CF6" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};