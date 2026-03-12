import React, { useState, useMemo } from 'react';
import { db } from '../../firebase/firebase.js';
import { doc, updateDoc } from 'firebase/firestore';
import gameData from '../../constants/gameData.js';
import { toast } from 'sonner';
import { ConfirmBar } from '../../components/ConfirmBar.jsx';
import { Zap, Target, Globe, ChevronDown, ChevronRight } from 'lucide-react';

function resolveTarget(event, allTeams) {
    const active = allTeams.filter(t => !t.needsSetup);
    if (active.length === 0) return null;
    const rule = event.targetRule;
    if (rule === 'random') return active[Math.floor(Math.random() * active.length)];
    if (rule === 'highestMoney') return active.reduce((best, t) => (t.money || 0) > (best.money || 0) ? t : best, active[0]);
    if (rule === 'lowestProfit') return active.reduce((best, t) => (t.profit ?? Infinity) < (best.profit ?? Infinity) ? t : best, active[0]);
    if (rule === 'highestProfit') return active.reduce((best, t) => (t.profit || 0) > (best.profit || 0) ? t : best, active[0]);
    if (rule === 'highestClientSat') return active.reduce((best, t) => (t.metrics?.clientSatisfaction || 0) > (best.metrics?.clientSatisfaction || 0) ? t : best, active[0]);
    if (rule === 'highestRoundProfit') return active.reduce((best, t) => (t.profit || 0) > (best.profit || 0) ? t : best, active[0]);
    return active[0];
}

export const EventPanel = ({ gamePath, gameState, allTeams }) => {
    const [confirmState, setConfirmState] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const activeEvent = gameState?.activeEvent || null;

    const globalEvents = gameData.GAME_EVENTS.filter(e => e.type === 'global');
    const targetedEvents = gameData.GAME_EVENTS.filter(e => e.type === 'targeted');

    const handleTriggerEvent = async (event) => {
        let targetTeam = null;
        if (event.type === 'targeted') {
            targetTeam = resolveTarget(event, allTeams);
            if (!targetTeam) { toast.error("No eligible teams."); return; }
        }
        setConfirmState({
            variant: 'warning',
            message: `Trigger "${event.name}"?`,
            detail: event.type === 'targeted'
                ? `Affects: ${targetTeam.teamName} | ${event.display}`
                : event.display,
            confirmLabel: 'Trigger Event',
            onConfirm: async () => {
                try {
                    await updateDoc(doc(db, gamePath), {
                        activeEvent: {
                            id: event.id,
                            name: event.name,
                            description: event.description,
                            display: event.display,
                            type: event.type,
                            effect: event.effect,
                            value: event.value,
                            target: event.target || null,
                            condition: event.condition || null,
                            targetTeamId: targetTeam?.id || null,
                            targetTeamName: targetTeam?.teamName || null,
                        }
                    });
                    toast.success(`Event "${event.name}" triggered!`);
                } catch (err) { toast.error(`Failed: ${err.message}`); }
                setConfirmState(null);
            },
        });
    };

    const handleClearEvent = async () => {
        try {
            await updateDoc(doc(db, gamePath), { activeEvent: null });
            toast.success("Event cleared.");
        } catch (err) { toast.error(`Failed: ${err.message}`); }
    };

    return (
        <div className="bg-white p-6 border border-gray-200">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
                    <Zap size={18} className="inline mr-2 text-amber-600" />Game Events
                </h2>
                {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>

            {isOpen && (
                <div className="mt-4 space-y-4">
                    {/* Active event display */}
                    {activeEvent && (
                        <div className="p-4 bg-amber-50 border-2 border-amber-400">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Active Event</span>
                                <button onClick={handleClearEvent} className="text-xs text-red-600 hover:text-red-800 font-semibold">Clear</button>
                            </div>
                            <div className="font-bold text-gray-900">{activeEvent.name}</div>
                            <div className="text-sm text-gray-600">{activeEvent.description}</div>
                            <div className="text-sm font-mono text-amber-800 mt-1">{activeEvent.display}</div>
                            {activeEvent.targetTeamName && (
                                <div className="text-sm text-amber-700 mt-1 font-semibold">Target: {activeEvent.targetTeamName}</div>
                            )}
                        </div>
                    )}

                    {confirmState && (
                        <ConfirmBar {...confirmState} onCancel={() => setConfirmState(null)} />
                    )}

                    {/* Global events */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Globe size={14} /> Global Events
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {globalEvents.map(event => (
                                <button key={event.id} onClick={() => handleTriggerEvent(event)}
                                    className="p-3 border border-gray-200 bg-white hover:border-amber-400 hover:bg-amber-50 transition text-left">
                                    <div className="font-semibold text-sm text-gray-900">{event.name}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{event.description}</div>
                                    <div className="text-xs font-mono text-amber-700 mt-1">{event.display}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Targeted events */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Target size={14} /> Targeted Events
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {targetedEvents.map(event => {
                                const potentialTarget = resolveTarget(event, allTeams);
                                return (
                                    <button key={event.id} onClick={() => handleTriggerEvent(event)}
                                        className="p-3 border border-gray-200 bg-white hover:border-red-300 hover:bg-red-50 transition text-left">
                                        <div className="font-semibold text-sm text-gray-900">{event.name}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{event.description}</div>
                                        <div className="text-xs font-mono text-red-700 mt-1">{event.display}</div>
                                        {potentialTarget && (
                                            <div className="text-xs text-gray-400 mt-1">Would affect: <span className="font-semibold text-gray-600">{potentialTarget.teamName}</span></div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
