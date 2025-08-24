
"use client";

import React, { useState, useEffect } from 'react';
import type { Knowledge } from '@/lib/types';
import { dbService } from '@/lib/db/db';
import { useGemini } from '@/lib/hooks/useGemini';
import { XIcon, TrashIcon } from './Icons';

interface KnowledgeManagerProps {
    setIsOpen: (isOpen: boolean) => void;
}

const KnowledgeManager: React.FC<KnowledgeManagerProps> = ({ setIsOpen }) => {
    const [knowledgeItems, setKnowledgeItems] = useState<Knowledge[]>([]);
    const [newKnowledge, setNewKnowledge] = useState('');
    const [source, setSource] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { createEmbedding } = useGemini();

    const fetchKnowledge = async () => {
        const items = await dbService.knowledge.getAll();
        setKnowledgeItems(items);
    };

    useEffect(() => {
        fetchKnowledge();
    }, []);

    const handleAddKnowledge = async () => {
        if (!newKnowledge.trim()) return;
        setIsLoading(true);
        
        const embedding = await createEmbedding(newKnowledge);
        if (embedding) {
            const newItem: Knowledge = {
                id: crypto.randomUUID(),
                content: newKnowledge,
                embedding,
                source: source || 'Manual Input'
            };
            await dbService.knowledge.add(newItem);
            setNewKnowledge('');
            setSource('');
            await fetchKnowledge();
        }
        setIsLoading(false);
    };

    const handleDelete = async (id: string) => {
        await dbService.knowledge.delete(id);
        await fetchKnowledge();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl h-full max-h-[80vh] flex flex-col p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Knowledge Base</h2>
                    <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-700">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2">
                    <ul className="space-y-2">
                        {knowledgeItems.map(item => (
                            <li key={item.id} className="bg-gray-700 p-3 rounded-md flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-300">{item.content}</p>
                                    <p className="text-xs text-gray-500 mt-1">Source: {item.source}</p>
                                </div>
                                <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-400 hover:text-red-500">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-700">
                    <h3 className="text-lg font-semibold mb-2">Add New Knowledge</h3>
                    <textarea
                        value={newKnowledge}
                        onChange={(e) => setNewKnowledge(e.target.value)}
                        placeholder="Paste or type knowledge here..."
                        className="w-full p-2 bg-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-2"
                        rows={4}
                    />
                    <input
                        type="text"
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        placeholder="Source (optional, e.g., URL, book title)"
                        className="w-full p-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-4"
                    />
                    <button
                        onClick={handleAddKnowledge}
                        disabled={true}
                        className="w-full p-2 bg-indigo-600 rounded-lg text-white disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        Add to Memory (Disabled)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KnowledgeManager;
