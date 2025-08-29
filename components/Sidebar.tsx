"use client";

import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/components/providers/AppProvider';
import { PlusIcon, MemoryIcon, UsersIcon, CodeIcon, BookmarkListIcon, SettingsIcon, LogIcon, SparklesIcon, EditIcon, TrashIcon, SidebarLeftIcon, LightbulbIcon, PromptsIcon, SearchIcon, BrainIcon } from '@/components/Icons';
import { useLog } from './providers/LogProvider';
import { AnimatePresence, motion } from 'framer-motion';
import type { Conversation } from '@/lib/types';

// Helper function to format relative dates
const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
};

const getGroupKey = (date: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const aWeekAgo = new Date(today);
    aWeekAgo.setDate(aWeekAgo.getDate() - 7);
    const aMonthAgo = new Date(today);
    aMonthAgo.setMonth(aMonthAgo.getMonth() - 1);

    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (checkDate.getTime() === today.getTime()) return 'Today';
    if (checkDate.getTime() === yesterday.getTime()) return 'Yesterday';
    if (checkDate > aWeekAgo) return 'Previous 7 Days';
    if (checkDate > aMonthAgo) return 'Previous 30 Days';
    return 'Older';
};


interface SidebarProps {
    setMemoryCenterOpen: (isOpen: boolean) => void;
    setContactsHubOpen: (isOpen: boolean) => void;
    setDevCenterOpen: (isOpen: boolean) => void;
    setBrainCenterOpen: (isOpen: boolean) => void;
    setGlobalSettingsOpen: (isOpen: boolean) => void;
    setBookmarksOpen: (isOpen: boolean) => void;
    setPromptsHubOpen: (isOpen: boolean) => void;
    setLogPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isSidebarOpen: boolean;
    setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

// FIX: Removed `React.FC` to fix framer-motion type inference issue.
const Sidebar = ({ 
    setMemoryCenterOpen, 
    setContactsHubOpen, 
    setDevCenterOpen,
    setBrainCenterOpen,
    setGlobalSettingsOpen,
    setBookmarksOpen,
    setPromptsHubOpen,
    setLogPanelOpen,
    isSidebarOpen,
    setSidebarOpen,
}: SidebarProps) => {
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
    const [searchTerm, setSearchTerm] = useState('');

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
    
    const groupedAndFilteredConversations = useMemo(() => {
        const filtered = searchTerm
            ? conversations.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()))
            : conversations;

        return filtered.reduce((acc, convo) => {
            const groupKey = getGroupKey(new Date(convo.lastUpdatedAt));
            if (!acc[groupKey]) {
                acc[groupKey] = [];
            }
            acc[groupKey].push(convo);
            return acc;
        }, {} as Record<string, Conversation[]>);
    }, [conversations, searchTerm]);

    const groupOrder = ['Today', 'Yesterday', 'Previous 7 Days', 'Previous 30 Days', 'Older'];


    const menuItems = [
        { label: 'Brain Center', icon: BrainIcon, action: () => { log('User opened Brain Center.'); setBrainCenterOpen(true); }, tooltip: "Open the Brain Center to manage the AI's core cognitive functions." },
        { label: 'Memory Center', icon: MemoryIcon, action: () => { log('User opened Memory Center.'); setMemoryCenterOpen(true); }, tooltip: "Open the Memory Center to view and manage the AI's structured knowledge (entities). (Cmd+K)" },
        { label: 'Contacts Hub', icon: UsersIcon, action: () => { log('User opened Contacts Hub.'); setContactsHubOpen(true); }, tooltip: "Open the Contacts Hub to add, edit, and manage people and organizations the AI knows about." },
        { label: 'Prompts Hub', icon: PromptsIcon, action: () => { log('User opened Prompts Hub.'); setPromptsHubOpen(true); }, tooltip: "Open the Prompts Hub to create, manage, and reuse powerful prompt templates." },
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
            <div className="flex-shrink-0">
                <button
                    onClick={handleNewChat}
                    className="flex items-center justify-center w-full p-2 mb-4 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"
                    title="Create a new, empty conversation with default settings. (Cmd+N)"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    New Chat
                </button>
                <div className="relative mb-4">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 min-h-0">
                <AnimatePresence>
                {groupOrder.map(group => (
                    groupedAndFilteredConversations[group] && (
                        <motion.div key={group} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider my-2 px-2">{group}</h2>
                            <ul className="space-y-1">
                                {groupedAndFilteredConversations[group].map(convo => {
                                    const isUnread = unreadConversations.has(convo.id);
                                    const isProcessing = isLoading && currentConversation?.id === convo.id;

                                    return (
                                        <li key={convo.id} className="relative group">
                                            {editingConversationId === convo.id ? (
                                                <div className="flex items-center">
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
                                                    className={`w-full text-left p-2 rounded-md text-sm flex items-center justify-between ${currentConversation?.id === convo.id ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <span className="w-2 h-2 flex-shrink-0 self-center rounded-full" style={{
                                                            backgroundColor: isProcessing ? '#818cf8' : isUnread ? '#818cf8' : 'transparent',
                                                            animation: isProcessing ? 'pulse 1.5s infinite' : 'none'
                                                        }}></span>
                                                        <span className="truncate flex-1 font-medium text-gray-200">{convo.title}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2 group-hover:hidden">
                                                        {getRelativeTime(new Date(convo.lastUpdatedAt))}
                                                    </span>
                                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center bg-gray-700 rounded-full">
                                                        <button onClick={(e) => handleGenerateTitle(e, convo.id)} className="p-1.5 text-gray-300 hover:text-indigo-400" title="Generate new title"><SparklesIcon className="w-4 h-4" /></button>
                                                        <button onClick={(e) => handleEditTitle(e, convo.id, convo.title)} className="p-1.5 text-gray-300 hover:text-blue-400" title="Rename"><EditIcon className="w-4 h-4" /></button>
                                                        <button onClick={(e) => handleDelete(e, convo.id)} className="p-1.5 text-gray-300 hover:text-red-400" title="Delete"><TrashIcon className="w-4 h-4" /></button>
                                                    </div>
                                                </button>
                                            )}
                                        </li>
                                    )
                                })}
                            </ul>
                        </motion.div>
                    )
                ))}
                </AnimatePresence>
            </div>
            <div className="pt-2 border-t border-gray-700 flex-shrink-0">
                 <div className="space-y-2 my-2">
                     {menuItems.map(item => (
                         <button
                            key={item.label}
                            onClick={item.action}
                            className="flex items-center w-full p-2 text-sm font-semibold text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                            title={item.tooltip}
                        >
                            <item.icon className="w-5 h-5 mr-3 text-gray-400" />
                            {item.label}
                        </button>
                     ))}
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