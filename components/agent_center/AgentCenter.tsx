"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { AgentRun } from '@/lib/types';
import { useLog } from '../providers/LogProvider';
import { useAppContext } from '../providers/AppProvider';
import { motion } from 'framer-motion';
import RunReport from './RunReport';

const AgentCenter = () => {
    const { log } = useLog();
    const { setStatus } = useAppContext();
    const [goal, setGoal] = useState('');
    const [runs, setRuns] = useState<AgentRun[]>([]);
    const [activeRunId, setActiveRunId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchRuns = useCallback(async () => {
        try {
            const res = await fetch('/api/agents/runs');
            if (!res.ok) throw new Error('Failed to fetch agent runs');
            const data = await res.json();
            setRuns(data);
        } catch (error) {
            log('Failed to fetch agent runs', { error }, 'error');
            setStatus({ error: (error as Error).message });
        }
    }, [log, setStatus]);

    useEffect(() => {
        fetchRuns();
    }, [fetchRuns]);

    const handleLaunch = async () => {
        if (!goal.trim()) return;
        setIsLoading(true);
        setActiveRunId(null);
        setStatus({ currentAction: 'Launching agent...' });
        log('Launching new agent run', { goal });
        try {
            const res = await fetch('/api/agents/runs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goal }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to launch agent');
            
            log('Agent run launched successfully', { runId: data.id });
            setActiveRunId(data.id);
            setGoal('');
            await fetchRuns(); // Refresh the list
        } catch (error) {
            log('Failed to launch agent', { error }, 'error');
            setStatus({ error: (error as Error).message });
        } finally {
            setIsLoading(false);
            setStatus({ currentAction: '' });
        }
    };

    return (
        <div className="bg-gray-900 w-full h-full flex flex-col p-6">
            <header className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-xl font-bold">Autonomous Agent Center</h2>
            </header>

            <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
                {/* Left Panel: Controls & Run History */}
                <div className="col-span-4 flex flex-col gap-6">
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2">Launch New Agent</h3>
                        <p className="text-sm text-gray-400 mb-4">Define a high-level goal for the agent to achieve.</p>
                        <textarea
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder="e.g., 'Research the top 3 AI frameworks for frontend development and create a comparison table.'"
                            className="w-full p-2 bg-gray-700 rounded-lg text-sm resize-y"
                            rows={4}
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleLaunch}
                            disabled={isLoading || !goal.trim()}
                            className="w-full mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-500 disabled:opacity-50"
                        >
                            {isLoading ? 'Agent is Running...' : 'Launch Agent'}
                        </button>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-lg flex-1 flex flex-col overflow-hidden">
                        <h3 className="text-lg font-semibold mb-4">Run History</h3>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                            {runs.map(run => (
                                <button
                                    key={run.id}
                                    onClick={() => setActiveRunId(run.id)}
                                    className={`w-full text-left p-3 rounded-md transition-colors ${activeRunId === run.id ? 'bg-indigo-600/30' : 'bg-gray-700/50 hover:bg-gray-700'}`}
                                >
                                    <p className="font-semibold truncate">{run.goal}</p>
                                    <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
                                        <span>{new Date(run.createdAt).toLocaleString()}</span>
                                        <span className={`capitalize px-2 py-0.5 rounded-full ${run.status === 'completed' ? 'bg-green-600/50 text-green-300' : run.status === 'failed' ? 'bg-red-600/50 text-red-300' : 'bg-yellow-600/50 text-yellow-300'}`}>{run.status}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Run Monitor/Report */}
                <div className="col-span-8 bg-gray-800/50 p-4 rounded-lg overflow-hidden">
                     <motion.div 
                        key={activeRunId || 'empty'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="h-full"
                    >
                        {activeRunId ? (
                            <RunReport runId={activeRunId} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <p>Select a run from the history or launch a new agent to see the execution report.</p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default AgentCenter;