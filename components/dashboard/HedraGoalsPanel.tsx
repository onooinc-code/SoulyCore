"use client";

import React, { useState } from 'react';
// FIX: Corrected typo from AnatePresence to AnimatePresence.
import { motion, AnimatePresence } from 'framer-motion';
import { Subsystem } from '@/lib/types';
import SubsystemCard from './SubsystemCard';
import DependencyGraph from './DependencyGraph';
import SubsystemDetailModal from './SubsystemDetailModal';
import { Reorder } from 'framer-motion';

// Mock data for the subsystems, as we don't have a DB table for this yet.
const initialSubsystems: Subsystem[] = [
    {
        id: 'soulycore',
        name: 'SoulyCore - Cognitive Engine',
        description: 'The central AI brain managing memory and reasoning.',
        progress: 85,
        healthScore: 'A',
        dependencies: [],
        resources: [
            { name: 'GitHub Repo', url: '#' },
            { name: 'Google Docs', url: '#' },
        ],
        milestones: [
            { description: 'V2 Cognitive Architecture Implemented', completed: true },
            { description: 'Context Assembly Pipeline Complete', completed: true },
            { description: 'Memory Extraction Pipeline Complete', completed: false },
        ],
        githubStats: { commits: 128, pullRequests: 12, issues: 3, repoUrl: '#' },
        tasks: {
            completed: ["Implement Episodic Memory", "Implement Semantic Memory"],
            remaining: ["Optimize Context Pruning"]
        }
    },
    {
        id: 'hedra-ui',
        name: 'HedraUI - Main Frontend',
        description: 'The primary user interface built with Next.js and React.',
        progress: 95,
        healthScore: 'A+',
        dependencies: ['soulycore'],
        resources: [
            { name: 'GitHub Repo', url: '#' },
            { name: 'Figma', url: '#' },
        ],
        milestones: [
            { description: 'Dashboard Center Complete', completed: true },
            { description: 'Agent Center Complete', completed: true },
            { description: 'Implement Theming Engine', completed: false },
        ],
        githubStats: { commits: 256, pullRequests: 25, issues: 1, repoUrl: '#' },
         tasks: {
            completed: ["Build Dashboard", "Build Agent Center", "Implement Navigation"],
            remaining: ["Add i18n support"]
        }
    },
    {
        id: 'hedrasoul',
        name: 'HedraSoul - API Orchestrator',
        description: 'The main Laravel-based API gateway and business logic hub.',
        progress: 60,
        healthScore: 'B',
        dependencies: ['soulycore'],
        resources: [
            { name: 'GitHub Repo', url: '#' },
            { name: 'Notion', url: '#' },
        ],
        milestones: [
            { description: 'User Authentication Complete', completed: true },
            { description: 'Implement Core Endpoints', completed: true },
            { description: 'Integrate with HedraLife', completed: false },
        ],
        githubStats: { commits: 78, pullRequests: 8, issues: 5, repoUrl: '#' },
        tasks: {
            completed: ["Setup Laravel project", "Implement JWT Auth"],
            remaining: ["Build Billing Module", "Write API documentation"]
        }
    },
];

const HedraGoalsPanel = () => {
    const [subsystems, setSubsystems] = useState<Subsystem[]>(initialSubsystems);
    const [selectedSubsystem, setSelectedSubsystem] = useState<Subsystem | null>(null);
    const [aiAnalysisResult, setAiAnalysisResult] = useState<{ title: string; content: string } | null>(null);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    
    const handleAiAction = async (subsystem: Subsystem, action: 'summary' | 'risk') => {
        const url = action === 'summary' ? '/api/dashboard/ai-summary' : '/api/dashboard/ai-risk-assessment';
        const title = action === 'summary' ? `AI Summary for ${subsystem.name}` : `AI Risk Assessment for ${subsystem.name}`;
        
        setAiAnalysisResult({ title, content: 'Analyzing with Gemini...' });
        setIsAiModalOpen(true);
        
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subsystem }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'AI analysis failed');
            setAiAnalysisResult({ title, content: data.result });
        } catch (error) {
            setAiAnalysisResult({ title, content: `Error: ${(error as Error).message}` });
        }
    };

    return (
        <div className="p-4 bg-gray-900/50 rounded-lg text-gray-200" dir="rtl">
            {/* Top-level goals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-indigo-500">
                    <h4 className="font-bold text-white">المهمة الأساسية</h4>
                    <p className="text-sm text-gray-300 mt-1">تحقيق الإدارة والأتمتة الكاملة لحياة "هدرا" بكل تفاصيلها.</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-cyan-500">
                    <h4 className="font-bold text-white">المخطط الاستراتيجي</h4>
                    <p className="text-sm text-gray-300 mt-1">بناء منظومة بيئية معيارية (API-First) من خدمات مصغرة متخصصة.</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-green-500">
                    <h4 className="font-bold text-white">الحالة الراهنة</h4>
                    <p className="text-sm text-gray-300 mt-1">تطوير نشط للمكونات التأسيسية مثل HedraSoul و SoulyCore.</p>
                </div>
            </div>

            {/* Ecosystem Command Center */}
            <div className="mt-4 pt-4 border-t border-gray-700">
                <h3 className="text-xl font-bold text-center mb-4 text-indigo-300">مركز قيادة المنظومة البيئية (Ecosystem Command Center)</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Dependency Graph */}
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <h4 className="font-semibold text-center mb-4">خريطة الترابط (Dependency Map)</h4>
                        <DependencyGraph subsystems={subsystems} />
                    </div>

                    {/* Right: Subsystems List */}
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <h4 className="font-semibold text-center mb-4">الأنظمة الفرعية (Subsystems)</h4>
                        <Reorder.Group axis="y" values={subsystems} onReorder={setSubsystems} className="space-y-3">
                            {subsystems.map(sub => (
                                // FIX: Wrapped SubsystemCard component in a div with the key to resolve TypeScript error.
                                // The 'key' prop is for React's reconciliation and should be on the wrapping element of a list, not passed to the component's props.
                                <div key={sub.id}>
                                    <SubsystemCard 
                                        subsystem={sub} 
                                        onOpenDetails={() => setSelectedSubsystem(sub)}
                                        onAiAction={handleAiAction}
                                    />
                                </div>
                            ))}
                        </Reorder.Group>
                    </div>
                </div>
            </div>
            
            <AnimatePresence>
                {selectedSubsystem && (
                    <SubsystemDetailModal 
                        subsystem={selectedSubsystem} 
                        onClose={() => setSelectedSubsystem(null)} 
                    />
                )}
                {isAiModalOpen && aiAnalysisResult && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[101] p-4"
                        onClick={() => setIsAiModalOpen(false)}
                    >
                         <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6"
                            onClick={e => e.stopPropagation()}
                         >
                            <h3 className="font-bold text-lg mb-4">{aiAnalysisResult.title}</h3>
                            <div className="prose-custom max-h-80 overflow-y-auto text-gray-300 whitespace-pre-wrap">{aiAnalysisResult.content}</div>
                            <button onClick={() => setIsAiModalOpen(false)} className="mt-4 px-4 py-2 bg-indigo-600 rounded-lg w-full">Close</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default HedraGoalsPanel;