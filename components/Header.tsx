"use client";

import React, { useState } from 'react';
import { useAppContext } from './providers/AppProvider';
import { SparklesIcon, EditIcon, TrashIcon } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
    const { 
        currentConversation, 
        deleteConversation,
        updateConversationTitle,
        generateConversationTitle 
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
            <style jsx global>{`
                @keyframes move-glow {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
            <div className="max-w-4xl mx-auto flex justify-between items-center">
                <AnimatePresence mode="wait">
                    {isEditing && currentConversation ? (
                         <motion.div key="editor" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: '60%' }} exit={{ opacity: 0, width: 0 }}>
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

                {currentConversation && (
                    <div className="flex items-center gap-2">
                        <button onClick={handleGenerateTitle} className="p-2 text-gray-400 hover:text-indigo-400 rounded-full hover:bg-gray-700" title="Ask the AI to generate a new, concise title for this conversation based on its content.">
                            <SparklesIcon className="w-5 h-5" />
                        </button>
                        <button onClick={handleEdit} className="p-2 text-gray-400 hover:text-blue-400 rounded-full hover:bg-gray-700" title="Manually edit the title of this conversation.">
                            <EditIcon className="w-5 h-5" />
                        </button>
                        <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-400 rounded-full hover:bg-gray-700" title="Permanently delete this entire conversation and all its messages.">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </motion.header>
    );
};

export default Header;