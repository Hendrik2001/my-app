import React from 'react';

/**
 * Inline confirmation bar. Replaces window.confirm() with a visible UI element.
 * 
 * Usage:
 *   const [confirm, setConfirm] = useState(null);
 *   // Trigger: setConfirm({ message: "Are you sure?", onConfirm: () => doThing() })
 *   // Render: {confirm && <ConfirmBar {...confirm} onCancel={() => setConfirm(null)} />}
 */
export const ConfirmBar = ({ message, detail, onConfirm, onCancel, confirmLabel = "Confirm", variant = "warning" }) => {
    const styles = {
        warning: "bg-amber-50 border-amber-400 text-amber-900",
        danger: "bg-red-50 border-red-400 text-red-900",
        info: "bg-blue-50 border-blue-400 text-blue-900",
    };
    const btnStyles = {
        warning: "bg-amber-700 hover:bg-amber-800",
        danger: "bg-red-800 hover:bg-red-900",
        info: "bg-blue-700 hover:bg-blue-800",
    };

    return (
        <div className={`p-4 border-2 ${styles[variant] || styles.warning} animate-in`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                    <p className="font-semibold text-sm">{message}</p>
                    {detail && <p className="text-xs mt-1 opacity-80">{detail}</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <button onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition">
                        Cancel
                    </button>
                    <button onClick={() => { onConfirm(); onCancel(); }}
                        className={`px-4 py-2 text-sm font-semibold text-white ${btnStyles[variant] || btnStyles.warning} transition tracking-wide`}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
