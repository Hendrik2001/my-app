import React, { useState, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase.js';
import gameData from '../../constants/gameData.js';
import { getProductivityDiscount, calculateGruntWorkRate } from '../../utils/gameCalculations.js';
import { NumButton } from '../../components/NumButton.jsx';
import { SetupChoiceCard } from '../../components/SetupChoiceCard.jsx';
import { toast } from 'sonner';

const officeOptions = Object.keys(gameData.SETUP_DATA.office).map(key => ({ id: key, ...gameData.SETUP_DATA.office[key] }));
const techOptions = Object.keys(gameData.SETUP_DATA.tech).map(key => ({ id: key, ...gameData.SETUP_DATA.tech[key] }));

export const FirmSetup = ({ teamId, teamName, gamePath }) => {
    const [office, setOffice] = useState('basic');
    const [tech, setTech] = useState('basic');
    const [employees, setEmployees] = useState({ juniors: 1, mediors: 0, seniors: 0, partners: 1 });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const computed = useMemo(() => {
        const od = gameData.SETUP_DATA.office[office];
        const td = gameData.SETUP_DATA.tech[tech];
        let empCost = 0, capacity = 0, competency = 0;
        for (const [type, count] of Object.entries(employees)) {
            const d = gameData.SETUP_DATA.employees[type];
            empCost += (d?.hireCost || 0) * count;
            capacity += (d?.capacity || 0) * count;
            competency += (d?.competency || 0) * count;
        }
        const totalCost = (od?.cost || 0) + (td?.cost || 0) + empCost;
        const remaining = gameData.STARTING_CAPITAL - totalCost;
        const productivity = 0 + (td?.prodBoost || 0);
        const clientSat = 0 + (od?.clientBoost || 0);
        const discount = getProductivityDiscount(productivity);
        const gruntRate = calculateGruntWorkRate(productivity);
        return { totalCost, remaining, capacity, competency, productivity, clientSat, discount, gruntRate };
    }, [office, tech, employees]);

    const handleEmployeeChange = (type, amount) => {
        setEmployees(prev => {
            const d = gameData.SETUP_DATA.employees[type];
            const nv = Math.max(0, (prev[type] || 0) + amount);
            if (d.minAtSetup && nv < d.minAtSetup) return prev;
            if (d.maxAtSetup !== undefined && nv > d.maxAtSetup) return prev;
            return { ...prev, [type]: nv };
        });
    };

    const handleSubmit = async () => {
        if (computed.remaining < 0) { toast.error("Over budget."); return; }
        setIsSubmitting(true);
        try {
            const od = gameData.SETUP_DATA.office[office];
            const td = gameData.SETUP_DATA.tech[tech];
            await updateDoc(doc(db, gamePath, 'teams', teamId), {
                money: computed.remaining, config: { office, tech }, employees,
                metrics: { productivity: computed.productivity, clientSatisfaction: computed.clientSat },
                upgrades: { ai: 0, client: 0 },
                investments: {}, bids: {},
                needsSetup: false, ready: false,
            });
            toast.success("Firm established.");
        } catch (err) { toast.error(`Failed: ${err.message}`); setIsSubmitting(false); }
    };

    const employeeTypes = ['partners', 'seniors', 'mediors', 'juniors'];

    return (
        <div className="min-h-screen bg-stone-50 p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <div className="bg-emerald-900 text-white p-8 mb-6">
                    <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>Establish Your Firm</h1>
                    <p className="text-emerald-200 mt-2">Welcome, <span className="text-white font-semibold">{teamName}</span>. Starting budget: {gameData.STARTING_CAPITAL.toLocaleString()}.</p>
                    <div className="mt-4 p-3 bg-emerald-800 border border-emerald-700 text-sm text-emerald-100 space-y-1">
                        <p><strong>How you earn money:</strong> Win project bids, then execute them. Revenue = your bid price minus execution cost.</p>
                        <p><strong>Grunt work:</strong> Any team capacity not used on projects earns passive income. Currently {computed.gruntRate.toLocaleString()} per unused capacity point per round. Productivity increases this rate.</p>
                        <p><strong>Two key metrics:</strong> Productivity (reduces costs, boosts grunt work) and Client Satisfaction (helps you win bids at higher prices). Both start at 0 and grow through upgrades and successful work.</p>
                    </div>
                </div>

                {/* Floating summary */}
                <div className="fixed bottom-4 right-4 z-10">
                    <div className="p-5 bg-white border-2 border-emerald-900 shadow-xl w-72">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Budget</div>
                        <div className="text-lg font-mono text-gray-900">{gameData.STARTING_CAPITAL.toLocaleString()}</div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">Setup Cost</div>
                        <div className="text-lg font-mono text-red-700">-{computed.totalCost.toLocaleString()}</div>
                        <div className="border-t border-gray-300 my-2"></div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Remaining</div>
                        <div className={`text-2xl font-mono font-bold ${computed.remaining < 0 ? 'text-red-600' : 'text-emerald-800'}`}>
                            {computed.remaining.toLocaleString()}
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-stone-100 p-2 text-center border border-stone-200">
                                <div className="text-gray-500 uppercase" style={{ fontSize: '10px' }}>Capacity</div>
                                <div className="font-bold font-mono text-gray-900">{computed.capacity}</div>
                            </div>
                            <div className="bg-stone-100 p-2 text-center border border-stone-200">
                                <div className="text-gray-500 uppercase" style={{ fontSize: '10px' }}>Competency</div>
                                <div className="font-bold font-mono text-gray-900">{computed.competency}</div>
                            </div>
                            <div className="bg-amber-50 p-2 text-center border border-amber-200">
                                <div className="text-amber-700 uppercase" style={{ fontSize: '10px' }}>Productivity</div>
                                <div className="font-bold font-mono text-amber-900">{computed.productivity}</div>
                                {computed.discount > 0 && <div className="text-amber-600" style={{ fontSize: '10px' }}>-{computed.discount}% costs</div>}
                            </div>
                            <div className="bg-blue-50 p-2 text-center border border-blue-200">
                                <div className="text-blue-700 uppercase" style={{ fontSize: '10px' }}>Client Sat.</div>
                                <div className="font-bold font-mono text-blue-900">{computed.clientSat}</div>
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 text-center">
                            Grunt work: ~{(computed.capacity * computed.gruntRate).toLocaleString()}/round if idle
                        </div>

                        <button onClick={handleSubmit} disabled={isSubmitting || computed.remaining < 0}
                            className="w-full bg-emerald-900 text-white font-semibold py-3 px-6 mt-4 hover:bg-emerald-800 transition disabled:opacity-40 tracking-wide">
                            {isSubmitting ? "Saving..." : "ESTABLISH FIRM"}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
                    <SetupChoiceCard title="Office" options={officeOptions} selectedId={office} onSelect={setOffice} />
                    <SetupChoiceCard title="Technology" options={techOptions} selectedId={tech} onSelect={setTech} />

                    <div className="bg-white p-6 border border-gray-200 md:col-span-2">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>Hire Your Team</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {employeeTypes.map(type => {
                                const d = gameData.SETUP_DATA.employees[type];
                                const atCap = d.maxAtSetup !== undefined && employees[type] >= d.maxAtSetup;
                                const atMin = (d.minAtSetup && employees[type] <= d.minAtSetup) || employees[type] === 0;
                                return (
                                    <div key={type} className={`p-4 border-2 ${atCap ? 'border-amber-400 bg-amber-50' : 'border-gray-200'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-gray-900 text-sm">{d.name}</span>
                                                    {d.minAtSetup && <span className="text-xs bg-emerald-900 text-white px-2 py-0.5">Required</span>}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">{d.description}</p>
                                            </div>
                                            <div className="flex items-center space-x-2 ml-3">
                                                <NumButton type="remove" onClick={() => handleEmployeeChange(type, -1)} disabled={atMin} />
                                                <span className="text-lg font-mono font-bold w-8 text-center">{employees[type]}</span>
                                                <NumButton type="add" onClick={() => handleEmployeeChange(type, 1)} disabled={atCap} />
                                            </div>
                                        </div>
                                        <div className="flex gap-2 text-xs font-mono">
                                            <span className="border border-gray-300 px-2 py-0.5 text-gray-700">{d.hireCost.toLocaleString()}</span>
                                            <span className="border border-blue-300 px-2 py-0.5 text-blue-800 bg-blue-50">Cap {d.capacity}</span>
                                            <span className="border border-purple-300 px-2 py-0.5 text-purple-800 bg-purple-50">Comp {d.competency}</span>
                                        </div>
                                        {atCap && <div className="text-xs text-amber-700 mt-2">Max {d.maxAtSetup} at setup. Hire more between rounds.</div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
