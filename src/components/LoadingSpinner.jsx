import React from 'react';

/**
 * A simple loading spinner
 */
export const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-evergreen"></div>
    </div>
);