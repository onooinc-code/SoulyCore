"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { HedraGoal } from '@/lib/types';
import { useLog } from '../providers/LogProvider';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { DotsHorizontalIcon, PlusIcon, XIcon, BrainIcon, UsersIcon, HeartIcon, CpuChipIcon, ServerIcon } from '../Icons';

const AccordionItem = ({ title, content, isEditing, onContentChange }: {
    title: string;
    content: string;
    isEditing: boolean;
    onContentChange: (newContent: string) => void;
}) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="bg-gray-900/50 rounded-lg border border-gray-700/50 overflow-hidden">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full flex justify-between items-center p-4 text-right hover:bg-indigo-900/20"
            >
                <span className="font-bold text-lg text-white">{title}</span>
                <motion.div animate={{ rotate: isOpen ? 0 : -180 }} transition={{ duration: 0.3 }}>
                    <svg className="w-6 h-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </motion.div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-2" dir="rtl">
                            {isEditing ? (
                                <textarea
                                    value={content}
                                    onChange={(e) => onContentChange(e.target.value)}
                                    className="w-full p-2 bg-gray-800 rounded-md text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
                                    rows={8}
                                />
                            ) : (
                                <div className="prose-custom max-w-none text-gray-300">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const HedraGoalsPanel = () => {
    const [goals, setGoals] = useState<Record<string, HedraGoal> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState<Record<string, { content: string }>>({});
    
    const { log } = useLog();

    const fetchGoals = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/hedra-goals');
            if (!res.ok) throw new Error("Failed to fetch Hedra goals.");
            const data = await res.json();
            setGoals(data);
            setEditedContent({
                main_goal: { content: data.main_goal?.content || '' },
                ideas: { content: data.ideas?.content || '' },
                status: { content: data.status?.content || '' },
            });
        } catch (error) {
            log('Failed to fetch Hedra goals', { error }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [log]);

    useEffect(() => {
        fetchGoals();
    }, [fetchGoals]);

    const handleSave = async () => {
        log('Saving Hedra goals...');
        setIsLoading(true);
        try {
            const res = await fetch('/api/hedra-goals', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editedContent),
            });
            if (!res.ok) throw new Error("Failed to save goals.");
            await fetchGoals();
            setIsEditing(false);
            log('Hedra goals saved successfully.');
        } catch (error) {
            log('Failed to save Hedra goals', { error }, 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleContentChange = (section: 'main_goal' | 'ideas' | 'status', content: string) => {
        setEditedContent(prev => ({ ...prev, [section]: { content } }));
    };

    const sections = {
        main_goal: { title: "1. المهمة الأساسية: الرؤية الكبرى" },
        ideas: { title: "2. المخطط الاستراتيجي: المنظومة البيئية" },
        status: { title: "3. التقرير الموقفي: الحالة الراهنة" }
    };

    if (isLoading && !goals) return <div className="text-center text-gray-400">Loading Doctrine...</div>;
    if (!goals) return <div className="text-center text-red-400">Could not load strategic goals.</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                 <h2 className="m-0 p-0 border-none text-xl font-bold text-indigo-300">The HedraSoul Doctrine</h2>
                 <div className="flex justify-end gap-2">
                    {isEditing ? (
                        <>
                            <button onClick={() => { setIsEditing(false); fetchGoals(); }} className="px-3 py-1 bg-gray-600 text-xs rounded-md hover:bg-gray-500">Cancel</button>
                            <button onClick={handleSave} className="px-3 py-1 bg-green-600 text-xs rounded-md hover:bg-green-500">Save</button>
                        </>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="px-3 py-1 bg-indigo-600 text-xs rounded-md hover:bg-indigo-500">Edit</button>
                    )}
                </div>
            </div>
            <div className="space-y-4">
                <AccordionItem
                    title={sections.main_goal.title}
                    content={editedContent.main_goal?.content}
                    isEditing={isEditing}
                    onContentChange={(content) => handleContentChange('main_goal', content)}
                />
                 <AccordionItem
                    title={sections.ideas.title}
                    content={editedContent.ideas?.content}
                    isEditing={isEditing}
                    onContentChange={(content) => handleContentChange('ideas', content)}
                />
                 <AccordionItem
                    title={sections.status.title}
                    content={editedContent.status?.content}
                    isEditing={isEditing}
                    onContentChange={(content) => handleContentChange('status', content)}
                />
            </div>
        </div>
    );
};

export default HedraGoalsPanel;