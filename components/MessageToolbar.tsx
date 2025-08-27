

"use client";

import React, { useState } from 'react';
import { CopyIcon, BookmarkIcon, SummarizeIcon, CollapseIcon, ExpandIcon, CheckIcon } from './Icons';
import { useLog } from './providers/LogProvider';

interface MessageToolbarProps {
    isBookmarked: boolean;
    isCollapsed: boolean;
    onCopy: () => void;
    onBookmark: () => void;
    onSummarize: () => void;
    onToggleCollapse: () => void;
}

const MessageToolbar: React.FC<MessageToolbarProps> = ({
    isBookmarked, isCollapsed, onCopy, onBookmark, onSummarize, onToggleCollapse
}) => {
    const [copied, setCopied] = useState(false);
    const { log } = useLog();

    const handleCopy = () => {
        log('User clicked "Copy message" button.');
        onCopy();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleBookmark = () => {
        log('User clicked "Bookmark message" button.', { currentStatus: isBookmarked });
        onBookmark();
    };
    
    const handleSummarize = () => {
        log('User clicked "Summarize message" button.');
        onSummarize();
    };

    const handleToggleCollapse = () => {
        log('User toggled message collapse.', { currentStatus: isCollapsed });
        onToggleCollapse();
    };

    return (
        <div className="flex items-center gap-2 text-gray-400 bg-gray-800/50 rounded-full px-2 py-0.5">
            <button onClick={handleCopy} className="p-1 hover:text-white" title="Copy">
                {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
            </button>
            <button onClick={handleBookmark} className={`p-1 hover:text-white ${isBookmarked ? 'text-yellow-400' : ''}`} title="Bookmark">
                <BookmarkIcon className="w-4 h-4" />
            </button>
            <button onClick={handleSummarize} className="p-1 hover:text-white" title="Summarize">
                <SummarizeIcon className="w-4 h-4" />
            </button>
            <button onClick={handleToggleCollapse} className="p-1 hover:text-white" title={isCollapsed ? "Expand" : "Collapse"}>
                {isCollapsed ? <ExpandIcon className="w-4 h-4" /> : <CollapseIcon className="w-4 h-4" />}
            </button>
        </div>
    );
};

export default MessageToolbar;