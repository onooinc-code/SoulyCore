"use client";

import React, { useState, useEffect, useCallback, ChangeEvent, useRef } from 'react';
import type { Knowledge, Entity, Tool } from '../lib/types';
import { useAppContext } from './providers/AppProvider';
import { XIcon, TrashIcon, PlusIcon, EditIcon, UploadIcon, UrlIcon } from './Icons';
import { motion } from 'framer-motion';

type Tab = 'semantic' | 'structured' | 'settings';

interface MemoryCenterProps {
    setIsOpen: (isOpen: boolean) => void;
}

const MemoryCenter: React.FC<MemoryCenterProps> = ({ setIsOpen }) => {
    const { currentConversation } = useAppContext();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [activeTab, setActiveTab] = useState<Tab>('structured');
    
    const [entities, setEntities] = useState<Entity[]>([]);
    
    const [isEntityLoading, setIsEntityLoading] = useState(false);
    
    const [entityForm, setEntityForm] = useState<{ id: string | null; name: string; type: string; details_json: string; }>({ id: null, name: '', type: '', details_json: '' });
    const [isEntityFormVisible, setIsEntityFormVisible] = useState(false);

    const fetchData = useCallback(async () => {
        setIsEntityLoading(true);
        const res = await fetch('/api/entities');
        if (res.ok) {
            const data = await res.json();
            setEntities(data);
        }
        setIsEntityLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveEntity = async () => {
        // Placeholder for API call
        console.log("Saving entity:", entityForm);
        setIsEntityFormVisible(false);
        setEntityForm({ id: null, name: '', type: '', details_json: '' });
        await fetchData();
    };

    const handleEditEntity = (entity: Entity) => {
        setEntityForm(entity);
        setIsEntityFormVisible(true);
    };
    
    const handleDeleteEntity = async (id: string) => {
        // Placeholder for API call
        console.log("Deleting entity:", id);
        await fetchData();
    };

    const TabButton: React.FC<{ tabName: Tab; label: string }> = ({ tabName, label }) => (
        <button onClick={() => setActiveTab(tabName)} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === tabName ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
            {label}
        </button>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'semantic':
                return (
                    <div className="text-center p-8 text-gray-400">
                        <h3 className="text-lg font-semibold mb-2">Semantic Memory Management</h3>
                        <p>The Autonomous Memory Pipeline now handles semantic knowledge automatically.</p>
                        <p>Information is extracted from your conversations and stored in a vector database for intelligent retrieval.</p>
                    </div>
                );
            case 'structured':
                 return (
                    <>
                        <div className="flex-1 overflow-y-auto pr-2">
                             <div className="mb-4 text-sm text-gray-400">
                                Entities are specific facts the AI knows, like people, places, or concepts. They are automatically extracted, but can also be managed manually.
                            </div>
                            <div className="flex gap-2 mb-4">
                                <button onClick={() => { setIsEntityFormVisible(true); setEntityForm({ id: null, name: '', type: '', details_json: '' });}} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm">
                                    <PlusIcon className="w-5 h-5" /> Add Entity
                                </button>
                            </div>
                            {isEntityFormVisible && (
                                <div className="bg-gray-900 p-4 rounded-lg mb-4 space-y-3">
                                    <h3 className="font-semibold">{entityForm.id ? 'Edit Entity' : 'New Entity'}</h3>
                                    <input value={entityForm.name} onChange={e => setEntityForm({...entityForm, name: e.target.value})} placeholder="Name" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                                    <input value={entityForm.type} onChange={e => setEntityForm({...entityForm, type: e.target.value})} placeholder="Type (e.g., Person)" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                                    <textarea value={entityForm.details_json} onChange={e => setEntityForm({...entityForm, details_json: e.target.value})} placeholder="Details (JSON or text)" className="w-full p-2 bg-gray-700 rounded-lg text-sm" rows={2}></textarea>
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
            case 'settings':
                return (
                    <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                         <div className="text-center p-8 text-gray-400">
                            <h3 className="text-lg font-semibold mb-2">Memory Settings</h3>
                            <p>Configuration for memory systems is now managed per-conversation in the Agent Configuration modal.</p>
                        </div>
                    </div>
                );
        }
    };
    
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
        >
            <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col p-6"
            >
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold">Memory Center</h2>
                    <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-700">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex items-center gap-2 mb-4">
                   <TabButton tabName="structured" label="Structured" />
                   <TabButton tabName="semantic" label="Semantic" />
                   <TabButton tabName="settings" label="Settings" />
                </div>
                {renderContent()}
            </motion.div>
        </motion.div>
    );
};

export default MemoryCenter;
