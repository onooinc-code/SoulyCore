"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAppContext } from './AppProvider';

export interface LogEntry {
    timestamp: string;
    message: string;
    payload?: any;
    level: 'info' | 'warn' | 'error';
}

interface LogContextType {
    logs: LogEntry[];
    log: (message: string, payload?: any, level?: 'info' | 'warn' | 'error') => void;
    clearLogs: () => void;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

export const LogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { settings } = useAppContext();
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const log = useCallback((message: string, payload?: any, level: 'info' | 'warn' | 'error' = 'info') => {
        if (!settings?.enableDebugLog.enabled) {
            return;
        }

        const newLog: LogEntry = {
            timestamp: new Date().toISOString(),
            message,
            payload,
            level,
        };
        
        setLogs(prevLogs => [...prevLogs, newLog]);
    }, [settings]);

    const clearLogs = useCallback(() => {
        setLogs([]);
    }, []);
    
    return (
        <LogContext.Provider value={{ logs, log, clearLogs }}>
            {children}
        </LogContext.Provider>
    );
};

export const useLog = () => {
    const context = useContext(LogContext);
    if (context === undefined) {
        throw new Error('useLog must be used within a LogProvider');
    }
    return context;
};