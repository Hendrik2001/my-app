import React, { useState } from 'react';
import { db } from '../../firebase/firebase.js';
import { collection, addDoc } from 'firebase/firestore';
import { toast } from 'sonner';

export const AdminProjectCreator = ({ gamePath, currentRound }) => {
    const [form, setForm] = useState({
        name: "New Project",
        complexity: 50,
        capacityCost: 20,
        estimatedCost: 100000,
        hiddenMarketPrice: 150000,
        round: currentRound || 1, // Default to current round
    });
    const [isLoading, setIsLoading] = useState(false);

    // Update form round when currentRound changes (optional, but good UX)
    React.useEffect(() => {
        setForm(prev => ({ ...prev, round: currentRound || 1 }));
    }, [currentRound]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const projectsRef = collection(db, gamePath, 'projects');
            await addDoc(projectsRef, {
                ...form,
                // round is now taken from the form
            });
            toast.success(`New project added for Round ${form.round}!`);
            // Reset form
            setForm({
                name: "New Project",
                complexity: 50,
                capacityCost: 20,
                estimatedCost: 100000,
                hiddenMarketPrice: 150000,
                round: currentRound || 1,
            });
        } catch (err) {
            console.error(err);
            toast.error(`Failed to create project: ${err.message}`);
        }
        setIsLoading(false);
    };

    const fields = [
        { name: 'name', type: 'text' },
        { name: 'complexity', type: 'number' },
        { name: 'capacityCost', type: 'number' },
        { name: 'estimatedCost', type: 'number' },
        { name: 'hiddenMarketPrice', type: 'number' },
        { name: 'round', type: 'number', min: 1, max: 10 }, // Added round field
    ];

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Create New Project</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map(f => (
                    <div key={f.name}>
                        <label className="block text-sm font-medium text-gray-700 capitalize">{f.name}</label>
                        <input
                            type={f.type}
                            name={f.name}
                            value={form[f.name]}
                            onChange={handleChange}
                            min={f.min}
                            max={f.max}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            required
                        />
                    </div>
                ))}
                <div className="md:col-span-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-evergreen text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-opacity-90 disabled:opacity-50"
                    >
                        {isLoading ? "Creating..." : `Add Project for Round ${form.round}`}
                    </button>
                </div>
            </form>
        </div>
    );
};