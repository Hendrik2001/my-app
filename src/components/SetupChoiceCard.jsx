import React from 'react';

export const SetupChoiceCard = ({ title, options, selectedId, onSelect }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">{title}</h3>
        <div className="space-y-3">
            {options.map((opt) => {
                const isSelected = opt.id === selectedId;
                return (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => onSelect(opt.id)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition ${isSelected ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-gray-200 hover:border-indigo-400'}`}
                    >
                        <div className="flex justify-between items-center">
                            <span className={`font-semibold ${isSelected ? 'text-indigo-700' : 'text-gray-700'}`}>{opt.name}</span>
                            <span className={`font-medium ${isSelected ? 'text-indigo-600' : 'text-gray-600'}`}>
                                €{opt.cost.toLocaleString()}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{opt.effect}</p>
                    </button>
                );
            })}
        </div>
    </div>
);