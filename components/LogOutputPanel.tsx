"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLog } from './providers/LogProvider';

interface LogOutputPanelProps {
    isOpen: boolean;
}

const LogOutputPanel: React.FC<LogOutputPanelProps> = ({ isOpen }) => {
    const { logs, clearLogs } = useLog();

    const levelColor: Record<string, string> = {
        info: 'text-gray-400',
        warn: 'text-yellow-400',
        error: 'text-red-400',
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: '200px', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="bg-gray-900 border-t border-gray-700 overflow-hidden flex flex-col"
                >
                    <div className="flex justify-between items-center p-2 bg-gray-800 text-xs font-bold text-gray-300">
                        <span>Log Output</span>
                        <button onClick={clearLogs} className="px-2 py-0.5 text-xs bg-gray-600 rounded hover:bg-gray-500">Clear</button>
                    </div>
                    <div className="flex-1 p-2 overflow-y-auto text-xs font-mono">
                        {logs.map((log) => (
                            <div key={log.id} className="flex gap-2 items-start">
                                <span className="text-gray-500 flex-shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                <p className={`${levelColor[log.level]} whitespace-pre-wrap break-all`}>
                                    {log.message}
                                    {log.payload && <span className="text-gray-600 ml-2">{JSON.stringify(log.payload)}</span>}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LogOutputPanel;