"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { AgentRun, AgentRunStep } from '@/lib/types';
import { useLog } from '../providers/LogProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, CheckIcon, XIcon, LightbulbIcon, ServerIcon, ClockIcon } from '../Icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface RunReportProps {
    runId: string;
}

const Step = ({ step }: { step: AgentRunStep }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/50 p-3 rounded-lg"
    >
        <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-indigo-300">{step.step_order}</div>
                {step.action_type !== 'finish' && <div className="w-px h-4 bg-gray-600 my-1"></div>}
            </div>
            <div className="flex-1">
                {step.thought && (
                    <div className="flex items-start gap-2 text-sm text-gray-400 mb-2">
                        <LightbulbIcon className="w-4 h-4 mt-1 flex-shrink-0 text-yellow-400"/>
                        <p className="italic">{step.thought}</p>
                    </div>
                )}
                <div className="flex items-start gap-2 text-sm">
                    <ServerIcon className="w-4 h-4 mt-1 flex-shrink-0 text-cyan-400"/>
                    <div>
                        <p className="font-semibold text-gray-300">Action: <span className="font-mono bg-gray-800 px-1.5 py-0.5 rounded-md text-cyan-300">{step.action_type}</span></p>
                        {step.action_input && <pre className="text-xs mt-1 bg-gray-800 p-2 rounded-md whitespace-pre-wrap"><code>{JSON.stringify(step.action_input, null, 2)}</code></pre>}
                    </div>
                </div>
                {step.observation && (
                     <div className="mt-2 text-sm pl-6 border-l-2 border-dashed border-gray-600 ml-2">
                        <p className="font-semibold text-gray-300 mb-1">Observation:</p>
                        <div className="prose-custom text-xs bg-gray-800 p-2 rounded-md"><ReactMarkdown remarkPlugins={[remarkGfm]}>{step.observation}</ReactMarkdown></div>
                    </div>
                )}
            </div>
        </div>
    </motion.div>
);

const RunReport = ({ runId }: RunReportProps) => {
    const { log } = useLog();
    const [run, setRun] = useState<AgentRun | null>(null);
    const [steps, setSteps] = useState<AgentRunStep[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRunDetails = useCallback(async () => {
        if (!runId) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/agents/runs/${runId}`);
            if (!res.ok) throw new Error('Failed to fetch run details');
            const data = await res.json();
            setRun(data.run);
            setSteps(data.steps);
        } catch (error) {
            log('Failed to fetch run details', { error, runId }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [runId, log]);

    useEffect(() => {
        fetchRunDetails();
    }, [fetchRunDetails]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-full text-gray-400">Loading run report...</div>;
    }

    if (!run) {
        return <div className="flex items-center justify-center h-full text-gray-500">Could not find data for this run.</div>;
    }

    const statusInfoMap: Record<AgentRun['status'], { icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string; label: string }> = {
        planning: { icon: SparklesIcon, color: 'text-blue-400', label: 'Planning' },
        awaiting_approval: { icon: ClockIcon, color: 'text-orange-400', label: 'Awaiting Approval' },
        running: { icon: SparklesIcon, color: 'text-yellow-400', label: 'Running' },
        completed: { icon: CheckIcon, color: 'text-green-400', label: 'Completed' },
        failed: { icon: XIcon, color: 'text-red-400', label: 'Failed' },
    };

    const statusInfo = statusInfoMap[run.status];

    return (
        <div className="h-full flex flex-col">
            <header className="flex-shrink-0 border-b border-gray-700 pb-3 mb-3">
                <p className="text-xs text-gray-500">Goal</p>
                <h3 className="font-semibold text-lg text-gray-200">{run.goal}</h3>
                <div className="flex items-center gap-4 text-sm mt-2">
                    {statusInfo && (
                        <div className={`flex items-center gap-1.5 font-semibold ${statusInfo.color}`}>
                            <statusInfo.icon className="w-5 h-5"/>
                            <span>{statusInfo.label}</span>
                        </div>
                    )}
                    <span className="text-gray-400">Duration: {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(2)}s` : 'N/A'}</span>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                <h4 className="text-md font-semibold text-gray-300">Execution Trace</h4>
                <AnimatePresence>
                    {steps.map(step => <Step key={step.id} step={step} />)}
                </AnimatePresence>

                {run.status !== 'running' && (
                    <motion.div
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="bg-gray-900 p-4 rounded-lg mt-4"
                    >
                         <h4 className="text-md font-semibold text-gray-300 mb-2">Final Result</h4>
                         <div className="prose-custom max-w-none text-sm">
                             <ReactMarkdown remarkPlugins={[remarkGfm]}>{run.final_result || (run.status === 'failed' ? 'The agent failed to complete the goal.' : 'The agent did not produce a final result.')}</ReactMarkdown>
                         </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default RunReport;