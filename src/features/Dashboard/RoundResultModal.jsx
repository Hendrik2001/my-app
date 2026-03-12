import React, { useState, useEffect, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase.js';
import { NumButton } from '../../components/NumButton.jsx';
import { ConfirmBar } from '../../components/ConfirmBar.jsx';
import gameData from '../../constants/gameData.js';
import { getProductivityDiscount, calculateGruntWorkRate, calculateLeverageRatio, getLeverageWarning } from '../../utils/gameCalculations.js';
import { toast } from 'sonner';
import { Lock, Check, X, ArrowRight, ShoppingCart } from 'lucide-react';

export const RoundResultModal = ({ isOpen, onClose, onConfirmStrategy, onOpenBidding, teamData, teamPath, gameState, logs, initialStep }) => {
    const prevRound = gameState.currentRound - 1;
    const hasResults = prevRound >= 1 && logs.some(l => l.round === prevRound);

    const [step, setStep] = useState(hasResults ? 'results' : 'shop');
    const [pendingUpgrades, setPendingUpgrades] = useState({});
    const [localEmployees, setLocalEmployees] = useState({ ...teamData.employees });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmState, setConfirmState] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setStep(initialStep || (hasResults ? 'results' : 'shop'));
            setPendingUpgrades({ ...(teamData.upgrades || { ai: 0, client: 0 }) });
            setLocalEmployees({ ...teamData.employees });
            setConfirmState(null);
        }
    }, [isOpen, teamData, hasResults, initialStep]);

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

    const { upgradeCost, hiringCost, firingCount, firingRefund, totalSpend, projectedMoney, metricBoosts } = useMemo(() => {
        let upCost = 0;
        const boosts = { capacityBoost: 0, competencyBoost: 0 };
        for (const [cat, targetLvl] of Object.entries(pendingUpgrades)) {
            const data = gameData.UPGRADES[cat];
            if (!data) continue;
            const baseLvl = currentUpgrades[cat] || 0;
            boosts[data.metric] = boosts[data.metric] || 0;
            for (let i = baseLvl; i < targetLvl; i++) {
                upCost += data.levels[i].cost;
                boosts[data.metric] += data.levels[i].boost;
                if (data.levels[i].capacityBoost) boosts.capacityBoost += data.levels[i].capacityBoost;
                if (data.levels[i].competencyBoost) boosts.competencyBoost += data.levels[i].competencyBoost;
            }
        }
        let hireCost = 0, fired = 0, refund = 0;
        for (const type of ['partners', 'seniors', 'mediors', 'juniors']) {
            const diff = (localEmployees[type] || 0) - (teamData.employees[type] || 0);
            const empData = gameData.SETUP_DATA.employees[type];
            if (diff > 0) hireCost += diff * empData.hireCost;
            else if (diff < 0) {
                const count = Math.abs(diff);
                fired += count;
                refund += count * (empData.hireCost * 0.5);
            }
        }
        const netSpend = upCost + hireCost - refund;
        return {
            upgradeCost: upCost,
            hiringCost: hireCost,
            firingCount: fired,
            firingRefund: refund,
            totalSpend: netSpend,
            projectedMoney: currentMoney - netSpend,
            metricBoosts: boosts
        };
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
    const hasAnyBoosts = Object.values(metricBoosts).some(v => v > 0);

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
            // Enforce leverage hard cap when adding juniors/mediors
            if (amt > 0 && (type === 'juniors' || type === 'mediors')) {
                const testEmployees = { ...prev, [type]: nv };
                const ratio = calculateLeverageRatio({ employees: testEmployees });
                if (ratio >= 8) {
                    toast.error('Leverage cap (8:1) reached. Hire a senior or partner first.');
                    return prev;
                }
            }
            return { ...prev, [type]: nv };
        });
    };

    const requestSubmit = () => {
        if (totalSpend > 0 && projectedMoney < 0) { toast.error("Not enough cash for these changes."); return; }
        if (totalSpend === 0 && firingCount === 0) {
            // No changes, just confirm directly
            executeSubmit();
            return;
        }
        const parts = [];
        if (upgradeCost > 0) parts.push(`Upgrades: ${upgradeCost.toLocaleString()}`);
        if (hiringCost > 0) parts.push(`Hiring: ${hiringCost.toLocaleString()}`);
        if (firingRefund > 0) parts.push(`Firing Refund: +${firingRefund.toLocaleString()}`);

        setConfirmState({
            variant: firingCount > 0 ? 'info' : 'info',
            message: `Confirm strategy: ${parts.join(' + ')}`,
            detail: `Net Change: ${totalSpend.toLocaleString()} | Cash after: ${projectedMoney.toLocaleString()}`,
            confirmLabel: totalSpend > 0 ? `Spend ${totalSpend.toLocaleString()}` : totalSpend < 0 ? `Receive ${Math.abs(totalSpend).toLocaleString()}` : 'Confirm Changes',
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
                <div className="bg-white w-full max-w-2xl shadow-2xl relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 border-b-4 border-emerald-900 inline-block pb-1" style={{ fontFamily: 'Georgia, serif' }}>Round {prevRound} Results</h2>
                        </div>

                        <div className="text-center mb-6">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Round Profit</div>
                            <div className={`text-4xl font-mono font-bold ${roundProfit >= 0 ? 'text-emerald-800' : 'text-red-700'}`}>
                                {roundProfit >= 0 ? '+' : ''}{roundProfit.toLocaleString()}
                            </div>
                            <div className="text-lg text-gray-600 mt-1">
                                Total Cash: <span className={`font-mono font-bold ${currentMoney >= 0 ? 'text-emerald-800' : 'text-red-700'}`}>{currentMoney.toLocaleString()}</span>
                            </div>
                        </div>

                        {(roundLogs.bidWins.length > 0 || roundLogs.bidLosses.length > 0) && (
                            <div className="mb-6">
                                <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wider mb-2">Bid Outcomes</h3>
                                {roundLogs.bidWins.map((m, i) => <div key={`w${i}`} className="p-3 bg-emerald-50 border-l-4 border-emerald-600 mb-2 text-sm text-gray-800">{m}</div>)}
                                {roundLogs.bidLosses.map((m, i) => {
                                    const sep = m.indexOf('||SCOREDATA||');
                                    if (sep === -1) {
                                        // Fallback: old format
                                        return <div key={`l${i}`} className="p-3 bg-red-50 border-l-4 border-red-500 mb-3 text-sm text-gray-800">{m}</div>;
                                    }
                                    const projectName = m.slice('[LOST] '.length, sep).replace(/^"|"$/g, '');
                                    let sd = null;
                                    try { sd = JSON.parse(m.slice(sep + '||SCOREDATA||'.length)); } catch { }
                                    const mine = sd?.mine;
                                    const winner = sd?.winner;
                                    const reasons = sd?.reasons || [];
                                    const fmt = (v) => (v || 0).toFixed(1);
                                    const gapNum = (key) => winner ? ((winner[key] || 0) - (mine?.[key] || 0)) : 0;
                                    const rows = [
                                        { label: 'Price Score', key: 'price', desc: '40% weight — how competitive your bid was vs market price' },
                                        { label: 'Reputation', key: 'rep', desc: '35% weight — your Client Satisfaction score' },
                                        { label: 'Competency', key: 'comp', desc: '25% weight — team skill vs project complexity' },
                                    ];
                                    return (
                                        <div key={`l${i}`} className="mb-4 border border-red-300 bg-red-50">
                                            <div className="px-4 py-3 border-b border-red-200 flex items-center gap-2">
                                                <X size={14} className="text-red-600 flex-shrink-0" />
                                                <span className="font-semibold text-red-800 text-sm">Lost bid: "{projectName}"</span>
                                                {mine && winner && (
                                                    <span className="ml-auto text-xs font-mono text-red-600">Your total: {fmt(mine.total)} vs Winner: {fmt(winner.total)}</span>
                                                )}
                                            </div>
                                            {mine && (
                                                <div className="p-4">
                                                    <table className="w-full text-xs">
                                                        <thead>
                                                            <tr className="text-gray-500 uppercase tracking-wider">
                                                                <th className="text-left pb-2 font-semibold">Dimension</th>
                                                                <th className="text-center pb-2 font-semibold">You</th>
                                                                {winner && <th className="text-center pb-2 font-semibold">Winner</th>}
                                                                {winner && <th className="text-center pb-2 font-semibold">Gap</th>}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {rows.map(row => {
                                                                const g = gapNum(row.key);
                                                                return (
                                                                    <tr key={row.key} className="border-t border-red-200">
                                                                        <td className="py-2 pr-4">
                                                                            <div className="font-semibold text-gray-800">{row.label}</div>
                                                                            <div className="text-gray-500 text-[10px]">{row.desc}</div>
                                                                        </td>
                                                                        <td className="text-center py-2 font-mono font-bold text-gray-800">{fmt(mine[row.key])}</td>
                                                                        {winner && <td className="text-center py-2 font-mono font-bold text-gray-800">{fmt(winner[row.key])}</td>}
                                                                        {winner && (
                                                                            <td className="text-center py-2">
                                                                                <span className={`font-mono font-bold px-2 py-0.5 text-xs ${g > 1 ? 'text-red-700 bg-red-200' : g < -1 ? 'text-emerald-700 bg-emerald-100' : 'text-gray-600 bg-gray-100'}`}>
                                                                                    {g > 0 ? `-${fmt(g)}` : g < 0 ? `+${fmt(Math.abs(g))}` : '—'}
                                                                                </span>
                                                                            </td>
                                                                        )}
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                    {reasons.length > 0 && (
                                                        <div className="mt-3 pt-3 border-t border-red-200 space-y-1">
                                                            {reasons.map((r, ri) => (
                                                                <p key={ri} className="text-xs text-red-800 flex items-start gap-1.5">
                                                                    <span className="mt-0.5 flex-shrink-0">▸</span> {r}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {(roundLogs.projSuccess.length > 0 || roundLogs.projFail.length > 0) && (
                            <div className="mb-6">
                                <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wider mb-2">Project Execution</h3>
                                {roundLogs.projSuccess.map((m, i) => <div key={`s${i}`} className="p-3 bg-emerald-50 border-l-4 border-emerald-600 mb-2 text-sm text-gray-800">{m}</div>)}
                                {roundLogs.projFail.map((m, i) => <div key={`f${i}`} className="p-3 bg-red-50 border-l-4 border-red-500 mb-2 text-sm text-gray-800">{m}</div>)}
                            </div>
                        )}
                        {roundLogs.other.length > 0 && (
                            <div className="bg-stone-50 border border-stone-200 p-4 mb-6">
                                {roundLogs.other.map((m, i) => <p key={i} className="text-sm text-gray-600 mb-1">{m}</p>)}
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <button onClick={() => { onClose(); if (onOpenBidding) onOpenBidding(); }}
                                className="w-full bg-emerald-900 text-white font-bold py-3 px-6 hover:bg-emerald-800 transition tracking-wide flex items-center justify-center gap-2">
                                CONTINUE TO BIDDING <ArrowRight size={16} />
                            </button>
                            <button onClick={() => setStep('shop')}
                                className="text-sm text-gray-500 hover:text-emerald-700 font-medium py-2">
                                Skip to Upgrades & Hiring
                            </button>
                        </div>
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
                        {hasResults && (
                            <button onClick={() => setStep('results')}
                                className="text-sm font-medium text-emerald-300 hover:text-white flex items-center gap-2">
                                <ArrowRight size={14} className="rotate-180" /> VIEW RESULTS
                            </button>
                        )}
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
                {hasAnyBoosts && (
                    <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
                        <div>
                            <div className="text-xs text-indigo-500 uppercase tracking-wider">Productivity After</div>
                            <div className="font-mono font-bold text-indigo-900">{previewMetrics.productivity} {metricBoosts.productivity > 0 && <span className="text-emerald-700 text-xs">+{metricBoosts.productivity}</span>}</div>
                        </div>
                        <div>
                            <div className="text-xs text-indigo-500 uppercase tracking-wider">Cost Reduction</div>
                            <div className="font-mono font-bold text-indigo-900">{previewDiscount}%</div>
                        </div>
                        <div>
                            <div className="text-xs text-indigo-500 uppercase tracking-wider">Client Sat After</div>
                            <div className="font-mono font-bold text-indigo-900">{previewMetrics.clientSatisfaction} {metricBoosts.clientSatisfaction > 0 && <span className="text-emerald-700 text-xs">+{metricBoosts.clientSatisfaction}</span>}</div>
                        </div>
                        {metricBoosts.capacityBoost > 0 && (
                            <div>
                                <div className="text-xs text-indigo-500 uppercase tracking-wider">Capacity Boost</div>
                                <div className="font-mono font-bold text-indigo-900 text-emerald-700">+{metricBoosts.capacityBoost}</div>
                            </div>
                        )}
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
                                            <div key={i} className={`p-4 border-2 transition-all ${isOwned ? 'border-emerald-400 bg-emerald-50' :
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
                                                            <div className="flex flex-wrap gap-2 mt-1">
                                                                <span className="text-xs font-mono text-gray-500">+{level.boost} {gameData.METRIC_INFO[data.metric]?.name}</span>
                                                                {level.capacityBoost > 0 && <span className="text-xs font-mono text-blue-600">+{level.capacityBoost} Capacity</span>}
                                                                {level.competencyBoost > 0 && <span className="text-xs font-mono text-purple-600">+{level.competencyBoost} Competency</span>}
                                                            </div>
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
                            <div key={type} className={`p-4 border-2 bg-white ${diff > 0 ? 'border-emerald-400' : diff < 0 ? 'border-red-400' : 'border-gray-200'
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
                        <button onClick={requestSubmit} disabled={isSubmitting || (totalSpend > 0 && projectedMoney < 0)}
                            className="bg-emerald-900 text-white font-bold py-3 px-8 hover:bg-emerald-800 disabled:opacity-40 transition tracking-wide">
                            {isSubmitting ? "SAVING..." : totalSpend > 0 ? `CONFIRM (Spend ${totalSpend.toLocaleString()})` : "CONFIRM & READY UP"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
