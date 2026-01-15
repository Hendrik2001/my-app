import React, { useState, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase.js';
// Import the default object
import gameData from '../../constants/gameData.js';
import { NumButton } from '../../components/NumButton.jsx';
import { SetupChoiceCard } from '../../components/SetupChoiceCard.jsx';
import { toast } from 'sonner';

// Use the new object-based data for choices
const officeOptions = Object.keys(gameData.SETUP_DATA.office).map(key => ({
    id: key,
    ...gameData.SETUP_DATA.office[key]
}));

const techOptions = Object.keys(gameData.SETUP_DATA.tech).map(key => ({
    id: key,
    ...gameData.SETUP_DATA.tech[key]
}));

// Create salary options from the arrays in gameData
const salaryOptions = gameData.SETUP_DATA.salaryMultipliers.map((mult, index) => ({
    id: index, // Use index 0, 1, or 2 as the ID
    name: `x${mult} (Satisfaction ${gameData.SETUP_DATA.salarySatisfactionBoost[index] > 0 ? '+' : ''}${gameData.SETUP_DATA.salarySatisfactionBoost[index]})`,
    cost: 0, // Cost is a multiplier, not a flat fee
    effect: `x${mult} base salary, ${gameData.SETUP_DATA.salarySatisfactionBoost[index]} Emp. Sat.`
}));


export const FirmSetup = ({ teamId, teamName, gamePath }) => {
    // Note: State now uses the object keys from your gameData
    const [office, setOffice] = useState('basic');
    const [tech, setTech] = useState('basic');
    const [salaryIndex, setSalaryIndex] = useState(1); // 1 is 'Market' (index 1 in the array)
    const [employees, setEmployees] = useState({
        juniors: 1,
        mediors: 0,
        seniors: 0,
        partners: 1,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { totalCost, remaining } = useMemo(() => {
        // Use the new data structure (e.g., gameData.SETUP_DATA.office[office].cost)
        const officeCost = gameData.SETUP_DATA.office[office]?.cost || 0;
        const techCost = gameData.SETUP_DATA.tech[tech]?.cost || 0;

        let employeeCost = 0;
        for (const [type, count] of Object.entries(employees)) {
            employeeCost += (gameData.SETUP_DATA.employees[type]?.hireCost || 0) * count;
        }

        const totalCost = officeCost + techCost + employeeCost;
        // Use the new import path for STARTING_CAPITAL
        const remaining = gameData.STARTING_CAPITAL - totalCost;
        return { totalCost, remaining };
    }, [office, tech, employees]);

    const handleEmployeeChange = (type, amount) => {
        setEmployees(prev => {
            const newVal = Math.max(0, (prev[type] || 0) + amount);
            if (type === 'partners' && newVal < 1) return prev;
            if (type === 'juniors' && newVal < 1) return prev;
            return { ...prev, [type]: newVal };
        });
    };

    const handleSubmit = async () => {
        if (remaining < 0) {
            toast.error("You cannot spend more than your starting capital!");
            return;
        }
        setIsSubmitting(true);

        try {
            const teamDocRef = doc(db, gamePath, 'teams', teamId);

            // Get data from the new structure
            const officeData = gameData.SETUP_DATA.office[office];
            const techData = gameData.SETUP_DATA.tech[tech];
            const salaryBoost = gameData.SETUP_DATA.salarySatisfactionBoost[salaryIndex];

            let baseProd = 50 + (techData.prodBoost || 0);
            let baseEmpSat = 50 + (officeData.empBoost || 0) + (salaryBoost || 0);
            let baseClientSat = 50 + (officeData.clientBoost || 0);

            await updateDoc(teamDocRef, {
                money: remaining,
                config: {
                    office: office,
                    tech: tech,
                    salaryIndex: salaryIndex, // Store the index (0, 1, or 2)
                },
                employees: employees,
                metrics: {
                    productivity: baseProd,
                    employeeSatisfaction: baseEmpSat,
                    clientSatisfaction: baseClientSat,
                    partnerSatisfaction: 50,
                },
                investments: {
                    ai: 0,
                    client: 0,
                    dividends: 0,
                },
                needsSetup: false,
            });

            toast.success("Your firm has been established!");

        } catch (err) {
            console.error(err);
            toast.error(`Failed to save setup: ${err.message}`);
            setIsSubmitting(false);
        }
    };

    const employeeTypes = ['juniors', 'mediors', 'seniors', 'partners'];

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white p-6 rounded-xl shadow-2xl mb-6 text-center">
                    <h1 className="text-3xl font-bold text-evergreen">Establish Your Firm</h1>
                    <p className="text-lg text-slate-muted mt-2">Welcome, {teamName}. Spend your starting capital to build your firm.</p>
                </div>

                <div className="fixed bottom-4 right-4 z-10">
                    <div className="p-6 bg-white rounded-xl shadow-2xl border-2 border-evergreen">
                        <div className="text-sm font-medium text-slate-muted">Starting Capital</div>
                        <div className="text-2xl font-bold text-green-600">€{gameData.STARTING_CAPITAL.toLocaleString()}</div>
                        <div className="text-sm font-medium text-slate-muted mt-2">Total Cost</div>
                        <div className="text-xl font-bold text-red-600">- €{totalCost.toLocaleString()}</div>
                        <hr className="my-2" />
                        <div className="text-sm font-medium text-slate-muted">Remaining Cash</div>
                        <div className={`text-3xl font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-700'}`}>
                            €{remaining.toLocaleString()}
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || remaining < 0}
                            className="w-full bg-evergreen text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-evergreen focus:ring-offset-2 transition mt-4 disabled:opacity-50"
                        >
                            {isSubmitting ? "Saving..." : "Found Firm"}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
                    <SetupChoiceCard
                        title="1. Choose Your Office"
                        options={officeOptions}
                        selectedId={office}
                        onSelect={setOffice}
                    />
                    <SetupChoiceCard
                        title="2. Choose Your Tech Stack"
                        options={techOptions}
                        selectedId={tech}
                        onSelect={setTech}
                    />
                    <SetupChoiceCard
                        title="3. Set Salary Level"
                        options={salaryOptions}
                        selectedId={salaryIndex}
                        onSelect={setSalaryIndex}
                    />
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">4. Hire Your Team</h3>
                        <div className="space-y-4">
                            {employeeTypes.map(type => (
                                <div key={type} className="flex items-center justify-between">
                                    <span className="text-lg font-medium capitalize text-gray-700">{type}s</span>
                                    <div className="flex items-center space-x-3">
                                        <NumButton
                                            type="remove"
                                            onClick={() => handleEmployeeChange(type, -1)}
                                            disabled={employees[type] === 0 || (type === 'partners' && employees[type] === 1) || (type === 'juniors' && employees[type] === 1)}
                                        />
                                        <span className="text-xl font-bold w-12 text-center">{employees[type]}</span>
                                        <NumButton type="add" onClick={() => handleEmployeeChange(type, 1)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-gray-500 mt-4">Hiring cost is calculated in your total cost. Salaries will be a recurring cost each round.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};