import React, { useState } from 'react';
import { db } from '../../firebase/firebase.js';
import { collection, addDoc } from 'firebase/firestore';
import { toast } from 'sonner';

export const AdminProjectCreator = ({ gamePath, currentRound }) => {
    const [form, setForm] = useState({
        name: "New Project", complexity: 50, capacityCost: 20,
        estimatedCost: 100000, hiddenMarketPrice: 150000, rounds: [currentRound || 1],
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    };

    const toggleRound = (r) => {
        setForm(prev => {
            const rounds = [...prev.rounds];
            const idx = rounds.indexOf(r);
            if (idx >= 0) rounds.splice(idx, 1); else rounds.push(r);
            rounds.sort((a, b) => a - b);
            return { ...prev, rounds };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.rounds || form.rounds.length === 0) { toast.error("Select at least one round."); return; }
        setIsLoading(true);
        try {
            await addDoc(collection(db, gamePath, 'projects'), { ...form });
            toast.success(`Project created for round(s) ${form.rounds.join(', ')}.`);
            setForm({ name: "New Project", complexity: 50, capacityCost: 20, estimatedCost: 100000, hiddenMarketPrice: 150000, rounds: [currentRound || 1] });
        } catch (err) { toast.error(`Failed: ${err.message}`); }
        setIsLoading(false);
    };

    const fields = [
        { name: 'name', label: 'Project Name', type: 'text', wide: true },
        { name: 'complexity', label: 'Complexity', type: 'number' },
        { name: 'capacityCost', label: 'Capacity Cost', type: 'number' },
        { name: 'estimatedCost', label: 'Estimated Cost', type: 'number' },
        { name: 'hiddenMarketPrice', label: 'Market Price', type: 'number' },
    ];

    return (
        <div className="bg-white p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b border-gray-200 pb-2" style={{ fontFamily: 'Georgia, serif' }}>Create New Project</h2>
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {fields.map(f => (
                        <div key={f.name} className={f.wide ? 'md:col-span-2' : ''}>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">{f.label}</label>
                            <input type={f.type} name={f.name} value={form[f.name]} onChange={handleChange}
                                className="w-full border border-gray-300 px-3 py-2 text-sm font-mono" required />
                        </div>
                    ))}
                </div>
                <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Appears in Rounds</label>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(r => (
                            <button key={r} type="button" onClick={() => toggleRound(r)}
                                className={`w-8 h-8 text-sm font-mono font-bold border transition-all ${
                                    form.rounds.includes(r) ? 'bg-emerald-900 text-white border-emerald-900'
                                    : 'bg-white text-gray-400 border-gray-300 hover:border-emerald-600 hover:text-emerald-700'
                                }`}>{r}</button>
                        ))}
                    </div>
                </div>
                <button type="submit" disabled={isLoading}
                    className="w-full bg-emerald-900 text-white font-semibold py-3 px-6 hover:bg-emerald-800 disabled:opacity-50 tracking-wide">
                    {isLoading ? "Creating..." : "CREATE PROJECT"}
                </button>
            </form>
        </div>
    );
};
