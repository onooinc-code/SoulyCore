
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
const FeatureRow = ({ feature, tests }: { feature: Feature; tests: TestCase[] }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const health = calculateFeatureHealth(tests);
    const healthInfo = healthStatusMap[health];

    return (
        <motion.div layout className="bg-gray-800 rounded-lg overflow-hidden">
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
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 border-t border-gray-700 space-y-3">
                            {tests.length > 0 ? (
                                tests.map(test => (
                                    <div key={test.id} className={`p-3 bg-gray-900/50 rounded-md border-l-4 ${testStatusColorMap[test.last_run_status]}`}>
                                        <p className="font-semibold text-sm">{test.description}</p>
                                        <p className="text-xs text-gray-400 mt-1">Status: {test.last_run_status}</p>
                                    </div>
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


// --- Main Component ---
const FeatureHealthDashboard = () => {
    const { setStatus, clearError } = useAppContext();
    const { log } = useLog();
    const [features, setFeatures] = useState<Feature[]>([]);
    const [tests, setTests] = useState<TestCase[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        clearError();
        log('Fetching data for Feature Health Dashboard...');
        try {
            const [featuresRes, testsRes] = await Promise.all([
                fetch('/api/features'),
                fetch('/api/tests')
            ]);
            if (!featuresRes.ok || !testsRes.ok) {
                throw new Error('Failed to fetch required data.');
            }
            const featuresData = await featuresRes.json();
            const testsData = await testsRes.json();
            setFeatures(featuresData);
            setTests(testsData);
            log(`Fetched ${featuresData.length} features and ${testsData.length} tests.`);
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log('Failed to fetch dashboard data.', { error: { message: errorMessage } }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [setStatus, clearError, log]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const testsByFeatureId = useMemo(() => {
        return tests.reduce((acc, test) => {
            if (!acc[test.featureId]) {
                acc[test.featureId] = [];
            }
            acc[test.featureId].push(test);
            return acc;
        }, {} as Record<string, TestCase[]>);
    }, [tests]);

    return (
        <div className="h-full flex flex-col">
            <div className="flex-shrink-0 mb-4">
                 <h3 className="text-2xl font-bold">Feature Health Dashboard</h3>
                 <p className="text-sm text-gray-400">An overview of all system features and their current QA status based on registered test cases.</p>
            </div>
             {isLoading ? (
                <div className="flex-1 flex items-center justify-center"><p>Loading dashboard...</p></div>
            ) : (
                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                    {features.map(feature => (
                        <FeatureRow 
                            key={feature.id}
                            feature={feature}
                            tests={testsByFeatureId[feature.id] || []}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FeatureHealthDashboard;
