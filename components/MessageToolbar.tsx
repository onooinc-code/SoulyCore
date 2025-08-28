"use client";

import React, { useState } from 'react';
import { CopyIcon, BookmarkIcon, BookmarkFilledIcon, SummarizeIcon, CollapseIcon, ExpandIcon, CheckIcon, EditIcon, TrashIcon, RefreshIcon, TextAlignLeftIcon, TextAlignRightIcon } from './Icons';
import { useLog } from './providers/LogProvider';

interface MessageToolbarProps {
    isBookmarked: boolean;
    isCollapsed: boolean;
    isUser: boolean;
    onCopy: () => void;
    onBookmark: () => void;
    onSummarize: () => void;
    onToggleCollapse: () => void;
    onSetAlign: (align: 'left' | 'right') => void;
    onEdit: () => void;
    onDelete: () => void;
    onRegenerate: () => void;
}

const MessageToolbar: React.FC<MessageToolbarProps> = ({
    isBookmarked, isCollapsed, isUser, onCopy, onBookmark, onSummarize, onToggleCollapse, onSetAlign, onEdit, onDelete, onRegenerate
}) => {
    const [copied, setCopied] = useState(false);
    const { log } = useLog();

    const handleCopy = () => {
        log('User clicked "Copy message" button.');
        onCopy();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center gap-1 text-gray-400 bg-gray-800/50 rounded-full px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={handleCopy} className="p-1 hover:text-white" title="Copy">
                {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
            </button>
            <button onClick={onBookmark} className={`p-1 hover:text-yellow-400 ${isBookmarked ? 'text-yellow-400' : ''}`} title="Bookmark">
                {isBookmarked ? <BookmarkFilledIcon className="w-4 h-4" /> : <BookmarkIcon className="w-4 h-4" />}
            </button>
            <button onClick={onSummarize} className="p-1 hover:text-white" title="Summarize">
                <SummarizeIcon className="w-4 h-4" />
            </button>
            <button onClick={onToggleCollapse} className="p-1 hover:text-white" title={isCollapsed ? "Expand" : "Collapse"}>
                {isCollapsed ? <ExpandIcon className="w-4 h-4" /> : <CollapseIcon className="w-4 h-4" />}
            </button>
            
            <div className="w-px h-4 bg-gray-600 mx-1"></div>

            <button onClick={() => onSetAlign('left')} className="p-1 hover:text-white" title="Align Left"><TextAlignLeftIcon className="w-4 h-4"/></button>
            <button onClick={() => onSetAlign('right')} className="p-1 hover:text-white" title="Align Right"><TextAlignRightIcon className="w-4 h-4"/></button>

            <div className="w-px h-4 bg-gray-600 mx-1"></div>
            
            {isUser && (
                 <button onClick={onEdit} className="p-1 hover:text-white" title="Edit Message"><EditIcon className="w-4 h-4"/></button>
            )}
            <button onClick={onRegenerate} className="p-1 hover:text-white" title={isUser ? "Get New Response" : "Regenerate Response"}><RefreshIcon className="w-4 h-4"/></button>
            <button onClick={onDelete} className="p-1 hover:text-red-400" title="Delete Message"><TrashIcon className="w-4 h-4"/></button>
        </div>
    );
};

export default MessageToolbar;