
"use client";

import React, { useState, useEffect } from 'react';
import { Conversation } from '@/lib/types';
import { XIcon } from './Icons';
import { useAppContext } from '@/components/providers/AppProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { useLog } from './providers/LogProvider';

interface AgentConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversation: Conversation | null;
}

// FIX: Removed React.FC to fix framer-motion type inference issue.
const AgentConfigModal = ({ isOpen, onClose, conversation }: AgentConfigModalProps) => {
    const { loadConversations, setCurrentConversation: setContextConversation, setStatus, clearError } = useAppContext();
    const { log } = useLog();
    const [systemPrompt, setSystemPrompt] = useState('');
    const [useSemanticMemory, setUseSemanticMemory] = useState(false);
    const [useStructuredMemory, setUseStructuredMemory] = useState(true);

    useEffect(() => {
        if (conversation && isOpen) {
            setSystemPrompt(conversation.systemPrompt || 'You are a helpful AI assistant.');
            setUseSemanticMemory(conversation.useSemanticMemory ?? true);
            setUseStructuredMemory(conversation.useStructuredMemory ?? true);
        }
    }, [conversation, isOpen, log]);

    const handleSave = async () => {
        if (!conversation) return;
        clearError();
        
        const updatedConversationData = {
            systemPrompt,
            useSemanticMemory,
            useStructuredMemory,
        };
        
        log('User clicked "Save" in Agent Config Modal', { conversationId: conversation.id, updatedData: updatedConversationData });

        try {
            const res = await fetch(`/api/conversations/${conversation.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedConversationData)
            });

            if (!res.ok) throw new Error('Failed to update agent configuration');

            const updatedConversation = await res.json();
            
            await loadConversations();
            // After loading, find the conversation in the new list and set it
            setContextConversation(updatedConversation.id);
            onClose();
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log('Failed to save agent configuration', { error: { message: errorMessage, stack: (error as Error).stack } }, 'error');
            console.error(error);
        }
    };

    return (
        <AnimatePresence>
        {isOpen && conversation && (
             <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Agent Configuration</h2>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-6 h-6" /></button>
                    </div>
                    <div>
                        <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-400 mb-1">System Instructions</label>
                        <textarea id="systemPrompt" value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={5} className="w-full p-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-gray-300 mb-2">Memory Association</h3>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm text-gray-300">
                                <input type="checkbox" checked={useSemanticMemory} onChange={e => setUseSemanticMemory(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                                <span>Use Semantic Memory (Knowledge Base)</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-300">
                                <input type="checkbox" checked={useStructuredMemory} onChange={e => setUseStructuredMemory(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                                <span>Use Structured Memory (Entities)</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500">Save</button>
                    </div>
                </motion.div>
            </motion.div>
        )}
        </AnimatePresence>
    );
};

export default AgentConfigModal;
