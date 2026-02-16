import React from 'react';

export const SetupChoiceCard = ({ title, options, selectedId, onSelect }) => (
    <div className="bg-white p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>{title}</h3>
        <div className="space-y-2">
            {options.map((opt) => {
                const isSelected = opt.id === selectedId;
                return (
                    <button key={opt.id} type="button" onClick={() => onSelect(opt.id)}
                        className={`w-full text-left p-4 border-2 transition-all ${isSelected ? 'border-emerald-800 bg-emerald-50' : 'border-gray-200 hover:border-emerald-700 bg-white'}`}>
                        <div className="flex justify-between items-center">
                            <span className={`font-semibold text-sm ${isSelected ? 'text-emerald-900' : 'text-gray-700'}`}>{opt.name}</span>
                            <span className={`font-mono text-sm ${isSelected ? 'text-emerald-800' : 'text-gray-500'}`}>{opt.cost.toLocaleString()}</span>
                        </div>
                        {opt.description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{opt.description}</p>}
                        <div className="flex flex-wrap gap-2 mt-2">
                            {opt.prodBoost > 0 && <span className="text-xs border border-amber-300 text-amber-800 px-2 py-0.5 bg-amber-50">+{opt.prodBoost} Productivity</span>}
                            {opt.clientBoost > 0 && <span className="text-xs border border-blue-300 text-blue-800 px-2 py-0.5 bg-blue-50">+{opt.clientBoost} Client Sat.</span>}
                        </div>
                    </button>
                );
            })}
        </div>
    </div>
);
