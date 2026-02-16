import React from 'react';

export const LogPanel = ({ logs }) => (
    <div className="bg-white p-6 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b border-gray-200 pb-2" style={{ fontFamily: 'Georgia, serif' }}>Round Logs</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.length === 0 && (
                <p className="text-gray-500 text-sm">No logs yet. Complete a round to see your results.</p>
            )}
            {logs.map(log => (
                <div key={log.id} className="p-3 bg-stone-50 border border-stone-200">
                    <p className="text-sm text-gray-700">
                        <span className="font-bold text-emerald-900">Round {log.round}: </span>
                        {log.message}
                    </p>
                </div>
            ))}
        </div>
    </div>
);
