import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import gameData from '../../constants/gameData.js';

const MetricDisplay = ({ name, value, colorClass }) => (
    <div className="bg-gray-50 p-4 rounded-lg text-center">
        <div className="text-sm font-medium text-slate-muted">{name}</div>
        {/* THIS IS THE FIX:
          We change 'value.toFixed(0)' to '(value || 0).toFixed(0)'.
          If 'value' is undefined, it will be treated as 0.
        */}
        <div className={`text-3xl font-bold ${colorClass}`}>{(value || 0).toFixed(0)}</div>
    </div>
);

export const MetricsPanel = ({ teamData }) => {
    // This line is good, but we add fallbacks below
    const metrics = teamData.metrics || {};

    const chartData = [
        { name: 'Prod.', value: metrics.productivity || 0 },
        { name: 'Emp. Sat', value: metrics.employeeSatisfaction || 0 },
        { name: 'Client Sat', value: metrics.clientSatisfaction || 0 },
        { name: 'Partner Sat', value: metrics.partnerSatisfaction || 0 },
    ];

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Firm Metrics</h2>

            <div className="mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-green-800">Available Cash</div>
                    {/* Add fallback for money as well */}
                    <div className="text-4xl font-bold text-green-700">€{(teamData.money || 0).toLocaleString()}</div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* These calls will now safely pass 'undefined' to MetricDisplay,
                  which will handle it and show 0.
                */}
                <MetricDisplay name="Productivity" value={metrics.productivity} colorClass={gameData.COLORS.productivity} />
                <MetricDisplay name="Employee Sat." value={metrics.employeeSatisfaction} colorClass={gameData.COLORS.employeeSatisfaction} />
                <MetricDisplay name="Client Sat." value={metrics.clientSatisfaction} colorClass={gameData.COLORS.clientSatisfaction} />
                <MetricDisplay name="Partner Sat." value={metrics.partnerSatisfaction} colorClass={gameData.COLORS.partnerSatisfaction} />
            </div>

            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                        <YAxis stroke="#6B7280" fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#003B3C" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};