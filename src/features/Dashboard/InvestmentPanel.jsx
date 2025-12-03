import React, { useState, useEffect, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase.js';
import { NumButton } from '../../components/NumButton.jsx';
import { toast } from 'sonner';

export const InvestmentPanel = ({ teamPath, teamData, gameState }) => {
    // Local state to manage investments for this round
    const [investments, setInvestments] = useState(teamData.investments || { ai: 0, client: 0, dividends: 0 });
    const isLocked = gameState.stage !== 'investment';

    // Reset local state if teamData changes (e.g., new round)
    useEffect(() => {
        setInvestments(teamData.investments);
    }, [teamData.investments]);

    const totalSpent = useMemo(() => {
        return Object.values(investments).reduce((a, b) => a + b, 0);
    }, [investments]);

    const budgetLeft = teamData.money - totalSpent;

    const handleInvestmentChange = (type, amount) => {
        const newAmount = (investments[type] || 0) + amount;
        
        // Don't go below zero
        if (newAmount < 0) return; 

        // Check if this new change exceeds the budget
        const newTotalSpent = totalSpent - (investments[type] || 0) + newAmount;
        if (newTotalSpent > teamData.money) {
            toast.error("Not enough cash for this investment!");
            return;
        }

        const newInvestments = { ...investments, [type]: newAmount };
        setInvestments(newInvestments); // Update local state immediately

        // Debounce or save on button click? For now, save immediately.
        updateInvestmentInFirebase(newInvestments);
    };

    // This function will be called on every change.
    // In a real app, you might want to debounce this.
    const updateInvestmentInFirebase = async (newInvestments) => {
        try {
            await updateDoc(doc(db, teamPath), { investments: newInvestments });
        } catch (err) {
            console.error("Error updating investments: ", err);
            toast.error("Failed to save investment.");
        }
    };

    const investmentItems = [
        { type: 'ai', name: 'AI & Tech', step: 10000 },
        { type: 'client', name: 'Client Relations & BD', step: 5000 },
        { type: 'dividends', name: 'Pay Dividends to Partners', step: 20000 },
    ];

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Round Investments</h2>
            {isLocked && (
                <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg mb-4 text-center">
                    Investments are locked during the {gameState.stage} phase.
                </div>
            )}
            <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="text-sm font-medium text-indigo-700">Investment Budget (Remaining)</div>
                <div className="text-3xl font-bold text-indigo-600">€{budgetLeft.toLocaleString()}</div>
            </div>

            <div className="space-y-6">
                {investmentItems.map(item => (
                    <div key={item.type}>
                        <label className="text-lg font-medium text-gray-700">{item.name}</label>
                        <div className="flex items-center space-x-3 mt-2">
                            <NumButton
                                type="remove"
                                onClick={() => handleInvestmentChange(item.type, -item.step)}
                                disabled={isLocked || (investments[item.type] || 0) === 0}
                            />
                            <span className="text-xl font-bold w-32 text-center text-indigo-600">
                                €{(investments[item.type] || 0).toLocaleString()}
                            </span>
                            <NumButton
                                type="add"
                                onClick={() => handleInvestmentChange(item.type, item.step)}
                                disabled={isLocked || budgetLeft < item.step}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};