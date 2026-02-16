import React, { useState, useMemo } from 'react';
import { db } from '../../firebase/firebase.js';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { ConfirmBar } from '../../components/ConfirmBar.jsx';
import { ChevronDown, ChevronRight, Pencil, Trash2, Copy, Save, XCircle } from 'lucide-react';

export const AdminProjectList = ({ projects, gamePath }) => {
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [openRounds, setOpenRounds] = useState({});
    const [confirmDelete, setConfirmDelete] = useState(null); // { id, name }

    const projectsByRound = useMemo(() => {
        const grouped = {};
        for (let r = 1; r <= 9; r++) grouped[r] = [];
        projects.forEach(project => {
            const rounds = project.rounds || (project.round ? [project.round] : [1]);
            rounds.forEach(r => { if (grouped[r]) grouped[r].push(project); });
        });
        return grouped;
    }, [projects]);

    const toggleRound = (r) => setOpenRounds(prev => ({ ...prev, [r]: !prev[r] }));

    const handleEditClick = (project) => {
        setEditingId(project.id);
        setEditForm({ ...project, rounds: project.rounds || (project.round ? [project.round] : [1]) });
    };
    const handleCancelEdit = () => { setEditingId(null); setEditForm({}); };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setEditForm(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    };

    const toggleEditRound = (r) => {
        setEditForm(prev => {
            const rounds = [...(prev.rounds || [])];
            const idx = rounds.indexOf(r);
            if (idx >= 0) rounds.splice(idx, 1); else rounds.push(r);
            rounds.sort((a, b) => a - b);
            return { ...prev, rounds };
        });
    };

    const handleSave = async () => {
        if (!editForm.rounds || editForm.rounds.length === 0) { toast.error("Select at least one round."); return; }
        try {
            const { id, ...data } = editForm;
            delete data.round;
            await updateDoc(doc(db, gamePath, 'projects', editingId), data);
            toast.success("Project updated.");
            setEditingId(null);
        } catch (err) { toast.error(`Failed: ${err.message}`); }
    };

    const executeDelete = async (projectId) => {
        try {
            await deleteDoc(doc(db, gamePath, 'projects', projectId));
            toast.success("Project deleted.");
        } catch (err) { toast.error(`Failed: ${err.message}`); }
        setConfirmDelete(null);
    };

    const handleDuplicate = (project) => {
        handleEditClick(project);
        toast.info("Edit the rounds to add this project to additional rounds.");
    };

    const fields = [
        { key: 'name', label: 'Name', type: 'text', wide: true },
        { key: 'complexity', label: 'Complexity', type: 'number' },
        { key: 'capacityCost', label: 'Capacity Cost', type: 'number' },
        { key: 'estimatedCost', label: 'Estimated Cost', type: 'number' },
        { key: 'hiddenMarketPrice', label: 'Market Price', type: 'number' },
    ];

    const RoundBadges = ({ rounds, editable, onToggle }) => (
        <div className="flex gap-1 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(r => {
                const active = rounds.includes(r);
                return (
                    <button key={r} type="button" onClick={editable ? () => onToggle(r) : undefined}
                        className={`w-7 h-7 text-xs font-mono font-bold border transition-all ${
                            active ? 'bg-emerald-900 text-white border-emerald-900'
                            : editable ? 'bg-white text-gray-400 border-gray-300 hover:border-emerald-600 hover:text-emerald-700'
                            : 'bg-gray-100 text-gray-300 border-gray-200'
                        } ${editable ? 'cursor-pointer' : 'cursor-default'}`}>
                        {r}
                    </button>
                );
            })}
        </div>
    );

    return (
        <div className="bg-white p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b border-gray-200 pb-2" style={{ fontFamily: 'Georgia, serif' }}>
                Project Management
            </h2>
            <p className="text-sm text-gray-500 mb-4">Projects grouped by round. A project can appear in multiple rounds via the round toggles.</p>

            <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(round => {
                    const roundProjects = projectsByRound[round] || [];
                    const isOpen = openRounds[round] || false;
                    return (
                        <div key={round} className="border border-gray-200">
                            <button onClick={() => toggleRound(round)}
                                className="w-full flex items-center justify-between p-3 bg-stone-50 hover:bg-stone-100 transition text-left">
                                <div className="flex items-center gap-3">
                                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    <span className="font-semibold text-gray-900 text-sm">Round {round}</span>
                                    <span className="text-xs text-gray-500">{roundProjects.length} project(s)</span>
                                </div>
                            </button>
                            {isOpen && (
                                <div className="divide-y divide-gray-100">
                                    {roundProjects.length === 0 && <div className="p-4 text-sm text-gray-400 text-center">No projects in this round.</div>}
                                    {roundProjects.map(project => {
                                        const isEditing = editingId === project.id;
                                        const projectRounds = project.rounds || (project.round ? [project.round] : [1]);
                                        const isDeleting = confirmDelete?.id === project.id;

                                        if (isEditing) {
                                            return (
                                                <div key={project.id} className="p-4 bg-blue-50 border-l-4 border-blue-500">
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                                                        {fields.map(f => (
                                                            <div key={f.key} className={f.wide ? 'col-span-2 md:col-span-3' : ''}>
                                                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">{f.label}</label>
                                                                <input type={f.type} name={f.key} value={editForm[f.key] || ''} onChange={handleChange}
                                                                    className="w-full border border-gray-300 px-2 py-1.5 text-sm font-mono" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="mb-3">
                                                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Appears in Rounds</label>
                                                        <RoundBadges rounds={editForm.rounds || []} editable={true} onToggle={toggleEditRound} />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={handleSave} className="flex items-center gap-1 bg-emerald-900 text-white text-sm px-3 py-1.5 hover:bg-emerald-800">
                                                            <Save size={14} /> Save
                                                        </button>
                                                        <button onClick={handleCancelEdit} className="flex items-center gap-1 bg-gray-200 text-gray-700 text-sm px-3 py-1.5 hover:bg-gray-300">
                                                            <XCircle size={14} /> Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={project.id} className="p-4 hover:bg-stone-50 transition">
                                                {isDeleting && (
                                                    <div className="mb-3">
                                                        <ConfirmBar
                                                            variant="danger"
                                                            message={`Delete "${project.name}" permanently?`}
                                                            confirmLabel="Delete"
                                                            onConfirm={() => executeDelete(project.id)}
                                                            onCancel={() => setConfirmDelete(null)}
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-semibold text-gray-900 text-sm">{project.name}</span>
                                                            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 border border-gray-200">C{project.complexity}</span>
                                                        </div>
                                                        <div className="flex gap-4 text-xs text-gray-500 font-mono">
                                                            <span>Cap: {project.capacityCost}</span>
                                                            <span>Est: {(project.estimatedCost || 0).toLocaleString()}</span>
                                                            <span>Mkt: {(project.hiddenMarketPrice || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div className="mt-2"><RoundBadges rounds={projectRounds} editable={false} /></div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => handleEditClick(project)} title="Edit"
                                                            className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition"><Pencil size={14} /></button>
                                                        <button onClick={() => handleDuplicate(project)} title="Edit rounds"
                                                            className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-blue-50 transition"><Copy size={14} /></button>
                                                        <button onClick={() => setConfirmDelete({ id: project.id, name: project.name })} title="Delete"
                                                            className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 transition"><Trash2 size={14} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
