import React, { useState, useEffect, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase.js';
import { NumButton } from '../../components/NumButton.jsx';
import { ConfirmBar } from '../../components/ConfirmBar.jsx';
import gameData from '../../constants/gameData.js';
import { getProductivityDiscount, calculateGruntWorkRate } from '../../utils/gameCalculations.js';
import { toast } from 'sonner';
import { Lock, Check, X, ArrowRight, ShoppingCart } from 'lucide-react';

export const RoundResultModal = ({ isOpen, onClose, onConfirmStrategy, teamData, teamPath, gameState, logs }) => {
    const prevRound = gameState.currentRound - 1;
    const hasResults = prevRound >= 1 && logs.some(l => l.round === prevRound);

    const [step, setStep] = useState(hasResults ? 'results' : 'shop');
    const [pendingUpgrades, setPendingUpgrades] = useState({});
    const [localEmployees, setLocalEmployees] = useState({ ...teamData.employees });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmState, setConfirmState] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setStep(hasResults ? 'results' : 'shop');
            setPendingUpgrades({ ...(teamData.upgrades || { ai: 0, client: 0 }) });
            setLocalEmployees({ ...teamData.employees });
            setConfirmState(null);
        }
    }, [isOpen, teamData, hasResults]);

    const currentMoney = teamData.money || 0;
    const roundProfit = teamData.profit || 0;
    const currentUpgrades = teamData.upgrades || { ai: 0, client: 0 };

    const roundLogs = useMemo(() => {
        const entries = logs.filter(l => l.round === prevRound);
        const bidWins = [], bidLosses = [], projSuccess = [], projFail = [], other = [];
        entries.forEach(log => {
            const m = log.message || '';
            if (m.startsWith('[WON]')) bidWins.push(m);
            else if (m.startsWith('[LOST]')) bidLosses.push(m);
            else if (m.startsWith('[OK]')) projSuccess.push(m);
            else if (m.startsWith('[FAIL]')) projFail.push(m);
            else if (!m.includes('Round Summary')) other.push(m);
        });
        return { bidWins, bidLosses, projSuccess, projFail, other };
    }, [logs, prevRound]);

    const { upgradeCost, hiringCost, firingCount, totalSpend, projectedMoney, metricBoosts } = useMemo(() => {
        let upCost = 0;
        const boosts = {};
        for (const [cat, targetLvl] of Object.entries(pendingUpgrades)) {
            const data = gameData.UPGRADES[cat];
            if (!data) continue;
            const baseLvl = currentUpgrades[cat] || 0;
            boosts[data.metric] = 0;
            for (let i = baseLvl; i < targetLvl; i++) {
                upCost += data.levels[i].cost;
                boosts[data.metric] += data.levels[i].boost;
            }
        }
        let hireCost = 0, fired = 0;
        for (const type of ['partners', 'seniors', 'mediors', 'juniors']) {
            const diff = (localEmployees[type] || 0) - (teamData.employees[type] || 0);
            if (diff > 0) hireCost += diff * gameData.SETUP_DATA.employees[type].hireCost;
            else if (diff < 0) fired += Math.abs(diff);
        }
        return { upgradeCost: upCost, hiringCost: hireCost, firingCount: fired, totalSpend: upCost + hireCost, projectedMoney: currentMoney - upCost - hireCost, metricBoosts: boosts };
    }, [pendingUpgrades, localEmployees, teamData, currentUpgrades, currentMoney]);

    // Preview what productivity/clientSat would be after upgrades
    const previewMetrics = useMemo(() => {
        const m = { ...(teamData.metrics || { productivity: 0, clientSatisfaction: 0 }) };
        for (const [cat, targetLvl] of Object.entries(pendingUpgrades)) {
            const data = gameData.UPGRADES[cat];
            if (!data) continue;
            for (let i = (currentUpgrades[cat] || 0); i < targetLvl; i++) {
                m[data.metric] = Math.min(100, (m[data.metric] || 0) + data.levels[i].boost);
            }
        }
        return m;
    }, [pendingUpgrades, teamData, currentUpgrades]);

    const previewDiscount = getProductivityDiscount(previewMetrics.productivity);
    const previewGruntRate = calculateGruntWorkRate(previewMetrics.productivity);

    const buyUpgrade = (cat) => {
        const cur = pendingUpgrades[cat] || 0;
        if (cur >= gameData.UPGRADES[cat].levels.length) return;
        setPendingUpgrades(prev => ({ ...prev, [cat]: cur + 1 }));
    };
    const undoUpgrade = (cat) => {
        const cur = pendingUpgrades[cat] || 0;
        if (cur <= (currentUpgrades[cat] || 0)) return;
        setPendingUpgrades(prev => ({ ...prev, [cat]: cur - 1 }));
    };

    const employeeTypes = ['partners', 'seniors', 'mediors', 'juniors'];
    const handleEmployeeChange = (type, amt) => {
        setLocalEmployees(prev => {
            const nv = Math.max(0, (prev[type] || 0) + amt);
            if (type === 'partners' && nv < 1) return prev;
            return { ...prev, [type]: nv };
        });
    };

    const requestSubmit = () => {
        if (projectedMoney < 0) { toast.error("Not enough cash."); return; }
        if (totalSpend === 0 && firingCount === 0) {
            // No changes, just confirm directly
            executeSubmit();
            return;
        }
        const parts = [];
        if (upgradeCost > 0) parts.push(`Upgrades: ${upgradeCost.toLocaleString()}`);
        if (hiringCost > 0) parts.push(`Hiring: ${hiringCost.toLocaleString()}`);
        if (firingCount > 0) parts.push(`Firing ${firingCount} employee(s)`);
        setConfirmState({
            variant: firingCount > 0 ? 'danger' : 'info',
            message: `Confirm strategy: ${parts.join(' + ')}`,
            detail: `Cash after: ${projectedMoney.toLocaleString()}${firingCount > 0 ? ` | WARNING: Firing penalty not applicable (removed)` : ''}`,
            confirmLabel: `Spend ${totalSpend.toLocaleString()}`,
            onConfirm: executeSubmit,
        });
    };

    const executeSubmit = async () => {
        setIsSubmitting(true);
        try {
            const newMetrics = { ...(teamData.metrics || {}) };
            for (const [cat, targetLvl] of Object.entries(pendingUpgrades)) {
                const data = gameData.UPGRADES[cat];
                if (!data) continue;
                for (let i = (currentUpgrades[cat] || 0); i < targetLvl; i++) {
                    newMetrics[data.metric] = Math.min(100, (newMetrics[data.metric] || 0) + data.levels[i].boost);
                }
            }
            await updateDoc(doc(db, teamPath), {
                money: projectedMoney, upgrades: pendingUpgrades, employees: localEmployees,
                metrics: newMetrics, investments: {},
            });
            if (onConfirmStrategy) await onConfirmStrategy();
            toast.success("Strategy confirmed.");
            onClose();
        } catch (err) { toast.error("Failed to save."); }
        setIsSubmitting(false);
    };

    if (!isOpen) return null;

    // ── RESULTS VIEW ──
    if (step === 'results') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                <div className="bg-white w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
                    <div className={`p-6 text-white flex justify-between items-center ${roundProfit >= 0 ? 'bg-emerald-900' : 'bg-red-800'}`}>
                        <h2 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>Round {prevRound} Results</h2>
                        <button onClick={onClose} className="text-white hover:text-gray-200"><X size={20} /></button>
                    </div>
                    <div className="p-6 overflow-y-auto flex-1 space-y-5">
                        <div className="text-center">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Round Profit</div>
                            <div className={`text-4xl font-mono font-bold ${roundProfit >= 0 ? 'text-emerald-800' : 'text-red-700'}`}>
                                {roundProfit >= 0 ? '+' : ''}{roundProfit.toLocaleString()}
                            </div>
                            <div className="text-lg text-gray-600 mt-1">
                                Total Cash: <span className={`font-mono font-bold ${currentMoney >= 0 ? 'text-emerald-800' : 'text-red-700'}`}>{currentMoney.toLocaleString()}</span>
                            </div>
                        </div>

                        {(roundLogs.bidWins.length > 0 || roundLogs.bidLosses.length > 0) && (
                            <div>
                                <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wider mb-2">Bid Outcomes</h3>
                                {roundLogs.bidWins.map((m, i) => <div key={`w${i}`} className="p-3 bg-emerald-50 border-l-4 border-emerald-600 mb-2 text-sm text-gray-800">{m}</div>)}
                                {roundLogs.bidLosses.map((m, i) => <div key={`l${i}`} className="p-3 bg-red-50 border-l-4 border-red-500 mb-2 text-sm text-gray-800">{m}</div>)}
                            </div>
                        )}
                        {(roundLogs.projSuccess.length > 0 || roundLogs.projFail.length > 0) && (
                            <div>
                                <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wider mb-2">Project Execution</h3>
                                {roundLogs.projSuccess.map((m, i) => <div key={`s${i}`} className="p-3 bg-emerald-50 border-l-4 border-emerald-600 mb-2 text-sm text-gray-800">{m}</div>)}
                                {roundLogs.projFail.map((m, i) => <div key={`f${i}`} className="p-3 bg-red-50 border-l-4 border-red-500 mb-2 text-sm text-gray-800">{m}</div>)}
                            </div>
                        )}
                        {roundLogs.other.length > 0 && (
                            <div className="bg-stone-50 border border-stone-200 p-4">
                                {roundLogs.other.map((m, i) => <p key={i} className="text-sm text-gray-600 mb-1">{m}</p>)}
                            </div>
                        )}

                        <button onClick={() => setStep('shop')}
                            className="w-full bg-emerald-900 text-white font-bold py-3 px-6 hover:bg-emerald-800 transition tracking-wide flex items-center justify-center gap-2">
                            UPGRADE & HIRE <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── FULL-SCREEN SHOP ──
    return (
        <div className="fixed inset-0 z-50 bg-stone-50 overflow-y-auto">
            <div className="sticky top-0 z-10 bg-emerald-900 text-white shadow-lg">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>Upgrade Your Firm</h2>
                        <p className="text-sm text-emerald-200">Invest in upgrades and hire new team members.</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <div className="text-xs text-emerald-300 uppercase tracking-wider">Cash After</div>
                            <div className={`text-lg font-mono font-bold ${projectedMoney < 0 ? 'text-red-400' : 'text-white'}`}>
                                {projectedMoney.toLocaleString()}
                            </div>
                            {totalSpend > 0 && <div className="text-xs text-emerald-300">Spending: {totalSpend.toLocaleString()}</div>}
                        </div>
                        <button onClick={onClose} className="text-emerald-300 hover:text-white"><X size={22} /></button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Preview bar showing impact of pending upgrades */}
                {(metricBoosts.productivity > 0 || metricBoosts.clientSatisfaction > 0) && (
                    <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                            <div className="text-xs text-indigo-500 uppercase tracking-wider">Productivity After</div>
                            <div className="font-mono font-bold text-indigo-900">{previewMetrics.productivity}</div>
                        </div>
                        <div>
                            <div className="text-xs text-indigo-500 uppercase tracking-wider">Cost Reduction</div>
                            <div className="font-mono font-bold text-indigo-900">{previewDiscount}%</div>
                        </div>
                        <div>
                            <div className="text-xs text-indigo-500 uppercase tracking-wider">Client Sat After</div>
                            <div className="font-mono font-bold text-indigo-900">{previewMetrics.clientSatisfaction}</div>
                        </div>
                        <div>
                            <div className="text-xs text-indigo-500 uppercase tracking-wider">Grunt Work Rate</div>
                            <div className="font-mono font-bold text-indigo-900">{previewGruntRate.toLocaleString()}/cap</div>
                        </div>
                    </div>
                )}

                {/* UPGRADES */}
                <h3 className="text-lg font-bold text-gray-900 mb-4 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>Upgrades</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {Object.entries(gameData.UPGRADES).map(([cat, data]) => {
                        const baseLvl = currentUpgrades[cat] || 0;
                        const pendingLvl = pendingUpgrades[cat] || 0;
                        const boost = metricBoosts[data.metric] || 0;

                        return (
                            <div key={cat} className="bg-white border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>{data.name}</h4>
                                    {boost > 0 && (
                                        <span className="text-xs border border-emerald-400 text-emerald-800 bg-emerald-50 px-2 py-0.5 font-semibold">
                                            +{boost} {gameData.METRIC_INFO[data.metric]?.name}
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {data.levels.map((level, i) => {
                                        const isOwned = i < baseLvl;
                                        const isPending = i >= baseLvl && i < pendingLvl;
                                        const isNext = i === pendingLvl && pendingLvl < data.levels.length;
                                        const isLocked = i > pendingLvl;
                                        const canAfford = projectedMoney >= level.cost;

                                        return (
                                            <div key={i} className={`p-4 border-2 transition-all ${
                                                isOwned ? 'border-emerald-400 bg-emerald-50' :
                                                isPending ? 'border-blue-400 bg-blue-50' :
                                                isNext ? 'border-gray-200 bg-white' :
                                                'border-gray-100 bg-gray-50 opacity-40'
                                            }`}>
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-2 flex-1">
                                                        {isOwned && <Check size={16} className="text-emerald-700 mt-0.5 flex-shrink-0" />}
                                                        {isPending && <ShoppingCart size={16} className="text-blue-700 mt-0.5 flex-shrink-0" />}
                                                        {isLocked && <Lock size={16} className="text-gray-300 mt-0.5 flex-shrink-0" />}
                                                        <div>
                                                            <div className={`font-semibold text-sm ${isOwned ? 'text-emerald-800' : isPending ? 'text-blue-800' : 'text-gray-800'}`}>
                                                                Level {i + 1}: {level.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-0.5">{level.description}</div>
                                                            <div className="text-xs font-mono text-gray-500 mt-1">+{level.boost} {gameData.METRIC_INFO[data.metric]?.name}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <span className={`text-sm font-mono font-bold ${isOwned ? 'text-emerald-700' : isPending ? 'text-blue-700' : 'text-gray-600'}`}>
                                                            {level.cost.toLocaleString()}
                                                        </span>
                                                        {isOwned && <span className="text-xs bg-emerald-200 text-emerald-900 px-2 py-0.5 font-semibold">OWNED</span>}
                                                        {isPending && (
                                                            <button onClick={() => undoUpgrade(cat)} className="text-xs border border-red-300 text-red-700 bg-red-50 px-2 py-1 hover:bg-red-100">
                                                                Undo
                                                            </button>
                                                        )}
                                                        {isNext && (
                                                            <button onClick={() => buyUpgrade(cat)} disabled={!canAfford}
                                                                className="text-xs bg-emerald-900 text-white px-3 py-1 hover:bg-emerald-800 disabled:opacity-30 disabled:cursor-not-allowed font-semibold tracking-wide">
                                                                BUY
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* HIRING */}
                <h3 className="text-lg font-bold text-gray-900 mb-4 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>Hire / Fire</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {employeeTypes.map(type => {
                        const stats = gameData.SETUP_DATA.employees[type];
                        const diff = (localEmployees[type] || 0) - (teamData.employees[type] || 0);
                        return (
                            <div key={type} className={`p-4 border-2 bg-white ${
                                diff > 0 ? 'border-emerald-400' : diff < 0 ? 'border-red-400' : 'border-gray-200'
                            }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="font-semibold text-gray-900 text-sm">{stats.name}</div>
                                        <div className="text-xs text-gray-500 mt-1">{stats.description}</div>
                                        <div className="flex gap-2 mt-2 text-xs font-mono">
                                            <span className="border border-gray-300 px-2 py-0.5">{stats.hireCost.toLocaleString()}</span>
                                            <span className="border border-blue-300 px-2 py-0.5 text-blue-800 bg-blue-50">Cap {stats.capacity}</span>
                                            <span className="border border-purple-300 px-2 py-0.5 text-purple-800 bg-purple-50">Comp {stats.competency}</span>
                                        </div>
                                        {diff > 0 && <div className="text-xs text-emerald-700 mt-2 font-medium">+{diff} new ({(diff * stats.hireCost).toLocaleString()})</div>}
                                        {diff < 0 && <div className="text-xs text-red-700 mt-2 font-medium">{diff} fired</div>}
                                    </div>
                                    <div className="flex items-center space-x-2 ml-4">
                                        <NumButton type="remove" onClick={() => handleEmployeeChange(type, -1)}
                                            disabled={localEmployees[type] === 0 || (type === 'partners' && localEmployees[type] === 1)} />
                                        <span className="w-10 text-center font-mono font-bold text-lg">{localEmployees[type]}</span>
                                        <NumButton type="add" onClick={() => handleEmployeeChange(type, 1)}
                                            disabled={projectedMoney < stats.hireCost} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Inline confirm */}
                {confirmState && (
                    <div className="mb-4">
                        <ConfirmBar {...confirmState} onCancel={() => setConfirmState(null)} />
                    </div>
                )}

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t-2 border-emerald-900 p-4 -mx-4 shadow-lg">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            {totalSpend > 0
                                ? `Spending ${totalSpend.toLocaleString()} | Cash after: ${projectedMoney.toLocaleString()}`
                                : `No changes. Cash: ${currentMoney.toLocaleString()}`
                            }
                        </div>
                        <button onClick={requestSubmit} disabled={isSubmitting || projectedMoney < 0}
                            className="bg-emerald-900 text-white font-bold py-3 px-8 hover:bg-emerald-800 disabled:opacity-40 transition tracking-wide">
                            {isSubmitting ? "SAVING..." : totalSpend > 0 ? `CONFIRM (Spend ${totalSpend.toLocaleString()})` : "CONFIRM & READY UP"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
