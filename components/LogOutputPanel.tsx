"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLog } from './providers/LogProvider';
import { InfoIcon, WarningIcon, ErrorIcon } from './Icons';
import { LogEntry as LogEntryType } from './providers/LogProvider';


interface LogOutputPanelProps {
    isOpen: boolean;
}

type LogLevel = 'info' | 'warn' | 'error';
type FilterLevel = LogLevel | 'all';

// Component for rendering a single log entry
const LogEntry: React.FC<{ log: LogEntryType }> = ({ log }) => {
    const levelIcon: Record<LogLevel, React.ReactNode> = {
        info: <InfoIcon className="w-4 h-4 text-gray-400" />,
        warn: <WarningIcon className="w-4 h-4 text-yellow-400" />,
        error: <ErrorIcon className="w-4 h-4 text-red-400" />,
    };

    return (
        <div className="flex gap-3 items-start py-1.5 border-b border-gray-800/50">
            <span className="mt-0.5">{levelIcon[log.level as LogLevel]}</span>
            {/* FIX: `fractionalSecondDigits` is not a valid option in `toLocaleTimeString`. Using `toISOString` provides a consistent format with milliseconds. */}
            <span className="text-gray-500 flex-shrink-0">{new Date(log.timestamp).toISOString().slice(11, 23)}</span>
            <div className="flex-1 whitespace-pre-wrap break-words min-w-0">
                <p>{log.message}</p>
                {log.payload && (
                    <details className="mt-1 text-gray-500">
                        <summary className="cursor-pointer text-xs outline-none focus:underline">Payload</summary>
                        <pre className="text-xs bg-gray-800 p-2 rounded-md mt-1 overflow-auto">
                            <code>{JSON.stringify(log.payload, null, 2)}</code>
                        </pre>
                    </details>
                )}
            </div>
        </div>
    );
};


const LogOutputPanel: React.FC<LogOutputPanelProps> = ({ isOpen }) => {
    const { logs, clearLogs } = useLog();
    const [filter, setFilter] = useState<FilterLevel>('all');

    const filteredLogs = useMemo(() => {
        if (filter === 'all') {
            return logs;
        }
        return logs.filter(log => log.level === filter);
    }, [logs, filter]);

    const FilterButton: React.FC<{ level: FilterLevel, label: string }> = ({ level, label }) => (
        <button
            onClick={() => setFilter(level)}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${filter === level ? 'bg-indigo-600 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}
        >
            {label}
        </button>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: '250px', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="bg-gray-900 border-t border-gray-700 overflow-hidden flex flex-col"
                >
                    <div className="flex justify-between items-center p-2 bg-gray-800 text-xs font-bold text-gray-300">
                        <div className="flex items-center gap-4">
                            <span>Log Output</span>
                            <div className="flex items-center gap-1.5">
                                <FilterButton level="all" label="All" />
                                <FilterButton level="info" label="Info" />
                                <FilterButton level="warn" label="Warn" />
                                <FilterButton level="error" label="Error" />
                            </div>
                        </div>
                        <button onClick={clearLogs} className="px-2 py-0.5 text-xs bg-red-800 text-white rounded hover:bg-red-700">Clear</button>
                    </div>
                    <div className="flex-1 p-2 overflow-y-auto text-xs font-mono">
                        {filteredLogs.length > 0 ? (
                             filteredLogs.map((log) => (
                                <LogEntry key={log.id} log={log} />
                            ))
                        ) : (
                            <p className="text-gray-500 text-center pt-4">No logs to display for this filter.</p>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LogOutputPanel;