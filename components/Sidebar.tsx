"use client";

import React, { useState } from 'react';
import { useAppContext } from '@/components/providers/AppProvider';
import { PlusIcon, MemoryIcon, UsersIcon, CodeIcon, BookmarkListIcon, SettingsIcon, LogIcon, SparklesIcon, EditIcon, TrashIcon, SidebarLeftIcon, LightbulbIcon } from '@/components/Icons';
import { useLog } from './providers/LogProvider';
import { AnimatePresence, motion } from 'framer-motion';

interface SidebarProps {
    setMemoryCenterOpen: (isOpen: boolean) => void;
    setContactsHubOpen: (isOpen: boolean) => void;
    setDevCenterOpen: (isOpen: boolean) => void;
    setGlobalSettingsOpen: (isOpen: boolean) => void;
    setBookmarksOpen: (isOpen: boolean) => void;
    setLogPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isSidebarOpen: boolean;
    setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    setMemoryCenterOpen, 
    setContactsHubOpen, 
    setDevCenterOpen,
    setGlobalSettingsOpen,
    setBookmarksOpen,
    setLogPanelOpen,
    isSidebarOpen,
    setSidebarOpen,
}) => {
    const { 
        conversations, 
        currentConversation, 
        setCurrentConversation, 
        createNewConversation, 
        deleteConversation,
        updateConversationTitle,
        generateConversationTitle,
        isLoading,
        unreadConversations,
    } = useAppContext();
    const { log } = useLog();
    const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');

    const handleNewChat = () => {
        log('User clicked "New Chat" button.');
        createNewConversation();
    };
    
    const handleSetConversation = (id: string) => {
        if (editingConversationId === id) return;
        log('User selected a conversation.', { conversationId: id });
        setCurrentConversation(id);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this conversation and all its messages?')) {
            deleteConversation(id);
        }
    };

    const handleGenerateTitle = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        generateConversationTitle(id);
    };
    
    const handleEditTitle = (e: React.MouseEvent, id: string, currentTitle: string) => {
        e.stopPropagation();
        setEditingConversationId(id);
        setEditingTitle(currentTitle);
    };

    const handleSaveTitle = (id: string) => {
        if (editingTitle.trim()) {
            updateConversationTitle(id, editingTitle.trim());
        }
        setEditingConversationId(null);
        setEditingTitle('');
    };

    const menuItems = [
        { label: 'Memory Center', icon: MemoryIcon, action: () => { log('User opened Memory Center.'); setMemoryCenterOpen(true); }, tooltip: "Open the Memory Center to view and manage the AI's structured knowledge (entities). (Cmd+K)" },
        { label: 'Contacts Hub', icon: UsersIcon, action: () => { log('User opened Contacts Hub.'); setContactsHubOpen(true); }, tooltip: "Open the Contacts Hub to add, edit, and manage people and organizations the AI knows about." },
        { label: 'Dev Center', icon: CodeIcon, action: () => { log('User opened Dev Center.'); setDevCenterOpen(true); }, tooltip: "Open the SoulyDev Center for project documentation, feature tracking, and developer tools." },
    ];
    
    const toolbarItems = [
        { label: 'Bookmarks', icon: BookmarkListIcon, action: () => { log('User opened Bookmarks modal.'); setBookmarksOpen(true); }, tooltip: "View all your bookmarked messages from all conversations." },
        { label: 'Global Settings', icon: SettingsIcon, action: () => { log('User opened Global Settings.'); setGlobalSettingsOpen(true); }, tooltip: "Configure application-wide default settings for new conversations and models." },
        { label: 'Toggle Log Panel', icon: LogIcon, action: () => { log('User toggled the log panel.'); setLogPanelOpen(prev => !prev); }, tooltip: "Show or hide the developer log panel at the bottom of the screen." },
        { label: 'Hide Sidebar', icon: SidebarLeftIcon, action: () => { log('User hid sidebar.'); setSidebarOpen(false); }, tooltip: "Collapse the sidebar to focus on the conversation." },
        { label: 'Suggestions', icon: LightbulbIcon, action: () => alert('Feature coming soon!'), tooltip: "View AI-powered suggestions for improving your workflow (Coming Soon)." },
    ];

    return (
        <div className="flex flex-col h-full bg-gray-800 p-3 overflow-hidden">
            <button
                onClick={handleNewChat}
                className="flex items-center justify-center w-full p-2 mb-4 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors flex-shrink-0"
                title="Create a new, empty conversation with default settings. (Cmd+N)"
            >
                <PlusIcon className="w-5 h-5 mr-2" />
                New Chat
            </button>
            <div className="space-y-2 mb-4 border-b border-gray-700 pb-4 flex-shrink-0">
                 {menuItems.map(item => (
                     <button
                        key={item.label}
                        onClick={item.action}
                        className="flex items-center w-full p-2 text-sm font-semibold text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={item.tooltip}
                    >
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.label}
                    </button>
                 ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-1 min-h-0">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Recent</h2>
                <ul className="space-y-1">
                    {conversations.map(convo => {
                        const isUnread = unreadConversations.has(convo.id);
                        const isProcessing = isLoading && currentConversation?.id === convo.id;

                        return (
                            <li key={convo.id} className="relative group">
                                {editingConversationId === convo.id ? (
                                    <div className="flex items-center gap-3">
                                        <span className="w-2 flex-shrink-0"></span>
                                        <input
                                            type="text"
                                            value={editingTitle}
                                            onChange={(e) => setEditingTitle(e.target.value)}
                                            onBlur={() => handleSaveTitle(convo.id)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle(convo.id)}
                                            className="w-full p-2 rounded-md text-sm bg-gray-600 text-white outline-none ring-2 ring-indigo-500"
                                            autoFocus
                                        />
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleSetConversation(convo.id)}
                                        className={`w-full text-left p-2 rounded-md text-sm flex items-center gap-3 ${currentConversation?.id === convo.id ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}
                                    >
                                        <span className="w-2 flex-shrink-0 self-center">
                                            {isProcessing ? (
                                                <span className="block w-2 h-2 bg-indigo-400 rounded-full animate-pulse" title="Processing..."></span>
                                            ) : isUnread ? (
                                                <span className="block w-2 h-2 bg-indigo-400 rounded-full" title="Unread message"></span>
                                            ) : null}
                                        </span>
                                        <span className="truncate flex-1">{convo.title}</span>
                                    </button>
                                )}
                                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center bg-gray-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => handleGenerateTitle(e, convo.id)} className="p-1.5 text-gray-300 hover:text-indigo-400" title="Ask AI to generate a new title"><SparklesIcon className="w-4 h-4" /></button>
                                    <button onClick={(e) => handleEditTitle(e, convo.id, convo.title)} className="p-1.5 text-gray-300 hover:text-blue-400" title="Rename conversation"><EditIcon className="w-4 h-4" /></button>
                                    <button onClick={(e) => handleDelete(e, convo.id)} className="p-1.5 text-gray-300 hover:text-red-400" title="Delete conversation"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            </div>
            <div className="pt-2 border-t border-gray-700 flex-shrink-0">
                <div className="p-2">
                    <p className="text-lg font-bold text-gray-100">SoulyCore</p>
                    <p className="text-xs text-gray-400">v2.1 - Enhanced</p>
                </div>
                <div className="flex items-center justify-around p-2 bg-gray-900/50 rounded-lg">
                    {toolbarItems.map(item => (
                        <button key={item.label} onClick={item.action} title={item.tooltip} className="p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors">
                            <item.icon className="w-5 h-5" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;