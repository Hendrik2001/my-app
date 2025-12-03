import React, { useState } from 'react';
import { db } from '../../firebase/firebase.js';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';

export const AdminProjectList = ({ projects, gamePath }) => {
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    // Sort projects by round, then by name
    const sortedProjects = [...projects].sort((a, b) => {
        if (a.round !== b.round) return (a.round || 0) - (b.round || 0);
        return a.name.localeCompare(b.name);
    });

    const handleEditClick = (project) => {
        setEditingId(project.id);
        setEditForm({ ...project });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const handleSave = async () => {
        try {
            const projectRef = doc(db, gamePath, 'projects', editingId);
            await updateDoc(projectRef, editForm);
            toast.success("Project updated successfully!");
            setEditingId(null);
        } catch (err) {
            console.error(err);
            toast.error(`Failed to update project: ${err.message}`);
        }
    };

    const handleDelete = async (projectId) => {
        if (!window.confirm("Are you sure you want to delete this project?")) return;
        try {
            const projectRef = doc(db, gamePath, 'projects', projectId);
            await deleteDoc(projectRef);
            toast.success("Project deleted.");
        } catch (err) {
            console.error(err);
            toast.error(`Failed to delete project: ${err.message}`);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg mt-6">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Project Management</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Round</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complexity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedProjects.map((project) => (
                            <tr key={project.id}>
                                {editingId === project.id ? (
                                    <>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="number"
                                                name="round"
                                                value={editForm.round}
                                                onChange={handleChange}
                                                className="w-16 border rounded px-2 py-1"
                                                min="1"
                                                max="10"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="text"
                                                name="name"
                                                value={editForm.name}
                                                onChange={handleChange}
                                                className="w-full border rounded px-2 py-1"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="number"
                                                name="complexity"
                                                value={editForm.complexity}
                                                onChange={handleChange}
                                                className="w-16 border rounded px-2 py-1"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="number"
                                                name="estimatedCost"
                                                value={editForm.estimatedCost}
                                                onChange={handleChange}
                                                className="w-24 border rounded px-2 py-1"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button onClick={handleSave} className="text-green-600 hover:text-green-900">Save</button>
                                            <button onClick={handleCancelEdit} className="text-gray-600 hover:text-gray-900">Cancel</button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.round}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.complexity}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">€{project.estimatedCost?.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button onClick={() => handleEditClick(project)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                            <button onClick={() => handleDelete(project.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                        {sortedProjects.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No projects found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
