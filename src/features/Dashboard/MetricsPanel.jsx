import React, { useState } from 'react';
import gameData from '../../constants/gameData.js';
import { calculateTotalCapacity, calculateActualCompetency, getProductivityDiscount, calculateGruntWorkRate } from '../../utils/gameCalculations.js';
import { Info, X } from 'lucide-react';

const MetricCard = ({ metricKey, value, extra }) => {
    const [open, setOpen] = useState(false);
    const info = gameData.METRIC_INFO[metricKey];
    if (!info) return null;
    const cMap = { amber: 'border-amber-400 bg-amber-50 text-amber-800', blue: 'border-blue-400 bg-blue-50 text-blue-800' };
    const c = cMap[info.color] || cMap.blue;
    return (
        <div className="relative">
            <div className={`p-4 border-l-4 ${c}`}>
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider">{info.name}</span>
                    <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-gray-600"><Info size={13} /></button>
                </div>
                <div className="text-3xl font-mono font-bold mt-1">{(value || 0).toFixed(0)}</div>
                {extra && <div className="text-xs mt-1 opacity-80">{extra}</div>}
            </div>
            {open && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 p-4 bg-white shadow-lg border text-left" style={{ minWidth: 250 }}>
                    <div className="flex justify-between mb-2">
                        <h4 className="font-bold text-sm text-gray-900">{info.name}</h4>
                        <button onClick={() => setOpen(false)}><X size={14} className="text-gray-400" /></button>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{info.longDesc}</p>
                    <p className="text-xs text-emerald-700"><strong>Improved by:</strong> {info.improvedBy}</p>
                </div>
            )}
        </div>
    );
};

export const MetricsPanel = ({ teamData }) => {
    const metrics = teamData?.metrics || { productivity: 0, clientSatisfaction: 0 };
    const totalCap = calculateTotalCapacity(teamData);
    const actualComp = calculateActualCompetency(teamData);
    const money = teamData?.money || 0;
    const upgrades = teamData?.upgrades || {};
    const discount = getProductivityDiscount(metrics.productivity);
    const gruntRate = calculateGruntWorkRate(metrics.productivity);

    return (
        <div className="bg-white p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 tracking-tight border-b border-gray-200 pb-2" style={{ fontFamily: 'Georgia, serif' }}>Firm Overview</h2>

            {/* Top stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className={`p-3 border-l-4 ${money >= 0 ? 'border-emerald-600 bg-emerald-50' : 'border-red-600 bg-red-50'}`}>
                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-600">Cash</div>
                    <div className={`text-xl font-mono font-bold ${money >= 0 ? 'text-emerald-800' : 'text-red-700'}`}>{money.toLocaleString()}</div>
                </div>
                <div className="p-3 border-l-4 border-blue-500 bg-blue-50">
                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-600">Capacity</div>
                    <div className="text-xl font-mono font-bold text-blue-800">{totalCap}</div>
                </div>
                <div className="p-3 border-l-4 border-purple-500 bg-purple-50">
                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-600">Competency</div>
                    <div className="text-xl font-mono font-bold text-purple-800">{actualComp.toFixed(0)}</div>
                </div>
                <div className="p-3 border-l-4 border-gray-400 bg-stone-50">
                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-600">Grunt Work</div>
                    <div className="text-xl font-mono font-bold text-gray-800">{gruntRate.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">per unused cap / round</div>
                </div>
            </div>

            {/* Upgrade badges */}
            {Object.values(upgrades).some(v => v > 0) && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {Object.entries(upgrades).map(([cat, level]) => {
                        if (!level || !gameData.UPGRADES[cat]) return null;
                        const data = gameData.UPGRADES[cat];
                        return <span key={cat} className="text-xs border border-indigo-300 text-indigo-800 bg-indigo-50 px-2 py-0.5 font-medium">{data.name} Lv{level}</span>;
                    })}
                </div>
            )}

            {/* Two metric cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <MetricCard metricKey="productivity" value={metrics.productivity}
                    extra={discount > 0 ? `${discount}% cost reduction active` : "No cost reduction yet"} />
                <MetricCard metricKey="clientSatisfaction" value={metrics.clientSatisfaction}
                    extra={`Bid score weight: 35%`} />
            </div>
        </div>
    );
};
