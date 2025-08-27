
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Feature, FeatureStatus } from '@/lib/types';
import { motion } from 'framer-motion';
import { PlusIcon, TrashIcon, EditIcon, XIcon } from '../Icons';
import { useAppContext } from '@/components/providers/AppProvider';

const statusOptions: FeatureStatus[] = ['✅ Completed', '🟡 Needs Improvement', '🔴 Needs Refactor', '⚪ Planned'];

const FeaturesDictionary: React.FC = () => {
    const { setStatus, clearError } = useAppContext();
    const [features, setFeatures] = useState<Feature[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentFeature, setCurrentFeature] = useState<Partial<Feature> | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchFeatures = useCallback(async () => {
        setIsLoading(true);
        clearError();
        try {
            const res = await fetch('/api/features');
            if (!res.ok) throw new Error('Failed to fetch features');
            const data = await res.json();
            setFeatures(data);
        } catch (error) {
            setStatus({ error: (error as Error).message });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [setStatus, clearError]);

    useEffect(() => {
        fetchFeatures();
    }, [fetchFeatures]);

    const handleOpenForm = (feature: Partial<Feature> | null = null) => {
        setCurrentFeature(feature || {
            name: '',
            overview: '',
            status: '⚪ Planned',
            ui_ux_breakdown_json: '[]',
            logic_flow: '',
            key_files_json: '[]',
            notes: '',
        });
        setIsFormOpen(true);
    };
    
    const handleSaveFeature = async () => {
        if (!currentFeature || !currentFeature.name) return;
        clearError();
        const isUpdating = !!currentFeature.id;
        const url = isUpdating ? `/api/features/${currentFeature.id}` : '/api/features';
        const method = isUpdating ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentFeature),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `Failed to ${isUpdating ? 'update' : 'create'} feature`);
            }
            
            await fetchFeatures();
            setIsFormOpen(false);
            setCurrentFeature(null);
        } catch (error) {
            setStatus({ error: (error as Error).message });
            console.error(error);
        }
    };

    const handleDeleteFeature = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this feature?')) {
            clearError();
            try {
                const res = await fetch(`/api/features/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to delete feature');
                await fetchFeatures();
            } catch (error) {
                setStatus({ error: (error as Error).message });
                console.error(error);
            }
        }
    };
    
    const renderForm = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h3 className="font-semibold text-lg">{currentFeature?.id ? 'Edit Feature' : 'New Feature'}</h3>
                    <button onClick={() => setIsFormOpen(false)} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input value={currentFeature?.name || ''} onChange={e => setCurrentFeature({...currentFeature, name: e.target.value})} placeholder="Feature Name" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                        <select value={currentFeature?.status || '⚪ Planned'} onChange={e => setCurrentFeature({...currentFeature, status: e.target.value as FeatureStatus})} className="w-full p-2 bg-gray-700 rounded-lg text-sm">
                            {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <textarea value={currentFeature?.overview || ''} onChange={e => setCurrentFeature({...currentFeature, overview: e.target.value})} placeholder="Overview" className="w-full p-2 bg-gray-700 rounded-lg text-sm" rows={3}></textarea>
                    <textarea value={currentFeature?.logic_flow || ''} onChange={e => setCurrentFeature({...currentFeature, logic_flow: e.target.value})} placeholder="Logic & Data Flow" className="w-full p-2 bg-gray-700 rounded-lg text-sm" rows={5}></textarea>
                    <div>
                        <label className="text-xs text-gray-400">UI/UX Breakdown (JSON Array)</label>
                        <textarea value={currentFeature?.ui_ux_breakdown_json || '[]'} onChange={e => setCurrentFeature({...currentFeature, ui_ux_breakdown_json: e.target.value})} className="w-full p-2 bg-gray-700 rounded-lg text-sm font-mono" rows={5}></textarea>
                    </div>
                     <div>
                        <label className="text-xs text-gray-400">Key Files (JSON Array of strings)</label>
                        <textarea value={currentFeature?.key_files_json || '[]'} onChange={e => setCurrentFeature({...currentFeature, key_files_json: e.target.value})} className="w-full p-2 bg-gray-700 rounded-lg text-sm font-mono" rows={3}></textarea>
                    </div>
                    <textarea value={currentFeature?.notes || ''} onChange={e => setCurrentFeature({...currentFeature, notes: e.target.value})} placeholder="Notes & Improvements" className="w-full p-2 bg-gray-700 rounded-lg text-sm" rows={3}></textarea>
                </div>
                <div className="flex gap-2 p-4 border-t border-gray-700">
                    <button onClick={handleSaveFeature} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-500">Save Feature</button>
                    <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500">Cancel</button>
                </div>
            </motion.div>
        </motion.div>
    );

    return (
        <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold">Features Dictionary</h3>
                <button onClick={() => handleOpenForm()} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm">
                    <PlusIcon className="w-5 h-5" /> Add Feature
                </button>
            </div>

            {isFormOpen && renderForm()}

            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-800 sticky top-0">
                        <tr>
                            <th className="p-3">Name</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Overview</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={4} className="text-center p-4">Loading features...</td></tr>
                        ) : features.map(feature => (
                            <motion.tr key={feature.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="p-3 font-medium align-top">{feature.name}</td>
                                <td className="p-3 align-top whitespace-nowrap">{feature.status}</td>
                                <td className="p-3 align-top max-w-md"><p className="truncate">{feature.overview}</p></td>
                                <td className="p-3 align-top">
                                    <div className="flex gap-4">
                                        <button onClick={() => handleOpenForm(feature)} title="Edit"><EditIcon className="w-5 h-5 text-gray-400 hover:text-blue-400"/></button>
                                        <button onClick={() => handleDeleteFeature(feature.id)} title="Delete"><TrashIcon className="w-5 h-5 text-gray-400 hover:text-red-500"/></button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FeaturesDictionary;
