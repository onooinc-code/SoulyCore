import React from 'react';
import { useAppContext } from '../context/AppContext';
import { CogIcon, UserCircleIcon } from './Icons';

interface StatusBarProps {
    onSettingsClick: () => void;
    onAgentConfigClick: () => void;
}

const StatusBar: React.FC<StatusBarProps> = ({ onSettingsClick, onAgentConfigClick }) => {
    const { status, currentConversation } = useAppContext();

    const maskApiKey = (key: string) => {
        if (!key || key.length < 8) return 'Not Set';
        return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
    };

    return (
        <div className="bg-gray-900 text-gray-400 text-xs p-2 border-t border-gray-700 flex justify-between items-center flex-wrap gap-y-1">
            <div className="flex items-center gap-x-3 gap-y-1 flex-wrap">
                <span>Input Tokens: {status.inputTokens}</span>
                <span>Conv. Tokens: {status.conversationTokens}</span>
                <span>Conv. Msgs: {status.conversationMessages}</span>
                <span>Entities Sent: {status.sentEntityCount}</span>
                <span>Entities Extracted: {status.extractedEntityCount}</span>
            </div>
            <div className="flex items-center gap-3">
                 <button onClick={onAgentConfigClick} disabled={!currentConversation} className="flex items-center gap-1 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed" title="Configure Agent">
                    <UserCircleIcon className="w-4 h-4" />
                    <span>Agent</span>
                </button>
                <button onClick={onSettingsClick} className="flex items-center gap-1 hover:text-white" title="Open Settings">
                     <CogIcon className="w-4 h-4" />
                    <span className="truncate max-w-28">{status.model || '...'} | {maskApiKey(status.apiKey)}</span>
                </button>
            </div>
        </div>
    );
};

export default StatusBar;
