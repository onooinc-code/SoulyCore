"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useLog } from '../providers/LogProvider';
import { motion } from 'framer-motion';
import { BrainIcon, ChatBubbleLeftRightIcon, CpuChipIcon, UsersIcon, CheckIcon } from '../Icons';

interface StatCardProps {
    title: string;
    value: string | number;
    category: string;
    icon: React.ReactNode;
}

const StatCard = ({ title, value, category, icon }: StatCardProps) => (
    <div className="bg-gray-900/50 p-4 rounded-lg flex items-center gap-4">
        <div className="p-3 bg-indigo-600/20 text-indigo-300 rounded-full">{icon}</div>
        <div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-sm text-gray-400">{title}</div>
        </div>
    </div>
);


const StatsPanel = () => {
    const [stats, setStats] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { log } = useLog();

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/dashboard/stats');
            if (!res.ok) throw new Error("Failed to fetch stats.");
            const data = await res.json();
            setStats(data);
        } catch (error) {
            log('Failed to fetch dashboard stats', { error }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [log]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (isLoading) {
        return <div className="text-center text-gray-400">Loading stats...</div>;
    }
    
    if (!stats) {
        return <div className="text-center text-red-400">Could not load statistics.</div>;
    }

    const pipelineSuccessRate = (stats.pipelines.contextAssembly.completed + stats.pipelines.memoryExtraction.completed) / 
                               (stats.pipelines.contextAssembly.completed + stats.pipelines.memoryExtraction.completed + stats.pipelines.contextAssembly.failed + stats.pipelines.memoryExtraction.failed) * 100;

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
        >
            <StatCard title="Total Conversations" value={stats.conversations.total} category="Usage" icon={<ChatBubbleLeftRightIcon className="w-6 h-6" />} />
            <StatCard title="Semantic Memories" value={stats.memory.semanticVectors} category="Memory" icon={<BrainIcon className="w-6 h-6" />} />
            <StatCard title="Structured Entities" value={stats.memory.structuredEntities} category="Memory" icon={<CpuChipIcon className="w-6 h-6" />} />
            <StatCard title="Contacts" value={stats.memory.contacts} category="Memory" icon={<UsersIcon className="w-6 h-6" />} />
            <StatCard title="Features Completed" value={stats.project.featuresCompleted} category="Project" icon={<CheckIcon className="w-6 h-6" />} />
        </motion.div>
    );
};

export default StatsPanel;
