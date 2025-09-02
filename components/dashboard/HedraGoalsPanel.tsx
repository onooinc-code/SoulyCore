
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { HedraGoal } from '@/lib/types';
import { useLog } from '../providers/LogProvider';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { DotsHorizontalIcon } from '../Icons';

const AccordionItem = ({ title, arabicContent, englishContent, isEditing, onContentChange, children }: {
    title: string;
    arabicContent: string;
    englishContent: string;
    isEditing: boolean;
    onContentChange: (newContent: string) => void;
    children?: React.ReactNode;
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="group/item relative bg-gray-900/50 rounded-lg border border-gray-700/50 overflow-hidden">
            <div className="absolute top-4 left-4 opacity-0 group-hover/item:opacity-100 transition-opacity z-10 p-2 bg-gray-900 rounded-lg shadow-lg text-xs text-gray-300 max-w-sm" style={{ direction: 'ltr' }}>
                <h4 className="font-bold mb-1 text-white">English Content</h4>
                <p>{englishContent}</p>
            </div>
            
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 text-right">
                <span className="font-bold text-lg text-gray-200">{title}</span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
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
                        <div className="p-4 pt-0">
                            {isEditing ? (
                                <textarea
                                    value={arabicContent}
                                    onChange={(e) => onContentChange(e.target.value)}
                                    className="w-full p-2 bg-gray-800 rounded-md text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
                                    rows={8}
                                />
                            ) : (
                                <div className="prose-custom max-w-none text-gray-300">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{arabicContent}</ReactMarkdown>
                                </div>
                            )}
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SubsystemCard = ({ name, description, progress, color, isActive }: { name: string, description: string, progress: number, color: string, isActive: boolean }) => (
    <div className="bg-gray-900 p-4 rounded-lg border-l-4" style={{ borderColor: color }}>
        <div className="flex justify-between items-center">
            <h4 className="font-bold text-white">{name}</h4>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked={isActive} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
        </div>
        <p className="text-sm text-gray-400 mt-1">{description}</p>
        <div className="mt-3">
            <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="h-2 rounded-full" style={{ width: `${progress}%`, backgroundColor: color }}></div>
            </div>
            <p className="text-xs text-center text-gray-500 mt-1">الحالة: {progress}% مكتمل</p>
        </div>
    </div>
);


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
        main_goal: {
            title: "1. المهمة الأساسية: الرؤية الكبرى",
            english: `To achieve total life management and automation for "Hedra" across all personal and professional domains. This involves creating a comprehensive, intelligent, and proactive digital ecosystem that understands, assists, and evolves with him, enabling peak performance, optimized well-being, and profound self-awareness.`
        },
        ideas: {
            title: "2. المخطط الاستراتيجي: المنظومة البيئية",
            english: `The mission will be achieved by architecting **HedraSoul**, a modular, API-first ecosystem composed of specialized microservices. **SoulyCore**, the central cognitive mind, will provide memory and reasoning for all subsystems. Each subsystem, like **HsContacts** (social intelligence) and **HedraLife** (personal analytics), will operate as an independent yet interconnected component. A core principle is **"Insight-Driven Control,"** mandating that each subsystem must feature interactive dashboards that transform raw data into actionable insights, empowering informed decision-making.`
        },
        status: {
            title: "3. التقرير الموقفي: الحالة الراهنة",
            english: `Initial development has commenced on foundational systems. **HedraSoul (Laravel)** is established as the core orchestration body. **SoulyCore (Next.js)** is under active architectural design, focusing on creating a sophisticated, multi-layered cognitive memory and reasoning engine. The primary focus is on finalizing the core cognitive architecture before expanding to other specialized subsystems.`
        }
    };

    const subsystems = [
        { name: "🧠 SoulyCore", description: "العقل: الذاكرة والاستنتاج", progress: 75, color: "#a450e8", isActive: true },
        { name: "👥 HsContacts", description: "العقل الاجتماعي", progress: 10, color: "#00bcd4", isActive: false },
        { name: "❤️ HedraLife", description: "تحليلات شخصية", progress: 5, color: "#4caf50", isActive: false },
    ];

    if (isLoading && !goals) {
        return <div className="text-center text-gray-400">جاري تحميل العقيدة...</div>;
    }

    if (!goals) {
        return <div className="text-center text-red-400">تعذر تحميل الأهداف الاستراتيجية.</div>;
    }

    return (
        <div className="space-y-4 text-right" style={{ fontFamily: "'Cairo', sans-serif" }}>
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                 <h2 className="m-0 p-0 border-none text-2xl font-bold text-indigo-300">عقيدة هيدرا سول (The HedraSoul Doctrine)</h2>
                 <div className="flex justify-end gap-2">
                    {isEditing ? (
                        <>
                            <button onClick={() => { setIsEditing(false); fetchGoals(); }} className="px-3 py-1 bg-gray-600 text-xs rounded-md hover:bg-gray-500">إلغاء</button>
                            <button onClick={handleSave} className="px-3 py-1 bg-green-600 text-xs rounded-md hover:bg-green-500">حفظ التغييرات</button>
                        </>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="px-3 py-1 bg-indigo-600 text-xs rounded-md hover:bg-indigo-500">تعديل</button>
                    )}
                     <button title="خيارات إضافية" className="p-2 text-gray-400 bg-gray-800/50 rounded-md hover:bg-gray-700"><DotsHorizontalIcon className="w-4 h-4" /></button>
                </div>
            </div>
            
            <div className="space-y-3">
                <AccordionItem
                    title={sections.main_goal.title}
                    arabicContent={editedContent.main_goal?.content}
                    englishContent={sections.main_goal.english}
                    isEditing={isEditing}
                    onContentChange={(content) => handleContentChange('main_goal', content)}
                />
                 <AccordionItem
                    title={sections.ideas.title}
                    arabicContent={editedContent.ideas?.content}
                    englishContent={sections.ideas.english}
                    isEditing={isEditing}
                    onContentChange={(content) => handleContentChange('ideas', content)}
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        {/* FIX: Wrapped SubsystemCard in a div to resolve a TypeScript error where the `key` prop was being incorrectly passed. The 'key' prop is for React's reconciliation and should be on the wrapping element of a list. */}
                        {subsystems.map(sys => <div key={sys.name}><SubsystemCard {...sys} /></div>)}
                    </div>
                </AccordionItem>
                 <AccordionItem
                    title={sections.status.title}
                    arabicContent={editedContent.status?.content}
                    englishContent={sections.status.english}
                    isEditing={isEditing}
                    onContentChange={(content) => handleContentChange('status', content)}
                />
            </div>
        </div>
    );
};

export default HedraGoalsPanel;
