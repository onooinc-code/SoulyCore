

"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Entity, Tool } from '@/lib/types';
import { useAppContext } from '@/components/providers/AppProvider';
import { XIcon, TrashIcon, PlusIcon, EditIcon, SearchIcon } from './Icons';
import { motion } from 'framer-motion';
import { useLog } from './providers/LogProvider';

type Tab = 'structured' | 'procedural' | 'settings';

interface MemoryCenterProps {
    setIsOpen: (isOpen: boolean) => void;
}

// FIX: Removed React.FC to fix framer-motion type inference issue.
const MemoryCenter = ({ setIsOpen }: MemoryCenterProps) => {
    const { setStatus, clearError } = useAppContext();
    const { log } = useLog();
    
    const [activeTab, setActiveTab] = useState<Tab>('structured');
    const [entities, setEntities] = useState<Entity[]>([]);
    const [tools, setTools] = useState<Tool[]>([]); // Placeholder
    const [stats, setStats] = useState({ entities: 0, knowledge: 0 });
    
    const [entityForm, setEntityForm] = useState<Partial<Entity>>({});
    const [isEntityFormVisible, setIsEntityFormVisible] = useState(false);
    const [formErrors, setFormErrors] = useState<{ name?: string; type?: string; details_json?: string }>({});

    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    const fetchData = useCallback(async () => {
        clearError();
        log('Fetching memory center data (entities)...');
        try {
            const entitiesRes = await fetch('/api/entities');
            if (!entitiesRes.ok) throw new Error('Failed to fetch entities');
            const { entities: entitiesData } = await entitiesRes.json();
            
            setEntities(entitiesData);
            setStats({ entities: entitiesData.length, knowledge: 0 }); // Placeholder for knowledge
            log(`Successfully fetched ${entitiesData.length} entities.`);
        } catch (error) {
            const errorMessage = 'Could not load memory data.';
            setStatus({ error: errorMessage });
            log(errorMessage, { error: { message: (error as Error).message, stack: (error as Error).stack } }, 'error');
            console.error(error);
        }
    }, [clearError, setStatus, log]);

    useEffect(() => {
        log('Memory Center opened.');
        fetchData();
    }, [fetchData, log]);
    
    const validateForm = (): boolean => {
        const errors: { name?: string; type?: string; details_json?: string } = {};
        if (!entityForm.name?.trim()) errors.name = "Name is required.";
        if (!entityForm.type?.trim()) errors.type = "Type is required.";
        if (!entityForm.details_json?.trim()) {
            errors.details_json = "Details (in JSON format) are required.";
        } else {
            try {
                JSON.parse(entityForm.details_json);
            } catch (e) {
                errors.details_json = "Details must be valid JSON. Example: {\"info\": \"value\"}";
            }
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSaveEntity = async () => {
        if (!validateForm()) {
            log('Entity form validation failed.', { errors: formErrors });
            return;
        }
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
            log(`Failed to ${action.toLowerCase()} entity.`, { error: { message: errorMessage, stack: (error as Error).stack } }, 'error');
            console.error(error);
        }
    };

    const handleEditEntity = (entity: Entity) => {
        log('User started editing an entity.', { entityId: entity.id });
        setFormErrors({});
        setEntityForm(entity);
        setIsEntityFormVisible(true);
    };
    
    const handleDeleteEntity = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this entity?')) {
            log('User cancelled entity deletion.', { entityId: id });
            return;
        }
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
             log('Failed to delete entity.', { id, error: { message: errorMessage, stack: (error as Error).stack } }, 'error');
             console.error(error);
        }
    };

    const uniqueEntityTypes = useMemo(() => {
        const types = new Set(entities.map(e => e.type));
        return ['all', ...Array.from(types).sort()];
    }, [entities]);

    const filteredEntities = useMemo(() => {
        return entities.filter(entity => {
            const filterMatch = typeFilter === 'all' || entity.type === typeFilter;
            const searchMatch = searchTerm.trim() === '' ||
                entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entity.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entity.details_json.toLowerCase().includes(searchTerm.toLowerCase());
            return filterMatch && searchMatch;
        });
    }, [entities, typeFilter, searchTerm]);

    // FIX: Removed React.FC to fix framer-motion type inference issue.
    const TabButton = ({ tabName, label }: { tabName: Tab; label: string }) => (
        <button onClick={() => {
            log('User switched Memory Center tab', { tab: tabName });
            setActiveTab(tabName);
        }} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === tabName ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
            {label}
        </button>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'structured':
                 return (
                    <>
                        <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
                            <button onClick={() => { 
                                log('User clicked "Add Entity" button.');
                                setFormErrors({});
                                setIsEntityFormVisible(true); 
                                setEntityForm({});
                            }} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm w-full md:w-auto">
                                <PlusIcon className="w-5 h-5" /> Add Entity
                            </button>
                             <div className="flex items-center gap-2 w-full md:w-auto">
                                <div className="relative flex-grow">
                                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input 
                                        type="text"
                                        placeholder="Search entities..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full bg-gray-700 rounded-md pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                                <select 
                                    value={typeFilter}
                                    onChange={e => setTypeFilter(e.target.value)}
                                    className="bg-gray-700 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    {uniqueEntityTypes.map(type => (
                                        <option key={type} value={type}>{type === 'all' ? 'All Types' : type}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {isEntityFormVisible && (
                            <div className="bg-gray-900/70 p-4 rounded-lg mb-4 space-y-4">
                                <h3 className="font-semibold text-lg">{entityForm.id ? 'Edit Entity' : 'New Entity'}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="entityName" className="text-xs text-gray-400">Name</label>
                                        <input id="entityName" value={entityForm.name || ''} onChange={e => setEntityForm({...entityForm, name: e.target.value})} placeholder="Project X" className="w-full mt-1 p-2 bg-gray-700 rounded-lg text-sm" aria-invalid={!!formErrors.name} aria-describedby="name-error" />
                                        {formErrors.name && <p id="name-error" className="text-red-400 text-xs mt-1">{formErrors.name}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="entityType" className="text-xs text-gray-400">Type</label>
                                        <input id="entityType" value={entityForm.type || ''} onChange={e => setEntityForm({...entityForm, type: e.target.value})} placeholder="Project" className="w-full mt-1 p-2 bg-gray-700 rounded-lg text-sm" aria-invalid={!!formErrors.type} aria-describedby="type-error"/>
                                        {formErrors.type && <p id="type-error" className="text-red-400 text-xs mt-1">{formErrors.type}</p>}
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="entityDetails" className="text-xs text-gray-400">Details (JSON Format)</label>
                                    <textarea id="entityDetails" value={entityForm.details_json || ''} onChange={e => setEntityForm({...entityForm, details_json: e.target.value})} placeholder='{ "status": "in-progress", "lead": "Jane Doe" }' className="w-full mt-1 p-2 bg-gray-700 rounded-lg text-sm font-mono" rows={3} aria-invalid={!!formErrors.details_json} aria-describedby="details-error"></textarea>
                                    {formErrors.details_json && <p id="details-error" className="text-red-400 text-xs mt-1">{formErrors.details_json}</p>}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleSaveEntity} className="flex-1 p-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-500">Save</button>
                                    <button onClick={() => {
                                        log('User cancelled entity form.');
                                        setIsEntityFormVisible(false)
                                    }} className="flex-1 p-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500">Cancel</button>
                                </div>
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto pr-2">
                            <table className="w-full text-left text-sm table-fixed">
                                <thead className="text-xs text-gray-400 uppercase bg-gray-900/70 sticky top-0">
                                    <tr><th className="p-2 w-[25%]">Name</th><th className="p-2 w-[15%]">Type</th><th className="p-2 w-[45%]">Details</th><th className="p-2 w-[15%]">Actions</th></tr>
                                </thead>
                                <tbody>
                                    {filteredEntities.map(e => (
                                        <tr key={e.id} className="border-b border-gray-700/50">
                                            <td className="p-2 align-top break-words font-medium">{e.name}</td>
                                            <td className="p-2 align-top break-words">
                                                 <span className="text-xs bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded-full">
                                                    {e.type}
                                                </span>
                                            </td>
                                            <td className="p-2 align-top break-all font-mono text-xs text-gray-400">{e.details_json}</td>
                                            <td className="p-2 align-top">
                                                <div className="flex gap-2 items-center">
                                                    <button onClick={() => handleEditEntity(e)} title="Edit"><EditIcon className="w-4 h-4 hover:text-blue-400"/></button>
                                                    <button onClick={() => handleDeleteEntity(e.id)} title="Delete"><TrashIcon className="w-4 h-4 hover:text-red-500"/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredEntities.length === 0 && (
                                <p className="text-center text-gray-500 py-8">No entities match your criteria.</p>
                            )}
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
                                 <div className="bg-gray-800 p-4 rounded-lg">
                                     <p className="text-2xl font-bold">{stats.entities}</p>
                                     <p className="text-xs text-gray-400">Structured Entities</p>
                                 </div>
                                 <div className="bg-gray-800 p-4 rounded-lg">
                                     <p className="text-2xl font-bold">{stats.knowledge}</p>
                                     <p className="text-xs text-gray-400">Semantic Knowledge Chunks</p>
                                 </div>
                             </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Memory Pipeline</h3>
                            <div className="text-sm text-gray-400">
                                The pipeline automatically runs after each conversation.
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col p-6">
                 <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold">Memory Center</h2>
                    <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-6 h-6" /></button>
                </div>
                
                <div className="flex gap-2 mb-4">
                    <TabButton tabName="structured" label="Structured Memory (Entities)" />
                    <TabButton tabName="procedural" label="Semantic & Procedural" />
                    <TabButton tabName="settings" label="Stats & Settings" />
                </div>

                <div className="flex-1 bg-gray-900 rounded-lg p-4 overflow-y-auto flex flex-col">
                    {renderContent()}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default MemoryCenter;
