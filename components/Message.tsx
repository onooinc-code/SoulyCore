
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

const WORD_COUNT_THRESHOLD = 250;

// FIX: Removed React.FC to allow for proper type inference with framer-motion props.
const Message = ({ message, onSummarize, onToggleBookmark, onDelete, onUpdate, onRegenerate, onInspect }: MessageProps) => {
    const isUser = message.role === 'user';
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content);

    // State for the summary
    const [summary, setSummary] = useState<string | null>(null);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    
    // State for message settings, persisted in local storage
    const [settings, setSettings] = useState<MessageSettings>({ collapsed: false, align: 'left' });

    const isLongMessage = !isUser && message.content.split(/\s+/).length > WORD_COUNT_THRESHOLD;

    // Effect to load settings and determine initial collapsed state for long messages
    useEffect(() => {
        try {
            const allSettings = JSON.parse(localStorage.getItem('messageSettings') || '{}');
            if (allSettings[message.id]) {
                setSettings(allSettings[message.id]);
            } else if (isLongMessage) {
                // It's a long message and we haven't seen it before, so collapse it by default.
                setSettings(prev => ({ ...prev, collapsed: true }));
            }
        } catch (error) {
            console.error("Failed to parse message settings from localStorage", error);
        }
    }, [message.id, isLongMessage]);

     // Effect to fetch summary when a long message is collapsed
    useEffect(() => {
        if (isLongMessage && settings.collapsed && !summary) {
            const fetchSummary = async () => {
                // 1. Check cache first
                try {
                    const cachedSummaries = JSON.parse(localStorage.getItem('messageSummaries') || '{}');
                    if (cachedSummaries[message.id]) {
                        setSummary(cachedSummaries[message.id]);
                        return;
                    }
                } catch (e) { console.error("Failed to parse summary cache", e); }

                // 2. If not in cache, fetch from API
                setIsSummaryLoading(true);
                try {
                    const res = await fetch('/api/summarize', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: message.content }),
                    });
                    if (!res.ok) throw new Error('Failed to fetch summary.');
                    const data = await res.json();
                    
                    if (data.summary) {
                        setSummary(data.summary);
                        // 3. Cache the new summary
                        try {
                             const cachedSummaries = JSON.parse(localStorage.getItem('messageSummaries') || '{}');
                             cachedSummaries[message.id] = data.summary;
                             localStorage.setItem('messageSummaries', JSON.stringify(cachedSummaries));
                        } catch(e) { console.error("Failed to cache summary", e); }
                    } else {
                        throw new Error("API returned an empty summary.");
                    }
                } catch (error) {
                    console.error("Summary fetch error:", error);
                    setSummary("Failed to generate summary.");
                } finally {
                    setIsSummaryLoading(false);
                }
            };
            fetchSummary();
        }
    }, [isLongMessage, settings.collapsed, message.id, message.content, summary]);

    
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

    const renderMessageContent = () => {
        if (isEditing) {
            return (
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
            );
        }

        if (isLongMessage && settings.collapsed) {
            if (isSummaryLoading) {
                return <p className="italic text-gray-400">Generating summary...</p>;
            }
            if (summary) {
                return <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>;
            }
            return <p className="italic text-gray-400">Message content collapsed...</p>;
        }
        
        return <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>;
    };

    const renderToggleCollapseButton = () => {
        if (!isLongMessage || isEditing) return null;

        const buttonText = settings.collapsed ? 'Show More' : 'Show Less';
        
        return (
            <div className={`mt-2 ${isUser ? 'text-right' : 'text-left'}`}>
                <button 
                    onClick={() => updateSetting('collapsed', !settings.collapsed)}
                    className="px-3 py-1 text-xs bg-gray-600/50 text-gray-300 rounded-full hover:bg-gray-600"
                >
                    {buttonText}
                </button>
            </div>
        );
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
                    {renderMessageContent()}
                </div>
                 {renderToggleCollapseButton()}
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
