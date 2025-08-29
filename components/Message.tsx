

"use client";

import React, { useState, useEffect } from 'react';
import type { Message as MessageType } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import MessageToolbar from './MessageToolbar';
import MessageFooter from './MessageFooter';

interface MessageProps {
    message: MessageType;
    onSummarize: (content: string) => void;
    onToggleBookmark: (messageId: string) => void;
    onDelete: (messageId: string) => void;
    onUpdate: (messageId: string, newContent: string) => void;
    onRegenerate: (messageId: string) => void;
    onInspect: (messageId: string) => void;
}

type TextAlign = 'left' | 'right';
interface MessageSettings {
    collapsed: boolean;
    align: TextAlign;
}

// FIX: Removed React.FC to allow for proper type inference with framer-motion props.
const Message = ({ message, onSummarize, onToggleBookmark, onDelete, onUpdate, onRegenerate, onInspect }: MessageProps) => {
    const isUser = message.role === 'user';
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content);
    
    // State for message settings, persisted in local storage
    const [settings, setSettings] = useState<MessageSettings>({ collapsed: false, align: 'left' });

    useEffect(() => {
        try {
            const allSettings = JSON.parse(localStorage.getItem('messageSettings') || '{}');
            if (allSettings[message.id]) {
                setSettings(allSettings[message.id]);
            }
        } catch (error) {
            console.error("Failed to parse message settings from localStorage", error);
        }
    }, [message.id]);
    
    const updateSetting = <K extends keyof MessageSettings>(key: K, value: MessageSettings[K]) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        try {
            const allSettings = JSON.parse(localStorage.getItem('messageSettings') || '{}');
            allSettings[message.id] = newSettings;
            localStorage.setItem('messageSettings', JSON.stringify(allSettings));
        } catch (error) {
             console.error("Failed to save message settings to localStorage", error);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
    };

    const handleSaveEdit = () => {
        if (editedContent.trim() !== message.content) {
            onUpdate(message.id, editedContent.trim());
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditedContent(message.content);
        setIsEditing(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`group flex items-start gap-4 ${isUser ? 'justify-end' : ''}`}
        >
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center font-bold text-sm">
                    AI
                </div>
            )}
            <div className={`w-full max-w-2xl`}>
                 <div className={`flex items-center text-xs text-gray-400 mb-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <MessageToolbar 
                        isBookmarked={message.isBookmarked || false}
                        isCollapsed={settings.collapsed}
                        isUser={isUser}
                        onCopy={handleCopy}
                        onBookmark={() => onToggleBookmark(message.id)}
                        onSummarize={() => onSummarize(message.content)}
                        onToggleCollapse={() => updateSetting('collapsed', !settings.collapsed)}
                        onSetAlign={(align) => updateSetting('align', align)}
                        onDelete={() => onDelete(message.id)}
                        onEdit={() => setIsEditing(true)}
                        onRegenerate={() => onRegenerate(message.id)}
                        onInspect={() => onInspect(message.id)}
                    />
                </div>
                <div className={`prose-custom w-full p-4 rounded-lg ${isUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`} style={{ textAlign: settings.align }}>
                    {isEditing ? (
                        <div className="not-prose">
                            <textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="w-full p-2 bg-gray-800/50 rounded-md text-white resize-y border border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                rows={Math.max(3, editedContent.split('\n').length)}
                                autoFocus
                            />
                            <div className="flex gap-2 mt-2">
                                <button onClick={handleSaveEdit} className="px-3 py-1 text-xs bg-green-600 rounded hover:bg-green-500">Save</button>
                                <button onClick={handleCancelEdit} className="px-3 py-1 text-xs bg-gray-600 rounded hover:bg-gray-500">Cancel</button>
                            </div>
                        </div>
                    ) : !settings.collapsed ? (
                         <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                        </ReactMarkdown>
                    ) : (
                        <p className="italic text-gray-400">Message content collapsed...</p>
                    )}
                </div>
                 <div className={`flex items-center mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <MessageFooter message={message} />
                </div>
            </div>
             {isUser && (
                <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0 flex items-center justify-center font-bold text-sm">
                    You
                </div>
            )}
        </motion.div>
    );
};

export default Message;
