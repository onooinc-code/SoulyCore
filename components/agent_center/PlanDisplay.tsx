"use client";

import React from 'react';
import { AgentPlanPhase } from '@/lib/types';
import PhaseCard from './PhaseCard';
import { motion, AnimatePresence } from 'framer-motion';

type ViewState = 'review' | 'executing';

interface PlanDisplayProps {
    goal: string;
    plan: Omit<AgentPlanPhase, 'id' | 'run_id' | 'steps' | 'result' | 'started_at' | 'completed_at'>[];
    state: ViewState;
    onApprove: () => void;
    onDiscard: () => void;
    onReplan: () => void;
}

const PlanDisplay = ({ goal, plan, state, onApprove, onDiscard, onReplan }: PlanDisplayProps) => {

    const renderHeader = () => {
        if (state === 'executing') {
            return (
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-400">Executing plan...</p>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-yellow-600 text-white rounded-md text-sm font-semibold hover:bg-yellow-500">Pause</button>
                        <button className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-500">Cancel</button>
                    </div>
                </div>
            )
        }
        
        return (
            <div className="flex justify-between items-center">
                 <p className="text-sm text-gray-400">Review the proposed plan below.</p>
                <div className="flex gap-2">
                    <button onClick={onDiscard} className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-semibold hover:bg-gray-500">Discard</button>
                    <button onClick={onReplan} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-500">Re-plan</button>
                    <button onClick={onApprove} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-500">Approve & Start</button>
                </div>
            </div>
        )
    }

    return (
        <motion.div
            key="plan-display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col"
        >
            <header className="flex-shrink-0 border-b border-gray-700 pb-3 mb-3">
                <p className="text-xs text-gray-500">Main Goal</p>
                <h3 className="font-semibold text-lg text-gray-200">{goal}</h3>
                <div className="mt-4">
                    {renderHeader()}
                </div>
            </header>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                <h4 className="text-md font-semibold text-gray-300">Execution Plan</h4>
                <AnimatePresence>
                     {plan.map((phase, index) => (
                        <PhaseCard 
                            key={index} 
                            phase={phase}
                            isActive={state === 'executing' && phase.status === 'running'} // This will be dynamic later
                        />
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default PlanDisplay;