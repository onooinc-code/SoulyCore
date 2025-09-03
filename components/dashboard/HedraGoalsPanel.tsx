
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { HedraGoal } from '@/lib/types';
import { useLog } from '../providers/LogProvider';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { DotsHorizontalIcon, PlusIcon, XIcon, BrainIcon, UsersIcon, HeartIcon, CpuChipIcon, ServerIcon } from '../Icons';

// --- Type Definitions ---
type Subsystem = {
    id: string;
    name: string;
    description: string;
    progress: number;
    color: string;
    isActive: boolean;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
};

// --- Child Components ---

const AccordionItem = ({ title, arabicContent, englishContent, isEditing, onContentChange }: {
    title: string;
    arabicContent: string;
    englishContent: string;
    isEditing: boolean;
    onContentChange: (newContent: string) => void;
}) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="group/item relative bg-gray-900/50 rounded-lg border border-gray-700/50 overflow-hidden transition-all duration-300">
            <div className="absolute top-4 left-4 opacity-0 group-hover/item:opacity-100 transition-opacity z-10 p-2 bg-gray-900 rounded-lg shadow-lg text-xs text-gray-300 max-w-sm" style={{ direction: 'ltr' }}>
                <h4 className="font-bold mb-1 text-white">English Content</h4>
                <p>{englishContent}</p>
            </div>
            
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full flex justify-between items-center p-4 text-right bg-indigo-900/20 hover:bg-indigo-900/40 transition-colors duration-300 animate-pulse"
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
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SubsystemCard = ({ subsystem }: { subsystem: Subsystem }) => (
    <div className="bg-gray-900 p-4 rounded-lg border-l-4" style={{ borderColor: subsystem.color }}>
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
                <subsystem.icon className="w-6 h-6 flex-shrink-0" style={{ color: subsystem.color }}/>
                <h4 className="font-bold text-white">{subsystem.name}</h4>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked={subsystem.isActive} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
        </div>
        <p className="text-sm text-gray-400 mt-2">{subsystem.description}</p>
        <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
                 <p className="text-xs text-gray-400">Progress</p>
                 <p className="text-xs font-semibold" style={{ color: subsystem.color }}>{subsystem.progress}%</p>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div 
                    className="h-2 rounded-full" 
                    style={{ backgroundColor: subsystem.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${subsystem.progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
            </div>
        </div>
    </div>
);


const AddSubsystemModal = ({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (subsystem: Omit<Subsystem, 'id' | 'icon'>) => void; }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [progress, setProgress] = useState(0);
    const [color, setColor] = useState('#00bcd4');
    const [isActive, setIsActive] = useState(true);

    const handleSubmit = () => {
        if (!name) return;
        onAdd({ name, description, progress, color, isActive });
        onClose();
        // Reset form
        setName(''); setDescription(''); setProgress(0); setColor('#00bcd4'); setIsActive(true);
    };

    return (
         <AnimatePresence>
            {isOpen && (
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
                        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
                        onClick={e => e.stopPropagation()}
                    >
                       <div className="flex justify-between items-center p-4 border-b border-gray-700">
                           <h3 className="font-semibold text-lg">Add New Subsystem</h3>
                           <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button>
                       </div>
                       <div className="p-6 space-y-4">
                            <input type="text" placeholder="Subsystem Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md text-sm" />
                            <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md text-sm" rows={3}></textarea>
                             <div>
                                <label className="block text-sm text-gray-400">Progress: {progress}%</label>
                                <input type="range" min="0" max="100" value={progress} onChange={e => setProgress(parseInt(e.target.value, 10))} className="w-full" />
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="text-sm text-gray-400">Color</label>
                                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-10 bg-transparent" />
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 text-indigo-600 focus:ring-indigo-500" />
                                    Active
                                </label>
                            </div>
                       </div>
                       <div className="flex justify-end gap-2 p-4 bg-gray-800/50 border-t border-gray-700">
                           <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-sm rounded-md hover:bg-gray-500">Cancel</button>
                           <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-sm rounded-md hover:bg-green-500">Add Subsystem</button>
                       </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// --- Main Panel Component ---

const HedraGoalsPanel = () => {
    const [goals, setGoals] = useState<Record<string, HedraGoal> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState<Record<string, { content: string }>>({});
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [subsystems, setSubsystems] = useState<Subsystem[]>([
        { id: '1', name: "🧠 SoulyCore", description: "العقل: الذاكرة والاستنتاج", progress: 75, color: "#a450e8", isActive: true, icon: BrainIcon },
        { id: '2', name: "👥 HsContacts", description: "العقل الاجتماعي", progress: 10, color: "#00bcd4", isActive: false, icon: UsersIcon },
        { id: '3', name: "❤️ HedraLife", description: "تحليلات شخصية", progress: 5, color: "#4caf50", isActive: false, icon: HeartIcon },
    ]);
    
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
    
    const handleAddSubsystem = (newSubsystem: Omit<Subsystem, 'id' | 'icon'>) => {
        setSubsystems(prev => [...prev, { ...newSubsystem, id: crypto.randomUUID(), icon: CpuChipIcon }]);
    };

    const sections = {
        main_goal: { title: "1. المهمة الأساسية: الرؤية الكبرى", english: `To achieve total life management and automation for "Hedra" across all personal and professional domains.` },
        ideas: { title: "2. المخطط الاستراتيجي: المنظومة البيئية", english: `The mission will be achieved by architecting **HedraSoul**, a modular, API-first ecosystem composed of specialized microservices.` },
        status: { title: "3. التقرير الموقفي: الحالة الراهنة", english: `Initial development has commenced on foundational systems. **SoulyCore (Next.js)** is under active architectural design.` }
    };

    if (isLoading && !goals) return <div className="text-center text-gray-400">جاري تحميل العقيدة...</div>;
    if (!goals) return <div className="text-center text-red-400">تعذر تحميل الأهداف الاستراتيجية.</div>;

    return (
        <>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                        <div className="flex items-center gap-4 mb-3">
                           <ServerIcon className="w-8 h-8 text-indigo-400 flex-shrink-0" />
                           <div>
                                <h3 className="font-bold text-lg text-white">HedraSoul Ecosystem</h3>
                                <p className="text-xs text-indigo-400">Orchestration Layer</p>
                           </div>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">The core API-first orchestration body, built on Laravel, that will manage and coordinate all subsystems.</p>
                        <div className="flex items-center justify-between text-xs text-gray-300 bg-gray-800 px-3 py-1.5 rounded-md">
                            <span>Status: Active Development</span>
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                        </div>
                    </div>
                    
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-lg text-white">Core Subsystems</h3>
                            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1 px-2 py-1 bg-indigo-600/50 text-xs rounded-md hover:bg-indigo-600">
                                <PlusIcon className="w-4 h-4"/> Add
                            </button>
                        </div>
                        <div className="space-y-3">
                           {subsystems.map(sys => <div key={sys.id}><SubsystemCard subsystem={sys} /></div>)}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-4" dir="rtl">
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
                    />
                     <AccordionItem
                        title={sections.status.title}
                        arabicContent={editedContent.status?.content}
                        englishContent={sections.status.english}
                        isEditing={isEditing}
                        onContentChange={(content) => handleContentChange('status', content)}
                    />
                </div>
            </div>
            
            <AddSubsystemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddSubsystem} />
        </>
    );
};

export default HedraGoalsPanel;
