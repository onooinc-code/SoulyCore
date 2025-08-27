


"use client";

import React from 'react';
import { useAppContext } from '@/components/providers/AppProvider';
import { PlusIcon, MemoryIcon, UsersIcon, CodeIcon, BookmarkListIcon, SettingsIcon, LogIcon } from '@/components/Icons';
import { useLog } from './providers/LogProvider';

interface SidebarProps {
    setMemoryCenterOpen: (isOpen: boolean) => void;
    setContactsHubOpen: (isOpen: boolean) => void;
    setDevCenterOpen: (isOpen: boolean) => void;
    setGlobalSettingsOpen: (isOpen: boolean) => void;
    setBookmarksOpen: (isOpen: boolean) => void;
    setLogPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    setMemoryCenterOpen, 
    setContactsHubOpen, 
    setDevCenterOpen,
    setGlobalSettingsOpen,
    setBookmarksOpen,
    setLogPanelOpen,
}) => {
    const { conversations, currentConversation, setCurrentConversation, createNewConversation, settings } = useAppContext();
    const { log } = useLog();

    const handleNewChat = () => {
        log('User clicked "New Chat" button.');
        createNewConversation();
    };
    
    const handleSetConversation = (id: string) => {
        log('User selected a conversation.', { conversationId: id });
        setCurrentConversation(id);
    };

    const menuItems = [
        { label: 'Memory Center', icon: MemoryIcon, action: () => { log('User opened Memory Center.'); setMemoryCenterOpen(true); } },
        { label: 'Contacts Hub', icon: UsersIcon, action: () => { log('User opened Contacts Hub.'); setContactsHubOpen(true); } },
        { label: 'Bookmarks', icon: BookmarkListIcon, action: () => { log('User opened Bookmarks modal.'); setBookmarksOpen(true); } },
        { label: 'Dev Center', icon: CodeIcon, action: () => { log('User opened Dev Center.'); setDevCenterOpen(true); } },
        { label: 'Global Settings', icon: SettingsIcon, action: () => { log('User opened Global Settings.'); setGlobalSettingsOpen(true); } },
        { 
            label: 'Toggle Log Panel', 
            icon: LogIcon, 
            action: () => {
                log('User toggled the log panel.');
                setLogPanelOpen(prev => !prev);
            },
        },
    ];

    return (
        <div className="flex flex-col h-full bg-gray-800 p-3">
            <button
                onClick={handleNewChat}
                className="flex items-center justify-center w-full p-2 mb-4 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"
                title="New Chat (Cmd+N)"
            >
                <PlusIcon className="w-5 h-5 mr-2" />
                New Chat
            </button>
            <div className="space-y-2 mb-4 border-b border-gray-700 pb-4">
                 {menuItems.map(item => (
                     <button
                        key={item.label}
                        onClick={item.action}
                        className="flex items-center w-full p-2 text-sm font-semibold text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.label}
                    </button>
                 ))}
                 
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Recent</h2>
                <ul className="space-y-1">
                    {conversations.map(convo => (
                        <li key={convo.id}>
                            <button
                                onClick={() => handleSetConversation(convo.id)}
                                className={`w-full text-left p-2 rounded-md text-sm truncate ${currentConversation?.id === convo.id ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}
                            >
                                {convo.title}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="p-2 border-t border-gray-700">
                <p className="text-lg font-bold text-gray-100">SoulyCore</p>
                <p className="text-xs text-gray-400">v2.1 - Enhanced</p>
            </div>
        </div>
    );
};

export default Sidebar;