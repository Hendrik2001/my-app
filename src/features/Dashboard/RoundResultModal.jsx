import React, { useState, useEffect, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase.js';
import { NumButton } from '../../components/NumButton.jsx';
import gameData from '../../constants/gameData.js';
import { toast } from 'sonner';

export const RoundResultModal = ({ isOpen, onClose, teamData, teamPath, gameState, logs }) => {
    const [step, setStep] = useState('results'); // 'results' or 'invest'
    const [localInvestments, setLocalInvestments] = useState({ ai: 0, client: 0, dividends: 0 });
    const [localEmployees, setLocalEmployees] = useState({ ...teamData.employees });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset local state when modal opens or teamData changes
    useEffect(() => {
        if (isOpen) {
            setStep('results');
            setLocalInvestments(teamData.investments || { ai: 0, client: 0, dividends: 0 });
            setLocalEmployees({ ...teamData.employees });
        }
    }, [isOpen, teamData]);

    const roundProfit = teamData.profit || 0;
    const currentMoney = teamData.money || 0;

    // --- Investment Logic ---
    const investmentItems = [
        { type: 'ai', name: 'AI & Tech', step: 10000, impact: '+0.2 Productivity / €10k' },
        { type: 'client', name: 'Client Relations', step: 5000, impact: '+0.2 Client Sat / €5k' },
        { type: 'dividends', name: 'Dividends', step: 20000, impact: '+0.2 Partner Sat / €20k' },
    ];

    const handleInvestmentChange = (type, amount) => {
        setLocalInvestments(prev => {
            const newVal = Math.max(0, (prev[type] || 0) + amount);
            return { ...prev, [type]: newVal };
        });
    };

    // --- Hiring Logic ---
    const employeeTypes = ['juniors', 'mediors', 'seniors', 'partners'];

    const handleEmployeeChange = (type, amount) => {
        setLocalEmployees(prev => {
            const newVal = Math.max(0, (prev[type] || 0) + amount);
            if (type === 'partners' && newVal < 1) return prev; // Min 1 partner
            return { ...prev, [type]: newVal };
        });
    };

    // --- Calculations ---
    const { totalInvestmentCost, hiringCost, projectedMoney, firedCount } = useMemo(() => {
        const invCost = Object.values(localInvestments).reduce((a, b) => a + b, 0);

        let hireCost = 0;
        let fired = 0;
        for (const type of employeeTypes) {
            const diff = localEmployees[type] - (teamData.employees[type] || 0);
            if (diff > 0) {
                hireCost += diff * gameData.SETUP_DATA.employees[type].hireCost;
            } else if (diff < 0) {
                fired += Math.abs(diff);
            }
        }

        return {
            totalInvestmentCost: invCost,
            hiringCost: hireCost,
            projectedMoney: currentMoney - invCost - hireCost,
            firedCount: fired
        };
    }, [localInvestments, localEmployees, teamData.employees, currentMoney]);

    const handleSubmit = async () => {
        // Allow submission if we are not spending more money (i.e., just firing or doing nothing),
        // even if we are already in debt.
        const isSpending = totalInvestmentCost > 0 || hiringCost > 0;
        if (projectedMoney < 0 && isSpending) {
            toast.error("You don't have enough money for these upgrades!");
            return;
        }
        setIsSubmitting(true);
        try {
            const updates = {
                investments: localInvestments,
                employees: localEmployees
            };

            // Apply firing penalty
            if (firedCount > 0) {
                const penalty = firedCount * 5;
                const currentSat = teamData.metrics?.employeeSatisfaction || 50;
                const newSat = Math.max(0, currentSat - penalty);

                updates['metrics.employeeSatisfaction'] = newSat;
                toast.warning(`Fired ${firedCount} employees. Satisfaction decreased by ${penalty}.`);
            }

            await updateDoc(doc(db, teamPath), updates);
            toast.success("Investments & Hiring confirmed!");
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Failed to save.");
        }
        setIsSubmitting(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-indigo-700 p-6 text-white flex justify-between items-center">
                    <h2 className="text-2xl font-bold">
                        {step === 'results' ? `Round ${gameState.currentRound - 1} Results` : `Round ${gameState.currentRound} Strategy`}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-200 focus:outline-none"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {step === 'results' ? (
                        <div className="space-y-6 text-center">
                            <div>
                                <div className="text-gray-500 uppercase tracking-wide text-sm font-semibold">Round Profit</div>
                                <div className={`text-4xl font-extrabold ${roundProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {roundProfit >= 0 ? '+' : ''}€{roundProfit.toLocaleString()}
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg text-left max-h-60 overflow-y-auto">
                                <h3 className="font-bold text-gray-700 mb-2">Round Log</h3>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    {logs.filter(l => l.round === gameState.currentRound - 1).map((log, i) => (
                                        <li key={i}>• {log.message}</li>
                                    ))}
                                    {logs.filter(l => l.round === gameState.currentRound - 1).length === 0 && (
                                        <li>No activity recorded for the last round.</li>
                                    )}
                                </ul>
                            </div>

                            <button
                                onClick={() => setStep('invest')}
                                className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-indigo-700 transition"
                            >
                                Reinvest Earnings
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Budget Header */}
                            <div className="flex justify-between items-center bg-gray-100 p-4 rounded-lg">
                                <span className="text-gray-700 font-medium">Available Cash:</span>
                                <span className={`text-xl font-bold ${projectedMoney < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    €{projectedMoney.toLocaleString()}
                                </span>
                            </div>

                            {/* Investments Section */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Investments</h3>
                                <div className="space-y-4">
                                    {investmentItems.map(item => (
                                        <div key={item.type} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div>
                                                <div className="font-medium text-gray-700">{item.name}</div>
                                                <div className="text-xs text-green-600">{item.impact}</div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <NumButton
                                                    type="remove"
                                                    onClick={() => handleInvestmentChange(item.type, -item.step)}
                                                    disabled={(localInvestments[item.type] || 0) === 0}
                                                />
                                                <span className="w-24 text-center font-mono font-bold">
                                                    €{(localInvestments[item.type] || 0).toLocaleString()}
                                                </span>
                                                <NumButton
                                                    type="add"
                                                    onClick={() => handleInvestmentChange(item.type, item.step)}
                                                    disabled={projectedMoney < item.step}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Hiring Section */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Hiring</h3>
                                <div className="space-y-4">
                                    {employeeTypes.map(type => {
                                        const stats = gameData.SETUP_DATA.employees[type];
                                        return (
                                            <div key={type} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div>
                                                    <div className="font-medium text-gray-700 capitalize">{stats.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        Hire: €{stats.hireCost.toLocaleString()} | Cap: {stats.capacity} | Comp: {stats.competency}
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <NumButton
                                                        type="remove"
                                                        onClick={() => handleEmployeeChange(type, -1)}
                                                        disabled={localEmployees[type] === 0 || (type === 'partners' && localEmployees[type] === 1)}
                                                    />
                                                    <span className="w-12 text-center font-bold">{localEmployees[type]}</span>
                                                    <NumButton
                                                        type="add"
                                                        onClick={() => handleEmployeeChange(type, 1)}
                                                        disabled={projectedMoney < stats.hireCost}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {firedCount > 0 && (
                                <div className="p-3 bg-red-100 text-red-800 rounded-lg text-sm text-center font-medium">
                                    ⚠️ Warning: Firing {firedCount} employee(s) will decrease satisfaction by {firedCount * 5}.
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || (projectedMoney < 0 && (totalInvestmentCost > 0 || hiringCost > 0))}
                                className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-green-700 disabled:opacity-50 transition"
                            >
                                {isSubmitting ? "Saving..." : "Confirm Strategy"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
