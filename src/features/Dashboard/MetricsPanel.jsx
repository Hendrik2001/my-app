// src/features/Dashboard/MetricsPanel.jsx
// FIXED VERSION - Replace your current file with this

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const MetricDisplay = ({ name, value, colorClass }) => (
    <div className="bg-gray-50 p-4 rounded-lg text-center">
        <div className="text-sm font-medium text-gray-600">{name}</div>
        {/* FIXED: Add fallback to 0 if value is undefined */}
        <div className={`text-3xl font-bold ${colorClass || 'text-gray-900'}`}>
            {(value || 0).toFixed(0)}
        </div>
    </div>
);

export const MetricsPanel = ({ teamData }) => {
    // FIXED: Always provide default values for metrics
    const metrics = teamData?.metrics || {
        productivity: 50,
        employeeSatisfaction: 50,
        clientSatisfaction: 50,
        partnerSatisfaction: 50
    };

    const chartData = [
        { name: 'Prod.', value: metrics.productivity || 50 },
        { name: 'Emp. Sat', value: metrics.employeeSatisfaction || 50 },
        { name: 'Client Sat', value: metrics.clientSatisfaction || 50 },
        { name: 'Partner Sat', value: metrics.partnerSatisfaction || 50 },
    ];

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Firm Metrics</h2>

            <div className="mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-green-800">Available Cash</div>
                    <div className="text-4xl font-bold text-green-700">
                        €{(teamData?.money || 0).toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <MetricDisplay
                    name="Productivity"
                    value={metrics.productivity}
                    colorClass="text-amber-600"
                />
                <MetricDisplay
                    name="Employee Sat."
                    value={metrics.employeeSatisfaction}
                    colorClass="text-green-600"
                />
                <MetricDisplay
                    name="Client Sat."
                    value={metrics.clientSatisfaction}
                    colorClass="text-blue-600"
                />
                <MetricDisplay
                    name="Partner Sat."
                    value={metrics.partnerSatisfaction}
                    colorClass="text-purple-600"
                />
            </div>

            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                        <YAxis stroke="#6B7280" fontSize={12} domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#003B3C" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
