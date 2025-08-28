"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Prompt } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, PlusIcon, TrashIcon, EditIcon } from './Icons';
import { useAppContext } from '@/components/providers/AppProvider';
import { useLog } from './providers/LogProvider';

interface PromptsHubProps {
    setIsOpen: (isOpen: boolean) => void;
}

const PromptsHub = ({ setIsOpen }: PromptsHubProps) => {
    const { setStatus, clearError } = useAppContext();
    const { log } = useLog();
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentPrompt, setCurrentPrompt] = useState<Partial<Prompt> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<{ type: 'all' | 'folder' | 'tag'; value: string | null }>({ type: 'all', value: null });

    const fetchPrompts = useCallback(async () => {
        clearError();
        log('Fetching all prompts...');
        setIsLoading(true);
        try {
            const res = await fetch('/api/prompts');
            if (!res.ok) throw new Error('Failed to fetch prompts');
            const data = await res.json();
            setPrompts(data);
            log(`Successfully fetched ${data.length} prompts.`);
        } catch (error) {
            const errorMessage = 'Could not load prompts.';
            setStatus({ error: errorMessage });
            log(errorMessage, { error: { message: (error as Error).message } }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [setStatus, clearError, log]);

    useEffect(() => {
        fetchPrompts();
    }, [fetchPrompts]);

    const handleOpenForm = (prompt: Partial<Prompt> | null = null) => {
        const action = prompt ? 'edit' : 'new';
        log(`User opened prompt form for ${action} prompt.`, { promptId: prompt?.id });
        setCurrentPrompt(prompt || {});
        setIsFormOpen(true);
    };

    const handleSavePrompt = async () => {
        if (!currentPrompt || !currentPrompt.name || !currentPrompt.content) return;
        clearError();
        const isUpdating = !!currentPrompt.id;
        const action = isUpdating ? 'Updating' : 'Creating';
        log(`${action} prompt...`, { promptData: currentPrompt });

        const url = isUpdating ? `/api/prompts/${currentPrompt.id}` : '/api/prompts';
        const method = isUpdating ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentPrompt),
            });
            if (!res.ok) throw new Error(`Failed to ${isUpdating ? 'update' : 'create'} prompt`);
            
            await fetchPrompts();
            setIsFormOpen(false);
            setCurrentPrompt(null);
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log(`Failed to ${action.toLowerCase()} prompt.`, { error: { message: errorMessage } }, 'error');
        }
    };

    const handleDeletePrompt = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this prompt?')) {
            clearError();
            log(`Attempting to delete prompt with ID: ${id}`);
            try {
                const res = await fetch(`/api/prompts/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to delete prompt');
                log('Prompt deleted successfully.', { id });
                await fetchPrompts();
            } catch (error) {
                const errorMessage = (error as Error).message;
                setStatus({ error: errorMessage });
                log('Failed to delete prompt.', { id, error: { message: errorMessage } }, 'error');
            }
        } else {
            log('User cancelled prompt deletion.', { id });
        }
    };
    
    const folders = useMemo(() => {
        // FIX: Replaced `map` and `filter` with `flatMap` for a more robust and type-safe way to get a unique list of folder strings.
        const folderSet = new Set(prompts.flatMap(p => p.folder ? [p.folder] : []));
        return Array.from(folderSet).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    }, [prompts]);

    const tags = useMemo(() => {
        const tagSet = new Set(prompts.flatMap(p => p.tags || []));
        return Array.from(tagSet).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    }, [prompts]);
    
    const filteredPrompts = useMemo(() => {
        let filtered = prompts;

        if (activeFilter.type === 'folder') {
            filtered = filtered.filter(p => p.folder === activeFilter.value);
        } else if (activeFilter.type === 'tag') {
            filtered = filtered.filter(p => p.tags?.includes(activeFilter.value!));
        }
        
        if (searchTerm) {
            const lowercasedSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(prompt => 
                prompt.name.toLowerCase().includes(lowercasedSearch) ||
                prompt.content.toLowerCase().includes(lowercasedSearch)
            );
        }

        return filtered;
    }, [prompts, searchTerm, activeFilter]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col p-6">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold">Prompts Hub</h2>
                    <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-6 h-6" /></button>
                </div>

                <div className="flex-1 flex gap-6 overflow-hidden">
                    {/* Left Panel: Filters */}
                    <div className="w-1/4 bg-gray-900/50 rounded-lg p-3 flex-shrink-0 flex flex-col overflow-y-auto">
                        <button
                            onClick={() => setActiveFilter({ type: 'all', value: null })}
                            className={`w-full text-left px-3 py-2 text-sm rounded-md mb-4 ${activeFilter.type === 'all' ? 'bg-indigo-600 font-semibold' : 'hover:bg-gray-700'}`}
                        >
                            All Prompts
                        </button>

                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">Folders</h3>
                            <ul className="space-y-1">
                                {folders.map(folder => (
                                    <li key={folder}>
                                        <button
                                            onClick={() => setActiveFilter({ type: 'folder', value: folder })}
                                            className={`w-full text-left px-3 py-1.5 text-sm rounded-md truncate ${activeFilter.type === 'folder' && activeFilter.value === folder ? 'bg-indigo-600 font-semibold' : 'hover:bg-gray-700'}`}
                                        >
                                            {folder}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">Tags</h3>
                            <div className="flex flex-wrap gap-2 px-3">
                                {tags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setActiveFilter({ type: 'tag', value: tag })}
                                        className={`px-2 py-0.5 text-xs rounded-full ${activeFilter.type === 'tag' && activeFilter.value === tag ? 'bg-indigo-600 text-white font-semibold' : 'bg-gray-600 hover:bg-gray-500'}`}
                                    >
                                        #{tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Prompts List & Form */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between mb-4 flex-shrink-0">
                            <button onClick={() => handleOpenForm()} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm" title="Add a new reusable prompt.">
                                <PlusIcon className="w-5 h-5" /> Add Prompt
                            </button>
                            <input type="text" placeholder="Search current view..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="px-3 py-2 bg-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        
                        <AnimatePresence>
                            {isFormOpen && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden flex-shrink-0">
                                    <div className="bg-gray-900 p-4 rounded-lg mb-4 space-y-3">
                                        <h3 className="font-semibold text-lg">{currentPrompt?.id ? 'Edit Prompt' : 'New Prompt'}</h3>
                                        <input value={currentPrompt?.name || ''} onChange={e => setCurrentPrompt({...currentPrompt, name: e.target.value})} placeholder="Prompt Name (e.g., 'Meeting Summarizer')" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                                        <textarea value={currentPrompt?.content || ''} onChange={e => setCurrentPrompt({...currentPrompt, content: e.target.value})} placeholder="Prompt Content..." className="w-full p-2 bg-gray-700 rounded-lg text-sm font-mono" rows={5}></textarea>
                                        <div className="flex gap-4">
                                            <input value={currentPrompt?.folder || ''} onChange={e => setCurrentPrompt({...currentPrompt, folder: e.target.value})} placeholder="Folder (Optional)" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                                            <input value={currentPrompt?.tags?.join(', ') || ''} onChange={e => setCurrentPrompt({...currentPrompt, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})} placeholder="Tags, comma-separated" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={handleSavePrompt} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-500">Save Prompt</button>
                                            <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500">Cancel</button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                            {isLoading ? (
                                <p className="text-center text-gray-400 py-8">Loading prompts...</p>
                            ) : filteredPrompts.length > 0 ? (
                                filteredPrompts.map(prompt => (
                                    <div key={prompt.id} className="bg-gray-900/50 p-4 rounded-lg">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-gray-200 flex-1 min-w-0 break-words">{prompt.name}</h4>
                                            <div className="flex gap-2 flex-shrink-0 ml-4">
                                                <button onClick={() => handleOpenForm(prompt)} title="Edit this prompt"><EditIcon className="w-5 h-5 text-gray-400 hover:text-blue-400"/></button>
                                                <button onClick={() => handleDeletePrompt(prompt.id)} title="Delete this prompt"><TrashIcon className="w-5 h-5 text-gray-400 hover:text-red-500"/></button>
                                            </div>
                                        </div>
                                        <p className="mt-3 text-sm text-gray-400 font-mono bg-gray-800 p-2 rounded-md whitespace-pre-wrap max-h-24 overflow-y-auto">{prompt.content}</p>
                                        {(prompt.tags?.length || prompt.folder) && (
                                            <div className="mt-3 flex flex-wrap gap-2 items-center border-t border-gray-700/50 pt-3">
                                                {prompt.folder && (
                                                     <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                                                        Folder: {prompt.folder}
                                                    </span>
                                                )}
                                                {prompt.tags?.map(tag => (
                                                    <span key={tag} className="text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded-full">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-400 py-8">No prompts found for this filter.</p>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default PromptsHub;