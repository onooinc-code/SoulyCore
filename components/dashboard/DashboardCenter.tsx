"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XIcon } from '../Icons';
import DashboardPanel from './DashboardPanel';
import HeaderPanel from './HeaderPanel';
import HedraGoalsPanel from './HedraGoalsPanel';
import StatsPanel from './StatsPanel';
import ActionsPanel from './ActionsPanel';
import DecisionsPanel from './DecisionsPanel';
import ReportsPanel from './ReportsPanel';
import DocumentationPanel from './DocumentationPanel';

interface DashboardCenterProps {
    setIsOpen: (isOpen: boolean) => void;
}

const DashboardCenter = ({ setIsOpen }: DashboardCenterProps) => {
    // This state can be used to programmatically control all panels
    const [allPanelsCollapsed, setAllPanelsCollapsed] = useState<boolean | null>(null);

    const handleCollapseAll = () => {
        setAllPanelsCollapsed(true);
    };

    const handleExpandAll = () => {
        setAllPanelsCollapsed(false);
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
                className="bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl w-full h-full flex flex-col"
            >
                <header className="flex justify-between items-center p-4 border-b border-gray-700/50 flex-shrink-0">
                    <h2 className="text-xl font-bold">Dashboard Center</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={handleExpandAll} className="px-3 py-1.5 bg-gray-700 text-xs rounded-md hover:bg-gray-600">Expand All</button>
                        <button onClick={handleCollapseAll} className="px-3 py-1.5 bg-gray-700 text-xs rounded-md hover:bg-gray-600">Collapse All</button>
                        <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-6 h-6" /></button>
                    </div>
                </header>
                
                <main className="flex-1 p-4 overflow-y-auto space-y-4">
                    <HeaderPanel />
                    
                    <DashboardPanel title="Hedra Strategic Goals" isCollapsedOverride={allPanelsCollapsed}>
                        <HedraGoalsPanel />
                    </DashboardPanel>
                    
                    <DashboardPanel title="System Statistics" isCollapsedOverride={allPanelsCollapsed}>
                        <StatsPanel />
                    </DashboardPanel>

                    {/* FIX: Added the missing child components to the `DashboardPanel` instances. The self-closing tags were causing errors as the component requires children. */}
                    <DashboardPanel title="Project Documentations" isCollapsedOverride={allPanelsCollapsed}>
                        <DocumentationPanel />
                    </DashboardPanel>
                    <DashboardPanel title="Action Center" isCollapsedOverride={allPanelsCollapsed}>
                        <ActionsPanel />
                    </DashboardPanel>
                    <DashboardPanel title="Needed Decisions" isCollapsedOverride={allPanelsCollapsed}>
                        <DecisionsPanel />
                    </DashboardPanel>
                    <DashboardPanel title="Important Reports" isCollapsedOverride={allPanelsCollapsed}>
                        <ReportsPanel />
                    </DashboardPanel>
                </main>

                <footer className="p-2 border-t border-gray-700/50 text-center text-xs text-gray-500 flex-shrink-0">
                    SoulyCore Dashboard v1.0
                </footer>

            </motion.div>
        </motion.div>
    );
};

export default DashboardCenter;
