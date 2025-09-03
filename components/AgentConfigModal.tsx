"use client";

import React, { useState, useEffect } from 'react';
import { Conversation } from '@/lib/types';
import { XIcon, SparklesIcon, LightbulbIcon, SummarizeIcon, DocumentTextIcon, CodeIcon } from './Icons';
import { useAppContext } from '@/components/providers/AppProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { useLog } from './providers/LogProvider';

interface AgentConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversation: Conversation | null;
}

type Personality = 'Balanced' | 'Creative' | 'Concise' | 'Detailed' | 'Code Focused';

const personalities: Record<Personality, { label: string; prompt: string; icon: React.FC<any> }> = {
    'Balanced': {
        label: 'Balanced',
        prompt: 'You are a helpful AI assistant. Provide clear, balanced, and informative responses.',
        icon: SparklesIcon
    },
    'Creative': {
        label: 'Creative',
        prompt: "You are a highly creative and imaginative AI assistant. Your responses should be inspiring, unconventional, and explore novel ideas. Think outside the box and don't be afraid to be playful.",
        icon: LightbulbIcon
    },
    'Concise': {
        label: 'Concise',
        prompt: "You are a concise and to-the-point AI assistant. Your answers must be short, direct, and contain only the most essential information. Use bullet points or numbered lists whenever possible to improve clarity.",
        icon: SummarizeIcon
    },
    'Detailed': {
        label: 'Detailed',
        prompt: "You are a detailed, thorough, and expert AI assistant. Provide comprehensive, in-depth explanations. Cover all relevant aspects of the topic, provide background context, and use examples where appropriate.",
        icon: DocumentTextIcon
    },
    'Code Focused': {
        label: 'Code Focused',
        prompt: "You are an expert programmer and code assistant. Your primary focus is on providing accurate, efficient, and well-documented code. Prioritize code examples over lengthy explanations. Explain code with comments where necessary.",
        icon: CodeIcon
    }
};


// FIX: Removed React.FC to fix framer-motion type inference issue.
const AgentConfigModal = ({ isOpen, onClose, conversation }: AgentConfigModalProps) => {
    const { updateCurrentConversation, setStatus, clearError } = useAppContext();
    const { log } = useLog();
    const [systemPrompt, setSystemPrompt] = useState('');
    const [agentPersonality, setAgentPersonality] = useState<Personality>('Balanced');
    const [useSemanticMemory, setUseSemanticMemory] = useState(false);
    const [useStructuredMemory, setUseStructuredMemory] = useState(true);
    const [enableMemoryExtraction, setEnableMemoryExtraction] = useState(true);
    const [enableProactiveSuggestions, setEnableProactiveSuggestions] = useState(true);
    const [enableAutoSummarization, setEnableAutoSummarization] = useState(true);

    useEffect(() => {
        if (conversation && isOpen) {
            setSystemPrompt(conversation.systemPrompt || 'You are a helpful AI assistant.');
            setAgentPersonality(conversation.agentPersonality as Personality || 'Balanced');
            setUseSemanticMemory(conversation.useSemanticMemory ?? true);
            setUseStructuredMemory(conversation.useStructuredMemory ?? true);
            setEnableMemoryExtraction(conversation.enableMemoryExtraction ?? true);
            setEnableProactiveSuggestions(conversation.enableProactiveSuggestions ?? true);
            setEnableAutoSummarization(conversation.enableAutoSummarization ?? true);
        }
    }, [conversation, isOpen, log]);

    const handlePersonalityChange = (personality: Personality) => {
        setAgentPersonality(personality);
        setSystemPrompt(personalities[personality].prompt);
    };

    const handleSave = async () => {
        if (!conversation) return;
        clearError();
        
        const updatedConversationData = {
            systemPrompt,
            agentPersonality,
            useSemanticMemory,
            useStructuredMemory,
            enableMemoryExtraction,
            enableProactiveSuggestions,
            enableAutoSummarization,
        };
        
        log('User clicked "Save" in Agent Config Modal', { conversationId: conversation.id, updatedData: updatedConversationData });
        
        // Optimistic UI update
        updateCurrentConversation(updatedConversationData);
        onClose();

        try {
            const res = await fetch(`/api/conversations/${conversation.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedConversationData)
            });

            if (!res.ok) throw new Error('Failed to update agent configuration');

            const finalUpdatedConversation = await res.json();
            
            // Final update with data from server
            updateCurrentConversation(finalUpdatedConversation);
            
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
// FIX: The framer-motion library's type inference for motion components can fail when they are used within components typed with `React.FC`. Removing the explicit `React.FC` type annotation resolves this TypeScript error.
             <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
// FIX: The framer-motion library's type inference for motion components can fail when they are used within components typed with `React.FC`. Removing the explicit `React.FC` type annotation resolves this TypeScript error.
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="bg-gray-800 rounded-lg shadow-xl w-11/12 md:max-w-2xl max-h-[90vh] flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center p-6 border-b border-gray-700 flex-shrink-0">
                        <h2 className="text-xl font-bold">Agent Configuration</h2>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-6 h-6" /></button>
                    </div>
                    <div className="p-6 space-y-6 overflow-y-auto">
                        <div>
                            <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-400 mb-1">System Instructions</label>
                            <p className="text-xs text-gray-500 mb-2">This is the core instruction that guides the AI's behavior. Selecting a personality below will set a default prompt, which you can then customize.</p>
                            <textarea id="systemPrompt" value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={5} className="w-full p-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                        </div>

                        <div>
                            <h3 className="text-lg font-medium text-gray-300 mb-2">Agent Personality</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {Object.keys(personalities).map(key => {
                                    const personality = personalities[key as Personality];
                                    const isSelected = agentPersonality === key;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => handlePersonalityChange(key as Personality)}
                                            className={`p-3 rounded-lg text-left transition-all duration-200 border-2 ${isSelected ? 'bg-indigo-600/30 border-indigo-500' : 'bg-gray-700/50 border-transparent hover:border-indigo-500/50'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <personality.icon className={`w-5 h-5 ${isSelected ? 'text-indigo-400' : 'text-gray-400'}`} />
                                                <span className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-300'}`}>{personality.label}</span>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-300 mb-2">Memory Association</h3>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                                        <input type="checkbox" checked={useSemanticMemory} onChange={e => setUseSemanticMemory(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                                        <span>Semantic Memory (Knowledge)</span>
                                    </label>
                                    <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                                        <input type="checkbox" checked={useStructuredMemory} onChange={e => setUseStructuredMemory(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                                        <span>Structured Memory (Entities)</span>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-300 mb-2">Smart Features</h3>
                                 <div className="space-y-3">
                                    <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                                        <input type="checkbox" checked={enableMemoryExtraction} onChange={e => setEnableMemoryExtraction(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                                        <span>Memory Extraction</span>
                                    </label>
                                    <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                                        <input type="checkbox" checked={enableProactiveSuggestions} onChange={e => setEnableProactiveSuggestions(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                                        <span>Proactive Suggestions</span>
                                    </label>
                                     <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                                        <input type="checkbox" checked={enableAutoSummarization} onChange={e => setEnableAutoSummarization(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                                        <span>Auto-Collapse Summaries</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 p-6 mt-auto border-t border-gray-700 flex-shrink-0">
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