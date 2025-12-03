import React from 'react';
import { Plus, Minus } from 'lucide-react';

export const NumButton = ({ onClick, disabled = false, type = 'add' }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`w-8 h-8 rounded-full transition ${type === 'add' ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-gray-400 hover:bg-gray-500'} text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
    >
        {type === 'add' ? <Plus size={16} /> : <Minus size={16} />}
    </button>
);