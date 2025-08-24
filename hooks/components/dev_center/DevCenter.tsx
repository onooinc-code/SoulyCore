import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XIcon } from '../Icons';
import Dashboard from './Dashboard';
import Roadmap from './Roadmap';
import CodeTerminal from './CodeTerminal';
import Documentation from './Documentation';

type Tab = 'dashboard' | 'roadmap' | 'code' | 'docs';

interface DevCenterProps {
    setIsOpen: (isOpen: boolean) => void;
}

const DevCenter: React.FC<DevCenterProps> = ({ setIsOpen }) => {
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');

    const TabButton: React.FC<{ tabName: Tab; label: string }> = ({ tabName, label }) => (
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
            case 'dashboard': return <Dashboard />;
            case 'roadmap': return <Roadmap />;
            case 'code': return <CodeTerminal />;
            case 'docs': return <Documentation />;
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
                    <h2 className="text-xl font-bold">SoulyDev Center</h2>
                    <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-700">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex items-center gap-2 mb-4">
                    <TabButton tabName="dashboard" label="Dashboard" />
                    <TabButton tabName="roadmap" label="Roadmap & Ideas" />
                    <TabButton tabName="code" label="Code & Terminal" />
                    <TabButton tabName="docs" label="Smart Documentation" />
                </div>
                
                <div className="flex-1 bg-gray-900 rounded-lg p-4 overflow-y-auto">
                    {renderContent()}
                </div>

            </motion.div>
        </motion.div>
    );
};

export default DevCenter;