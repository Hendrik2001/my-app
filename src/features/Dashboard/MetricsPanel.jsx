import React, { useState } from 'react';
import gameData from '../../constants/gameData.js';
import { calculateTotalCapacity, calculateActualCompetency, getProductivityDiscount, calculateGruntWorkRate, calculateLeverageRatio, getLeverageWarning } from '../../utils/gameCalculations.js';
import { Info, X, AlertTriangle } from 'lucide-react';

const MetricCard = ({ metricKey, value, extra, isCurrency, forceColor }) => {
    const [open, setOpen] = useState(false);
    const info = gameData.METRIC_INFO[metricKey];
    if (!info) return null;

    const cMap = {
        amber: 'border-amber-400 bg-amber-50 text-amber-800',
        blue: 'border-blue-400 bg-blue-50 text-blue-800',
        emerald: 'border-emerald-600 bg-emerald-50 text-emerald-800',
        purple: 'border-purple-500 bg-purple-50 text-purple-800',
        orange: 'border-orange-500 bg-orange-50 text-orange-800',
        stone: 'border-gray-400 bg-stone-50 text-gray-800',
        red: 'border-red-600 bg-red-50 text-red-700'
    };

    const colorKey = forceColor || info.color || 'blue';
    const c = cMap[colorKey];

    const displayValue = isCurrency ? (value || 0).toLocaleString() : (value || 0).toFixed(0);

    return (
        <div className="relative">
            <div className={`p-4 border-l-4 ${c}`}>
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider opacity-80">{info.name}</span>
                    <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-gray-600"><Info size={13} /></button>
                </div>
                <div className="text-2xl font-mono font-bold mt-1">{displayValue}{metricKey === 'leverage' ? ':1' : ''}</div>
                {extra && <div className="text-xs mt-1 opacity-80">{extra}</div>}
            </div>
            {open && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 p-4 bg-white shadow-lg border text-left" style={{ minWidth: 250 }}>
                    <div className="flex justify-between mb-2">
                        <h4 className="font-bold text-sm text-gray-900">{info.name}</h4>
                        <button onClick={() => setOpen(false)}><X size={14} className="text-gray-400" /></button>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{info.longDesc}</p>
                    {info.improvedBy && <p className="text-xs text-emerald-700"><strong>Improved by:</strong> {info.improvedBy}</p>}
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
    const leverageRatio = calculateLeverageRatio(teamData);
    const leverageWarning = getLeverageWarning(teamData);

    return (
        <div className="bg-white p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 tracking-tight border-b border-gray-200 pb-2" style={{ fontFamily: 'Georgia, serif' }}>Firm Overview</h2>

            {/* Leverage warning */}
            {leverageWarning && (
                <div className={`p-3 mb-4 text-sm font-semibold flex items-center gap-2 ${leverageWarning.level === 'danger' ? 'bg-red-100 border border-red-300 text-red-800' : 'bg-amber-100 border border-amber-300 text-amber-800'
                    }`}>
                    <AlertTriangle size={16} /> {leverageWarning.message}
                </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                <MetricCard
                    metricKey="cash"
                    value={money}
                    isCurrency={true}
                    forceColor={money < 0 ? 'red' : 'emerald'}
                />
                <MetricCard metricKey="capacity" value={totalCap} />
                <MetricCard metricKey="competency" value={actualComp} />
                <MetricCard metricKey="leverage" value={leverageRatio} />

                <MetricCard metricKey="productivity" value={metrics.productivity}
                    extra={discount > 0 ? `${discount}% cost reduction` : "No cost reduction"} />
                <MetricCard metricKey="clientSatisfaction" value={metrics.clientSatisfaction}
                    extra={`Bid weight: 35%`} />
                <MetricCard metricKey="gruntWork" value={gruntRate} isCurrency={true}
                    extra="per round" />
            </div>

            {/* Setup & Upgrades */}
            {(() => {
                const config = teamData?.config || {};
                const officeKey = config.office;
                const techKey = config.tech;
                const officeData = officeKey && gameData.SETUP_DATA.office[officeKey];
                const techData = techKey && gameData.SETUP_DATA.tech[techKey];
                const hasSetup = officeData || techData;
                const hasUpgrades = Object.values(upgrades).some(v => v > 0);
                if (!hasSetup && !hasUpgrades) return null;
                return (
                    <div className="border-t border-gray-100 pt-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Firm Setup & Upgrades</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {/* Office */}
                            {officeData && (
                                <div className="p-3 bg-stone-50 border border-stone-200">
                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Office</div>
                                    <div className="font-semibold text-gray-900 text-sm">{officeData.name}</div>
                                    <div className="flex gap-3 mt-1">
                                        {officeData.clientBoost > 0 && <span className="text-xs text-blue-700">+{officeData.clientBoost} Client Sat</span>}
                                        {officeData.capacityBoost > 0 && <span className="text-xs text-blue-700">+{officeData.capacityBoost} Capacity</span>}
                                    </div>
                                </div>
                            )}
                            {/* Tech */}
                            {techData && (
                                <div className="p-3 bg-stone-50 border border-stone-200">
                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Technology</div>
                                    <div className="font-semibold text-gray-900 text-sm">{techData.name}</div>
                                    <div className="flex gap-3 mt-1">
                                        {techData.prodBoost > 0 && <span className="text-xs text-amber-700">+{techData.prodBoost} Productivity</span>}
                                        {techData.competencyBoost > 0 && <span className="text-xs text-purple-700">+{techData.competencyBoost} Competency</span>}
                                    </div>
                                </div>
                            )}
                            {/* Upgrade tracks */}
                            {Object.entries(gameData.UPGRADES).map(([cat, data]) => {
                                const level = upgrades[cat] || 0;
                                const cumulativeCapBoost = cat === 'ai' ? data.levels.slice(0, level).reduce((s, l) => s + (l.capacityBoost || 0), 0) : 0;
                                const cumulativeMetricBoost = data.levels.slice(0, level).reduce((s, l) => s + (l.boost || 0), 0);
                                return (
                                    <div key={cat} className="p-3 bg-stone-50 border border-stone-200">
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{data.name}</div>
                                        {level === 0 ? (
                                            <div className="text-xs text-gray-400 italic">No upgrades purchased</div>
                                        ) : (
                                            <>
                                                <div className="font-semibold text-gray-900 text-sm">Level {level}: {data.levels[level - 1]?.name}</div>
                                                <div className="flex gap-3 mt-1 flex-wrap">
                                                    {cumulativeMetricBoost > 0 && (
                                                        <span className={`text-xs ${cat === 'ai' ? 'text-amber-700' : 'text-blue-700'}`}>
                                                            +{cumulativeMetricBoost} {gameData.METRIC_INFO[data.metric]?.name}
                                                        </span>
                                                    )}
                                                    {cumulativeCapBoost > 0 && <span className="text-xs text-blue-700">+{cumulativeCapBoost} Capacity</span>}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};
