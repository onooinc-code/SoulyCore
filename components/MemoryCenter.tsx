
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Entity, Tool } from '@/lib/types';
import { useAppContext } from '@/components/providers/AppProvider';
import { XIcon, TrashIcon, PlusIcon, EditIcon } from './Icons';
import { motion } from 'framer-motion';
import { useLog } from './providers/LogProvider';

type Tab = 'structured' | 'procedural' | 'settings';

interface MemoryCenterProps {
    setIsOpen: (isOpen: boolean) => void;
}

const MemoryCenter: React.FC<MemoryCenterProps> = ({ setIsOpen }) => {
    const { setStatus, clearError } = useAppContext();
    const { log } = useLog();
    
    const [activeTab, setActiveTab] = useState<Tab>('structured');
    const [entities, setEntities] = useState<Entity[]>([]);
    const [tools, setTools] = useState<Tool[]>([]); // Placeholder
    const [stats, setStats] = useState({ entities: 0, knowledge: 0 });
    
    const [entityForm, setEntityForm] = useState<Partial<Entity>>({});
    const [isEntityFormVisible, setIsEntityFormVisible] = useState(false);

    const fetchData = useCallback(async () => {
        clearError();
        log('Fetching memory center data (entities)...');
        try {
            const [entitiesRes] = await Promise.all([
                fetch('/api/entities'),
                // In a real app, you might fetch knowledge stats too
            ]);
            if (!entitiesRes.ok) throw new Error('Failed to fetch entities');
            const entitiesData = await entitiesRes.json();
            
            setEntities(entitiesData);
            setStats({ entities: entitiesData.length, knowledge: 0 }); // Placeholder for knowledge
            log(`Successfully fetched ${entitiesData.length} entities.`);
        } catch (error) {
            const errorMessage = 'Could not load memory data.';
            setStatus({ error: errorMessage });
            log(errorMessage, { details: (error as Error).message }, 'error');
            console.error(error);
        }
    }, [clearError, setStatus, log]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleSaveEntity = async () => {
        if (!entityForm.name || !entityForm.type || !entityForm.details_json) return;
        clearError();
        const isUpdating = !!entityForm.id;
        const action = isUpdating ? 'Updating' : 'Creating';
        log(`${action} memory entity...`, { entityData: entityForm });

        const url = isUpdating ? `/api/entities/${entityForm.id}` : '/api/entities';
        const method = isUpdating ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entityForm),
            });
            if (!res.ok) throw new Error('Failed to save entity');
            
            const savedEntity = await res.json();
            log(`Entity ${action.toLowerCase()}d successfully.`, { savedEntity });
            await fetchData();
            setEntityForm({});
            setIsEntityFormVisible(false);
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log(`Failed to ${action.toLowerCase()} entity.`, { error: errorMessage }, 'error');
            console.error(error);
        }
    };

    const handleEditEntity = (entity: Entity) => {
        setEntityForm(entity);
        setIsEntityFormVisible(true);
    };
    
    const handleDeleteEntity = async (id: string) => {
        clearError();
        log(`Attempting to delete entity with ID: ${id}`);
        try {
            const res = await fetch(`/api/entities/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete entity');
            log('Entity deleted successfully.', { id });
            await fetchData();
        } catch (error) {
             const errorMessage = (error as Error).message;
             setStatus({ error: errorMessage });
             log('Failed to delete entity.', { id, error: errorMessage }, 'error');
             console.error(error);
        }
    };

    const TabButton: React.FC<{ tabName: Tab; label: string }> = ({ tabName, label }) => (
        <button onClick={() => setActiveTab(tabName)} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === tabName ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
            {label}
        </button>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'structured':
                 return (
                    <>
                        <div className="flex-1 overflow-y-auto pr-2">
                             <div className="mb-4 text-sm text-gray-400">
                                Entities are specific facts the AI knows, like people, places, or concepts. This information is always included in the AI's context.
                            </div>
                            <div className="flex gap-2 mb-4">
                                <button onClick={() => { setIsEntityFormVisible(true); setEntityForm({});}} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm">
                                    <PlusIcon className="w-5 h-5" /> Add Entity
                                </button>
                                <p className="text-sm text-gray-400 self-center">New entities are added automatically by the memory pipeline after chats.</p>
                            </div>
                            {isEntityFormVisible && (
                                <div className="bg-gray-900 p-4 rounded-lg mb-4 space-y-3">
                                    <h3 className="font-semibold">{entityForm.id ? 'Edit Entity' : 'New Entity'}</h3>
                                    <input value={entityForm.name || ''} onChange={e => setEntityForm({...entityForm, name: e.target.value})} placeholder="Name" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                                    <input value={entityForm.type || ''} onChange={e => setEntityForm({...entityForm, type: e.target.value})} placeholder="Type (e.g., Person, Project)" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                                    <textarea value={entityForm.details_json || ''} onChange={e => setEntityForm({...entityForm, details_json: e.target.value})} placeholder="Details" className="w-full p-2 bg-gray-700 rounded-lg text-sm" rows={2}></textarea>
                                    <div className="flex gap-2">
                                        <button onClick={handleSaveEntity} className="flex-1 p-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-500">Save</button>
                                        <button onClick={() => setIsEntityFormVisible(false)} className="flex-1 p-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500">Cancel</button>
                                    </div>
                                </div>
                            )}
                            <table className="w-full text-left text-sm">
                                <thead className="text-xs text-gray-400 uppercase bg-gray-900">
                                    <tr><th className="p-2">Name</th><th className="p-2">Type</th><th className="p-2">Details</th><th className="p-2">Actions</th></tr>
                                </thead>
                                <tbody>
                                    {entities.map(e => (
                                        <tr key={e.id} className="border-b border-gray-700">
                                            <td className="p-2 align-top">{e.name}</td>
                                            <td className="p-2 align-top">{e.type}</td>
                                            <td className="p-2 align-top break-all">{e.details_json}</td>
                                            <td className="p-2 align-top">
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleEditEntity(e)}><EditIcon className="w-4 h-4 hover:text-blue-400"/></button>
                                                    <button onClick={() => handleDeleteEntity(e.id)}><TrashIcon className="w-4 h-4 hover:text-red-500"/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                );
            case 'procedural':
                return (
                     <div className="flex-1 overflow-y-auto pr-2">
                        <div className="mb-4 text-sm text-gray-400">
                           This section will list available tools and integrations (e.g., Google Search, Calendar). Semantic Memory (powered by Pinecone) is now managed automatically by the memory pipeline.
                        </div>
                    </div>
                );
            case 'settings':
                return (
                    <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                        <div>
                             <h3 className="text-lg font-semibold mb-2">Memory Statistics</h3>
                             <div className="grid grid-cols-2 gap-4 text-center">
                                 <div className="bg-gray-900 p-4 rounded-lg"><p className="text-2xl font-bold">{stats.entities}</p><p className="text-sm text-gray-400">Structured Entities</p></div>
                                 <div className="bg-gray-900 p-4 rounded-lg"><p className="text-2xl font-bold">N/A</p><p className="text-sm text-gray-400">Knowledge Vectors</p></div>
                             </div>
                        </div>
                    </div>
                );
        }
    };
    
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col p-6">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold">Memory Center</h2>
                    <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-6 h-6" /></button>
                </div>
                <div className="flex items-center gap-2 mb-4">
                   <TabButton tabName="structured" label="Structured Memory" />
                   <TabButton tabName="procedural" label="Semantic & Procedural" />
                   <TabButton tabName="settings" label="Settings" />
                </div>
                {renderContent()}
            </motion.div>
        </motion.div>
    );
};

export default MemoryCenter;
