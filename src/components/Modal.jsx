import React from 'react';
import { X } from 'lucide-react';

/**
 * A reusable modal component
 */
const Modal = ({ children, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-6 relative max-w-lg w-full">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
                <X size={24} />
            </button>
            {children}
        </div>
    </div>
);

export default Modal;