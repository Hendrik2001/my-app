import React from 'react';
import { Building, Signal, Smile } from 'lucide-react';

// Use export const
export const FirmVisual = ({ visuals }) => {
    const { officeLevel = 1, techLevel = 1, happinessLevel = 1 } = visuals || {};
    
    return (
        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center p-2 relative">
            <Building
                size={48 + (officeLevel - 1) * 12}
                className="text-gray-700"
                strokeWidth={1.5}
            />
            {techLevel >= 2 && (
                <Signal size={20} className="text-blue-500 absolute top-2 right-2" />
            )}
            {happinessLevel >= 2 && (
                <Smile size={20} className="text-green-500 absolute bottom-2 left-2" />
            )}
        </div>
    );
}