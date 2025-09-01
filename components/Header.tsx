
"use client";

import React, { useState } from 'react';
import { useAppContext } from './providers/AppProvider';
import { SparklesIcon, EditIcon, TrashIcon, SidebarLeftIcon, LogIcon, MinusIcon, PlusIcon } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';
import ToolbarButton from './ToolbarButton';

const Header = () => {
    const { 
        currentConversation, 
        deleteConversation,
        updateConversationTitle,
        generateConversationTitle,
        changeFontSize,
        isSidebarOpen,
        setSidebarOpen,
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
            className="relative w-full bg-gray-800/80 backdrop-blur-sm z-10 p-2 border-b border-gray-700/50 flex-shrink-0"
        >
            <div 
                className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                style={{
                    animation: 'move-glow 4s linear infinite'
                }}
            ></div>

            <div className="flex items-center justify-between w-full max-w-4xl mx-auto gap-4">
                {!isSidebarOpen && (
                    <div className="flex-shrink-0">
                        {/* FIX: Added missing child icon to ToolbarButton to satisfy prop requirements. */}
                        <ToolbarButton onClick={() => setSidebarOpen(true)} title="Show Sidebar" color="gray">
                            <SidebarLeftIcon className="w-5 h-5 transform rotate-180" />
                        </ToolbarButton>
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                        {isEditing ? (
                            <motion.div key="editing-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onBlur={handleSave}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                    className="w-full bg-gray-700 text-white rounded-md px-2 py-1 text-lg font-semibold"
                                    autoFocus
                                />
                            </motion.div>
                        ) : (
                            <motion.h1 
                                key="display-title" 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                className="text-lg font-semibold truncate text-gray-200 cursor-pointer"
                                onDoubleClick={handleEdit}
                                title="Double-click to rename"
                            >
                                {currentConversation?.title || 'New Conversation'}
                            </motion.h1>
                        )}
                    </AnimatePresence>
                </div>
                <div className="flex items-center justify-end gap-2 flex-shrink-0">
                    {currentConversation && (
                        <>
                            {/* FIX: Added missing child icon to ToolbarButton to satisfy prop requirements. */}
                            <ToolbarButton onClick={handleGenerateTitle} title="Generate new title with AI" color="purple">
                                <SparklesIcon className="w-5 h-5" />
                            </ToolbarButton>
                            {/* FIX: Added missing child icon to ToolbarButton to satisfy prop requirements. */}
                            <ToolbarButton onClick={handleEdit} title="Rename conversation" color="blue">
                                <EditIcon className="w-5 h-5" />
                            </ToolbarButton>
                            {/* FIX: Added missing child icon to ToolbarButton to satisfy prop requirements. */}
                            <ToolbarButton onClick={handleDelete} title="Delete conversation" color="red">
                                <TrashIcon className="w-5 h-5" />
                            </ToolbarButton>
                            <div className="w-px h-6 bg-gray-600 mx-1"></div>
                        </>
                    )}
                    {/* FIX: Added missing child icon to ToolbarButton to satisfy prop requirements. */}
                    <ToolbarButton onClick={() => changeFontSize('decrease')} title="Decrease font size" color="gray">
                        <MinusIcon className="w-5 h-5" />
                    </ToolbarButton>
                    {/* FIX: Added missing child icon to ToolbarButton to satisfy prop requirements. */}
                    <ToolbarButton onClick={() => changeFontSize('increase')} title="Increase font size" color="gray">
                        <PlusIcon className="w-5 h-5" />
                    </ToolbarButton>
                    {/* FIX: Added missing child icon to ToolbarButton to satisfy prop requirements. */}
                    <ToolbarButton onClick={() => setLogPanelOpen(prev => !prev)} title="Toggle Log Panel" color="cyan">
                        <LogIcon className="w-5 h-5" />
                    </ToolbarButton>
                </div>
            </div>
        </motion.header>
    );
};

export default Header;
