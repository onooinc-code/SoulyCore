"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useLog } from '../providers/LogProvider';
import { motion } from 'framer-motion';
import { BrainIcon, ChatBubbleLeftRightIcon, CpuChipIcon, UsersIcon, CheckIcon, LogIcon, BeakerIcon, PromptsIcon } from '../Icons';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
}

const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

const StatCard = ({ title, value, icon }: StatCardProps) => (
    <motion.div variants={cardVariant} className="bg-gray-900/50 p-3 rounded-lg flex items-center gap-3">
        <div className="p-2 bg-indigo-600/20 text-indigo-300 rounded-full">{icon}</div>
        <div>
            <div className="text-xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-400">{title}</div>
        </div>
    </motion.div>
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

    return (
        <motion.div 
            variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.05 } }
            }}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
        >
            {/* Row 1 */}
            <StatCard title="Total Conversations" value={stats.conversations.total} icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />} />
            <StatCard title="Total Messages" value={stats.messages.total} icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />} />
            <StatCard title="Avg Msgs/Convo" value={stats.conversations.avgMessages} icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />} />
            <StatCard title="Semantic Memories" value={stats.memory.semanticVectors} icon={<BrainIcon className="w-5 h-5" />} />
            <StatCard title="Structured Entities" value={stats.memory.structuredEntities} icon={<CpuChipIcon className="w-5 h-5" />} />
            <StatCard title="Contacts" value={stats.memory.contacts} icon={<UsersIcon className="w-5 h-5" />} />
            
            {/* Row 2 */}
            <StatCard title="Active Brains" value={stats.memory.brains} icon={<BrainIcon className="w-5 h-5" />} />
            <StatCard title="Saved Prompts" value={stats.project.prompts} icon={<PromptsIcon className="w-5 h-5" />} />
            <StatCard title="Features Tracked" value={stats.project.featuresTracked} icon={<CheckIcon className="w-5 h-5" />} />
            <StatCard title="API Tests Run" value={stats.system.apiTestsRun} icon={<BeakerIcon className="w-5 h-5" />} />
            <StatCard title="Total Logs" value={stats.system.logs} icon={<LogIcon className="w-5 h-5" />} />
            <StatCard title="Mock Stat" value="123" icon={<CpuChipIcon className="w-5 h-5" />} />
        </motion.div>
    );
};

export default StatsPanel;