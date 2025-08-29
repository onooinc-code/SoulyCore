"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XIcon } from '../Icons';
import dynamic from 'next/dynamic';

const BrainManagementTab = dynamic(() => import('./BrainManagementTab'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full"><p className="text-white">Loading...</p></div>
});

const MemoryViewerTab = dynamic(() => import('./MemoryViewerTab'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full"><p className="text-white">Loading...</p></div>
});

type Tab = 'brain_management' | 'memory_viewer';

interface BrainCenterProps {
    setIsOpen: (isOpen: boolean) => void;
}

const BrainCenter = ({ setIsOpen }: BrainCenterProps) => {
    const [activeTab, setActiveTab] = useState<Tab>('brain_management');

    const TabButton = ({ tabName, label }: { tabName: Tab; label: string }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tabName ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'
            }`}
        >
            {label}
        </button>
    );
    
    const renderContent = () => {
        switch (activeTab) {
            case 'brain_management': return <BrainManagementTab />;
            case 'memory_viewer': return <MemoryViewerTab />;
            default: return null;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl h-full max-h-[90vh] flex flex-col p-6"
            >
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold">Brain Center</h2>
                    <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-700">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex items-center gap-2 mb-4">
                    <TabButton tabName="brain_management" label="Brain Management" />
                    <TabButton tabName="memory_viewer" label="Memory Viewer" />
                </div>
                
                <div className="flex-1 bg-gray-900 rounded-lg p-4 overflow-y-auto">
                    {renderContent()}
                </div>

            </motion.div>
        </motion.div>
    );
};

export default BrainCenter;