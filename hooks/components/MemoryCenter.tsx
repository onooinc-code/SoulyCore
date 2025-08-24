import React, { useState, useEffect, useCallback, ChangeEvent, useRef } from 'react';
import type { Knowledge, Entity, Tool, Cache } from '../../types';
import { dbService } from '../context/db/db';
import { useGemini } from '../useGemini';
import { useAppContext } from '../context/AppContext';
import { XIcon, TrashIcon, PlusIcon, EditIcon, UploadIcon, UrlIcon } from './Icons';
import { motion } from 'framer-motion';

type Tab = 'semantic' | 'structured' | 'procedural' | 'settings';

interface MemoryCenterProps {
    setIsOpen: (isOpen: boolean) => void;
}

const MemoryCenter: React.FC<MemoryCenterProps> = ({ setIsOpen }) => {
    const { messages, currentConversation } = useAppContext();
    const { createEmbedding, extractEntitiesFromText } = useGemini();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [activeTab, setActiveTab] = useState<Tab>('semantic');
    
    // State for all tabs
    const [knowledgeItems, setKnowledgeItems] = useState<Knowledge[]>([]);
    const [entities, setEntities] = useState<Entity[]>([]);
    const [tools, setTools] = useState<Tool[]>([]);
    const [stats, setStats] = useState({ knowledge: 0, entities: 0, cache: 0 });

    // Loading states
    const [isKnowledgeLoading, setIsKnowledgeLoading] = useState(false);
    const [isEntityLoading, setIsEntityLoading] = useState(false);
    const [isSettingsLoading, setIsSettingsLoading] = useState(false);
    
    // Input states
    const [newKnowledge, setNewKnowledge] = useState('');
    const [knowledgeSource, setKnowledgeSource] = useState('');
    const [entityForm, setEntityForm] = useState<{ id: string | null; name: string; type: string; details_json: string; }>({ id: null, name: '', type: '', details_json: '' });
    const [isEntityFormVisible, setIsEntityFormVisible] = useState(false);

    const fetchData = useCallback(async () => {
        const [k, e, t, cacheCount] = await Promise.all([
            dbService.knowledge.getAll(),
            dbService.entities.getAll(),
            dbService.tools.getAll(),
            dbService.cache.count(),
        ]);

        setKnowledgeItems(k);
        setEntities(e);
        setTools(t);
        setStats({ knowledge: k.length, entities: e.length, cache: cacheCount });
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddKnowledge = async () => {
        if (!newKnowledge.trim()) return;
        setIsKnowledgeLoading(true);
        const embedding = await createEmbedding(newKnowledge);
        if (embedding) {
            const newItem: Knowledge = {
                id: crypto.randomUUID(),
                content: newKnowledge,
                embedding,
                source: knowledgeSource || 'Manual Input'
            };
            await dbService.knowledge.add(newItem);
            setNewKnowledge('');
            setKnowledgeSource('');
            await fetchData();
        }
        setIsKnowledgeLoading(false);
    };

    const handleDeleteKnowledge = async (id: string) => {
        await dbService.knowledge.delete(id);
        await fetchData();
    };

    const handleFileImport = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setNewKnowledge(text);
                setKnowledgeSource(file.name);
            };
            reader.readAsText(file);
        }
    };
    
    const handleSaveEntity = async () => {
        if (!entityForm.name || !entityForm.type || !entityForm.details_json) return;
        const entityData: Entity = {
            id: entityForm.id || crypto.randomUUID(),
            name: entityForm.name,
            type: entityForm.type,
            details_json: entityForm.details_json,
        };
        if(entityForm.id) {
            await dbService.entities.update(entityData);
        } else {
            await dbService.entities.add(entityData);
        }
        setEntityForm({ id: null, name: '', type: '', details_json: '' });
        setIsEntityFormVisible(false);
        await fetchData();
    };

    const handleEditEntity = (entity: Entity) => {
        setEntityForm(entity);
        setIsEntityFormVisible(true);
    };
    
    const handleDeleteEntity = async (id: string) => {
        await dbService.entities.delete(id);
        await fetchData();
    };

    const handleExtractEntities = async () => {
        if (!currentConversation) return;
        setIsEntityLoading(true);
        const recentMessages = (await dbService.messages.getByConversation(currentConversation.id)).slice(-20);
        const text = recentMessages.map(m => `${m.role}: ${m.content}`).join('\n');
        const extracted = await extractEntitiesFromText(text);
        if (extracted) {
           for (const item of extracted) {
                // Check for duplicates before adding
               const existingEntity = entities.find(e => e.name.toLowerCase() === item.name.toLowerCase() && e.type.toLowerCase() === item.type.toLowerCase());
               if (!existingEntity) {
                   const newEntity: Entity = {
                       id: crypto.randomUUID(),
                       name: item.name,
                       type: item.type,
                       details_json: item.details,
                   };
                   await dbService.entities.add(newEntity);
               }
           }
           await fetchData();
        }
        setIsEntityLoading(false);
    };

    const handleClearCache = async () => {
        setIsSettingsLoading(true);
        await dbService.cache.clear();
        await fetchData();
        setIsSettingsLoading(false);
    };
    
    const handleReindex = async () => {
        setIsSettingsLoading(true);
        const allKnowledge = await dbService.knowledge.getAll();
        for (const item of allKnowledge) {
            const newEmbedding = await createEmbedding(item.content);
            if (newEmbedding) {
                item.embedding = newEmbedding;
                await dbService.knowledge.update(item);
            }
        }
        await fetchData();
        setIsSettingsLoading(false);
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
                    <>
                        <div className="flex-1 overflow-y-auto pr-2">
                             <div className="mb-4 text-sm text-gray-400">
                                This is the AI's long-term memory. It uses this information to provide more relevant and contextual answers.
                                <p className="mt-2 font-semibold">Indexing Status: Indexed {stats.knowledge} / {stats.knowledge} items</p>
                            </div>
                            <ul className="space-y-2">
                                {knowledgeItems.map(item => (
                                    <li key={item.id} className="bg-gray-900 p-3 rounded-md flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-gray-300">{item.content}</p>
                                            <p className="text-xs text-gray-500 mt-1">Source: {item.source}</p>
                                        </div>
                                        <button onClick={() => handleDeleteKnowledge(item.id)} className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0 ml-4">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <h3 className="text-lg font-semibold mb-2">Add New Knowledge</h3>
                            <textarea value={newKnowledge} onChange={(e) => setNewKnowledge(e.target.value)} placeholder="Paste or type knowledge here..."
                                className="w-full p-2 bg-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-2" rows={3}/>
                            <input type="text" value={knowledgeSource} onChange={(e) => setKnowledgeSource(e.target.value)} placeholder="Source (optional, e.g., URL, book title)"
                                className="w-full p-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-4"/>
                            <div className="flex gap-2">
                                <button onClick={() => {}} className="flex-1 p-2 bg-gray-600 rounded-lg text-white hover:bg-gray-500 disabled:opacity-50 flex items-center justify-center gap-2" disabled>
                                    <UrlIcon className="w-5 h-5"/> Import from URL
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".txt" className="hidden"/>
                                <button onClick={() => fileInputRef.current?.click()} className="flex-1 p-2 bg-gray-600 rounded-lg text-white hover:bg-gray-500 flex items-center justify-center gap-2">
                                    <UploadIcon className="w-5 h-5"/> Import from .txt
                                </button>
                            </div>
                            <button onClick={handleAddKnowledge} disabled={true}
                                className="w-full p-2 mt-2 bg-indigo-600 rounded-lg text-white disabled:bg-gray-500 disabled:cursor-not-allowed">
                                Add to Memory (Disabled)
                            </button>
                        </div>
                    </>
                );
            case 'structured':
                 return (
                    <>
                        <div className="flex-1 overflow-y-auto pr-2">
                             <div className="mb-4 text-sm text-gray-400">
                                Entities are specific facts the AI knows, like people, places, or concepts. You can add them manually or extract them from conversations.
                            </div>
                            <div className="flex gap-2 mb-4">
                                <button onClick={() => { setIsEntityFormVisible(true); setEntityForm({ id: null, name: '', type: '', details_json: '' });}} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm">
                                    <PlusIcon className="w-5 h-5" /> Add Entity
                                </button>
                                <button onClick={handleExtractEntities} disabled={isEntityLoading || !currentConversation} className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isEntityLoading ? "Extracting..." : "Extract from Last Conversation"}
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
            case 'procedural':
                return (
                     <div className="flex-1 overflow-y-auto pr-2">
                        <div className="mb-4 text-sm text-gray-400">
                            Tools are special capabilities the AI can use to perform actions, like searching the web. This is a read-only list of available tools.
                        </div>
                        <ul className="space-y-2">
                            {tools.map(tool => (
                                <li key={tool.id} className="bg-gray-900 p-3 rounded-md">
                                    <p className="font-semibold text-gray-200">{tool.name}</p>
                                    <p className="text-sm text-gray-400">{tool.description}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            case 'settings':
                return (
                    <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                        <div>
                             <h3 className="text-lg font-semibold mb-2">Memory Statistics</h3>
                             <div className="grid grid-cols-3 gap-4 text-center">
                                 <div className="bg-gray-900 p-4 rounded-lg"><p className="text-2xl font-bold">{stats.knowledge}</p><p className="text-sm text-gray-400">Knowledge Items</p></div>
                                 <div className="bg-gray-900 p-4 rounded-lg"><p className="text-2xl font-bold">{stats.entities}</p><p className="text-sm text-gray-400">Entities</p></div>
                                 <div className="bg-gray-900 p-4 rounded-lg"><p className="text-2xl font-bold">{stats.cache}</p><p className="text-sm text-gray-400">Cached Items</p></div>
                             </div>
                        </div>
                         <div>
                             <h3 className="text-lg font-semibold mb-2">Optimization</h3>
                             <div className="space-y-3">
                                 <button onClick={handleClearCache} disabled={isSettingsLoading} className="w-full p-2 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 text-sm">
                                    {isSettingsLoading ? 'Processing...' : 'Clear Embedding Cache'}
                                 </button>
                                 <button onClick={handleReindex} disabled={true} className="w-full p-2 bg-yellow-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                                    Re-index Knowledge Base (Disabled)
                                 </button>
                             </div>
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
                   <TabButton tabName="semantic" label="Semantic" />
                   <TabButton tabName="structured" label="Structured" />
                   <TabButton tabName="procedural" label="Procedural" />
                   <TabButton tabName="settings" label="Settings" />
                </div>
                {renderContent()}
            </motion.div>
        </motion.div>
    );
};

export default MemoryCenter;