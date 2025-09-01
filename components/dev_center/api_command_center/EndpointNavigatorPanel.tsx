
"use client";

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ApiEndpoint } from '@/lib/types';
import StatusIndicator from './StatusIndicator';
import { ServerIcon } from '@/components/Icons';

interface EndpointNavigatorPanelProps {
    endpoints: ApiEndpoint[];
    onSelectEndpoint: (endpoint: ApiEndpoint) => void;
    selectedEndpointId: string | null;
}

const EndpointNavigatorPanel = ({ endpoints, onSelectEndpoint, selectedEndpointId }: EndpointNavigatorPanelProps) => {
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

    // FIX: Used the generic parameter on `reduce` to improve type inference. This ensures
    // TypeScript correctly understands that `groupedEndpoints` is a record of string to `ApiEndpoint[]`,
    // resolving subsequent errors where properties like `.length` and `.map` were not found on type 'unknown'.
    const groupedEndpoints = useMemo(() => {
        return endpoints.reduce<Record<string, ApiEndpoint[]>>((acc, endpoint) => {
            const groupName = endpoint.group_name;
            if (!acc[groupName]) {
                acc[groupName] = [];
            }
            acc[groupName].push(endpoint);
            return acc;
        }, {});
    }, [endpoints]);
    
    // Default all groups to open on first render
    useState(() => {
        const initialOpenState = Object.keys(groupedEndpoints).reduce((acc, groupName) => {
            acc[groupName] = true;
            return acc;
        }, {} as Record<string, boolean>);
        setOpenGroups(initialOpenState);
    });

    const toggleGroup = (groupName: string) => {
        setOpenGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
    };

    const methodColorMap: Record<string, string> = {
        'GET': 'text-green-400',
        'POST': 'text-blue-400',
        'PUT': 'text-yellow-400',
        'DELETE': 'text-red-400',
    };
    
    return (
        <div className="h-full flex flex-col">
            <h3 className="text-lg font-bold p-4 flex-shrink-0">API Endpoints</h3>
            <div className="flex-1 overflow-y-auto pr-2">
                {Object.entries(groupedEndpoints).sort(([a], [b]) => a.localeCompare(b)).map(([groupName, endpointsInGroup]) => (
                    <div key={groupName} className="mb-2">
                        <button onClick={() => toggleGroup(groupName)} className="w-full flex items-center justify-between p-2 rounded-md hover:bg-gray-700">
                            <div className="flex items-center gap-2">
                                <ServerIcon className="w-4 h-4 text-gray-400" />
                                <span className="font-semibold text-sm capitalize">{groupName}</span>
                            </div>
                            <span className="text-xs text-gray-500">{endpointsInGroup.length}</span>
                        </button>
                        <AnimatePresence>
                            {openGroups[groupName] && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="pl-4 mt-1 space-y-1 overflow-hidden"
                                >
                                    {endpointsInGroup.map(endpoint => (
                                        <button 
                                            key={endpoint.id}
                                            onClick={() => onSelectEndpoint(endpoint)}
                                            className={`w-full text-left p-2 rounded-md flex items-center gap-3 text-sm ${selectedEndpointId === endpoint.id ? 'bg-indigo-600/20 text-indigo-300' : 'hover:bg-gray-700/50'}`}
                                        >
                                            <StatusIndicator status={endpoint.last_test_status} />
                                            <span className={`font-mono font-bold w-14 flex-shrink-0 ${methodColorMap[endpoint.method] || 'text-gray-400'}`}>{endpoint.method}</span>
                                            <span className="truncate">{endpoint.path}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EndpointNavigatorPanel;