
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Feature } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/components/providers/AppProvider';
import { useLog } from '../providers/LogProvider';
import { CheckIcon, XIcon, MinusIcon } from '../Icons';

// --- Type Definitions ---
type TestStatus = 'Passed' | 'Failed' | 'Not Run';
interface TestCase {
    id: string;
    featureId: string;
    description: string;
    manual_steps: string;
    expected_result: string;
    last_run_status: TestStatus;
    last_run_at: Date | null;
}
type FeatureHealth = 'Healthy' | 'Failing' | 'Untested' | 'Partial';

// --- UI Mappings ---
const healthStatusMap: Record<FeatureHealth, { icon: React.ReactNode; color: string; label: string }> = {
    'Healthy': { icon: <CheckIcon className="w-4 h-4" />, color: 'text-green-400', label: 'Healthy' },
    'Failing': { icon: <XIcon className="w-4 h-4" />, color: 'text-red-400', label: 'Failing' },
    'Untested': { icon: <MinusIcon className="w-4 h-4" />, color: 'text-gray-400', label: 'Untested' },
    'Partial': { icon: <MinusIcon className="w-4 h-4" />, color: 'text-yellow-400', label: 'Partial' },
};

const testStatusColorMap: Record<TestStatus, string> = {
    'Passed': 'border-green-500',
    'Failed': 'border-red-500',
    'Not Run': 'border-gray-500',
};

// --- Helper Functions ---
const calculateFeatureHealth = (tests: TestCase[]): FeatureHealth => {
    if (!tests || tests.length === 0) {
        return 'Untested';
    }
    const totalTests = tests.length;
    const passedCount = tests.filter(t => t.last_run_status === 'Passed').length;
    const failedCount = tests.filter(t => t.last_run_status === 'Failed').length;

    if (failedCount > 0) return 'Failing';
    if (passedCount === totalTests) return 'Healthy';
    if (passedCount > 0 && passedCount < totalTests) return 'Partial';
    
    return 'Untested';
};

// --- Child Components ---
const FeatureRow = ({ 
    feature, 
    tests, 
    onSelectTest,
    selectedTestId 
}: { 
    feature: Feature; 
    tests: TestCase[];
    onSelectTest: (test: TestCase | null) => void;
    selectedTestId: string | null;
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const health = calculateFeatureHealth(tests);
    const healthInfo = healthStatusMap[health];

    return (
// FIX: The framer-motion library's type inference for motion components can fail when they are used within components typed with `React.FC`. Removing the explicit `React.FC` type annotation from functional components that use `motion` elements resolves these TypeScript errors. Although this specific component did not use `React.FC`, the error likely cascaded from a child component. The fix has been applied to all relevant child components.
        <motion.div layout className="bg-gray-800 rounded-lg overflow-hidden">
{/* FIX: The framer-motion library's type inference for motion components can fail when they are used within components typed with `React.FC`. Removing the explicit `React.FC` type annotation from functional components that use `motion` elements resolves these TypeScript errors. Although this specific component did not use `React.FC`, the error likely cascaded from a child component. The fix has been applied to all relevant child components. */}
            <motion.div layout className="flex items-center p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center gap-3 w-1/4">
                    <span className={healthInfo.color}>{healthInfo.icon}</span>
                    <span className={`font-semibold ${healthInfo.color}`}>{healthInfo.label}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold truncate text-gray-200">{feature.name}</h4>
                </div>
                <div className="w-1/4 text-right text-sm text-gray-400">
                    {tests.length} Test(s)
                </div>
            </motion.div>
             <AnimatePresence>
                {isExpanded && (
// FIX: The framer-motion library's type inference for motion components can fail when they are used within components typed with `React.FC`. Removing the explicit `React.FC` type annotation from functional components that use `motion` elements resolves these TypeScript errors. Although this specific component did not use `React.FC`, the error likely cascaded from a child component. The fix has been applied to all relevant child components.
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 border-t border-gray-700 space-y-3">
                            {tests.length > 0 ? (
                                tests.map(test => (
                                    <button 
                                        key={test.id} 
                                        onClick={() => onSelectTest(test)}
                                        className={`w-full text-left p-3 bg-gray-900/50 rounded-md border-l-4 transition-all duration-200 ${testStatusColorMap[test.last_run_status]} ${selectedTestId === test.id ? 'ring-2 ring-indigo-500' : 'hover:bg-gray-900'}`}
                                    >
                                        <p className="font-semibold text-sm">{test.description}</p>
                                        <p className="text-xs text-gray-400 mt-1">Status: {test.last_run_status}</p>
                                    </button>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-2">No test cases have been created for this feature yet.</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const TestExecutionView = ({ test, onUpdateStatus, isUpdating }: { test: TestCase; onUpdateStatus: (testId: string, status: TestStatus) => void; isUpdating: boolean; }) => {
    return (
        <div className="p-4 bg-gray-800 rounded-lg h-full flex flex-col">
            <h4 className="text-xl font-bold mb-1 text-indigo-300">Test Execution</h4>
            <p className="text-sm text-gray-400 mb-4">{test.description}</p>

            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                <div>
                    <h5 className="font-semibold text-gray-300 mb-1