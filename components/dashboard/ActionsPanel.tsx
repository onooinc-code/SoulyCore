"use client";

import React, { useState } from 'react';
import { BeakerIcon } from '../Icons';
import { useLog } from '../providers/LogProvider';

interface ActionButtonProps {
    title: string;
    description: string;
    action: () => Promise<string>;
    icon: React.ReactNode;
}

const ActionButton = ({ title, description, action, icon }: ActionButtonProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleClick = async () => {
        setIsLoading(true);
        setResult(null);
        const res = await action();
        setResult(res);
        setIsLoading(false);
        setTimeout(() => setResult(null), 5000);
    };

    return (
        <div className="bg-gray-900/50 p-3 rounded-lg">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600/20 text-indigo-300 rounded-full">{icon}</div>
                <div className="flex-1">
                    <h4 className="font-semibold text-gray-200">{title}</h4>
                    <p className="text-xs text-gray-400">{description}</p>
                </div>
                <button 
                    onClick={handleClick}
                    disabled={isLoading}
                    className="px-3 py-1 bg-blue-600 text-xs rounded-md hover:bg-blue-500 disabled:opacity-50"
                >
                    {isLoading ? 'Running...' : 'Run'}
                </button>
            </div>
            {result && <p className="text-xs text-green-300 mt-2 p-2 bg-green-900/50 rounded-md">{result}</p>}
        </div>
    );
};

const ActionsPanel = () => {
    const { log } = useLog();

    const runAllApiTests = async (): Promise<string> => {
        log('User triggered "Run All API Tests" action.');
        try {
            const res = await fetch('/api/api-endpoints/test-all', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Batch test failed');
            return data.message;
        } catch (error) {
            return `Error: ${(error as Error).message}`;
        }
    };

    return (
        <div className="space-y-3">
            <ActionButton 
                title="Run All API Tests"
                description="Execute a health check on all registered API endpoints."
                action={runAllApiTests}
                icon={<BeakerIcon className="w-5 h-5" />}
            />
            {/* Add more actions here in the future */}
        </div>
    );
};

export default ActionsPanel;
