"use client";

import React, { useState } from 'react';
import type { Message as MessageType } from '../lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import MessageToolbar from './MessageToolbar';
import MessageFooter from './MessageFooter';

interface MessageProps {
    message: MessageType;
    onSummarize: (content: string) => void;
}

const Message: React.FC<MessageProps> = ({ message, onSummarize }) => {
    const isUser = message.role === 'user';
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleBookmark = () => {
        // This would call an API to update the bookmark status
        console.log("Bookmarking message:", message.id);
    };
    
    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex items-start gap-4 ${isUser ? 'justify-end' : ''}`}
        >
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center font-bold text-sm">
                    AI
                </div>
            )}
            <div className={`w-full max-w-xl`}>
                 <div className={`flex items-center text-xs text-gray-400 mb-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <MessageToolbar 
                        messageContent={message.content}
                        isBookmarked={message.isBookmarked}
                        isCollapsed={isCollapsed}
                        onCopy={handleCopy}
                        onBookmark={handleBookmark}
                        onSummarize={() => onSummarize(message.content)}
                        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
                    />
                </div>
                <div className={`prose-custom w-full p-3 rounded-lg ${isUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                    {!isCollapsed && (
                         <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                        </ReactMarkdown>
                    )}
                    {isCollapsed && <p className="italic text-gray-400">Message content collapsed...</p>}
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
