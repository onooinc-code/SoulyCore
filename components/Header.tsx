
"use client";

import React, { useState } from 'react';
import { useAppContext } from './providers/AppProvider';
import { SparklesIcon, EditIcon, TrashIcon, SidebarLeftIcon, LogIcon, MinusIcon, PlusIcon } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';

// FIX: Removed `React.FC` to fix framer-motion type inference issue.
const Header = () => {
    const { 
        currentConversation, 
        deleteConversation,
        updateConversationTitle,
        generateConversationTitle,
        changeFontSize,
        isSidebarOpen,
        setSidebarOpen,
        isLogPanelOpen,
        setLogPanelOpen,
    } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('');

    const handleEdit = () => {
        if (!currentConversation) return;
        setTitle(currentConversation.title);
        setIsEditing(true);
    };

    const handleSave = () => {
        if (currentConversation && title.trim()) {
            updateConversationTitle(currentConversation.id, title.trim());
        }
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (currentConversation && window.confirm('Are you sure you want to delete this conversation?')) {
            deleteConversation(currentConversation.id);
        }
    };
    
    const handleGenerateTitle = () => {
        if (currentConversation) {
            generateConversationTitle(currentConversation.id);
        }
    };

    return (
        <motion.header 
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="relative w-full bg-gray-800/80 backdrop-blur-sm z-10 p-3 border-b border-gray-700 flex-shrink-0"
        >
            <div 
                className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                style={{
                    animation: 'move-glow 4s linear infinite'
                }}
            ></div>
            {/* FIX: Replaced duplicated and non-standard <style jsx> tags with a single standard <style> tag.
                This resolves the TypeScript error and removes the redundant CSS definition. */}
            <style>{`
                @keyframes move-glow {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
            <div className="max-w-4xl mx-auto flex justify-between items-center gap-4">
                <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                        {isEditing && currentConversation ? (
                             <motion.div key="editor" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: '100%' }} exit={{ opacity: 0, width: 0 }}>
                                <input 
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onBlur={handleSave}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                    className="bg-gray-700 text-white text-lg font-semibold w-full rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500"
                                    autoFocus
                                />
                            </motion.div>
                        ) : (
                            <motion.h1 
                                key="title" 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                className="text-lg font-semibold text-gray-200 truncate"
                            >
                                {currentConversation?.title || "SoulyCore"}
                            </motion.h1>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => setSidebarOpen(prev => !prev)} className="p-2 rounded-xl text-gray-200 transition-all duration-200 bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:scale-110" title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}>
                        <SidebarLeftIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => setLogPanelOpen(prev => !prev)} className="p-2 rounded-xl text-gray-200 transition-all duration-200 bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:scale-110" title={isLogPanelOpen ? "Hide Log Panel" : "Show Log Panel"}>
                        <LogIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => changeFontSize('decrease')} className="p-2 rounded-xl text-gray-200 transition-all duration-200 bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:scale-110" title="Decrease font size">
                        <MinusIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => changeFontSize('increase')} className="p-2 rounded-xl text-gray-200 transition-all duration-200 bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:scale-110" title="Increase font size">
                        <PlusIcon className="w-5 h-5" />
                    </button>

                    {currentConversation && (
                        <>
                            <div className="w-px h-6 bg-gray-700 mx-2"></div>
                            <button onClick={handleGenerateTitle} className="p-2 rounded-xl text-indigo-300 transition-all duration-200 bg-indigo-500/10 border border-indigo-400/20 backdrop-blur-sm hover:bg-indigo-500/20 hover:scale-110" title="Ask the AI to generate a new, concise title for this conversation based on its content.">
                                <SparklesIcon className="w-5 h-5" />
                            </button>
                            <button onClick={handleEdit} className="p-2 rounded-xl text-blue-300 transition-all duration-200 bg-blue-500/10 border border-blue-400/20 backdrop-blur-sm hover:bg-blue-500/20 hover:scale-110" title="Manually edit the title of this conversation.">
                                <EditIcon className="w-5 h-5" />
                            </button>
                            <button onClick={handleDelete} className="p-2 rounded-xl text-red-300 transition-all duration-200 bg-red-500/10 border border-red-400/20 backdrop-blur-sm hover:bg-red-500/20 hover:scale-110" title="Permanently delete this entire conversation and all its messages.">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </motion.header>
    );
};

export default Header;
