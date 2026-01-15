import React from 'react';

export const LogPanel = ({ logs }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Round Logs</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
            {logs.length === 0 && (
                <p className="text-gray-500">No logs yet. Complete a round to see your results.</p>
            )}
            {logs.map(log => (
                <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                        <span className="font-bold text-evergreen">Round {log.round}: </span>
                        {log.message}
                    </p>
                </div>
            ))}
        </div>
    </div>
);