"use client";

import React from 'react';
import { useAppContext } from '@/components/providers/AppProvider';
import { CogIcon, UserCircleIcon } from './Icons';

interface StatusBarProps {
    onSettingsClick: () => void;
    onAgentConfigClick: () => void;
}

const StatusBar: React.FC<StatusBarProps> = ({ onSettingsClick, onAgentConfigClick }) => {
    const { status, currentConversation } = useAppContext();
    const model = currentConversation?.model || 'gemini-2.5-flash';

    return (
        <div className="bg-gray-900 text-gray-400 text-xs p-2 border-t border-gray-700 flex justify-between items-center flex-wrap gap-y-1">
            <div className="flex items-center gap-x-3 gap-y-1 flex-wrap">
               <span className="italic">{status.currentAction || 'Ready'}</span>
            </div>
            <div className="flex items-center gap-3">
                 <button onClick={onAgentConfigClick} disabled={!currentConversation} className="flex items-center gap-1 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed" title="Configure Agent">
                    <UserCircleIcon className="w-4 h-4" />
                    <span>Agent</span>
                </button>
                <button onClick={onSettingsClick} disabled={!currentConversation} className="flex items-center gap-1 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed" title="Configure Model">
                     <CogIcon className="w-4 h-4" />
                    <span className="truncate max-w-28">{model}</span>
                </button>
            </div>
        </div>
    );
};

export default StatusBar;