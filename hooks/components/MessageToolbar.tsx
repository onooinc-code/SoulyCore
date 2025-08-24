import React, { useState } from 'react';
import { CopyIcon, BookmarkIcon, SummarizeIcon, CollapseIcon, ExpandIcon, CheckIcon } from './Icons';

interface MessageToolbarProps {
    messageContent: string;
    isBookmarked: boolean;
    isCollapsed: boolean;
    onCopy: () => void;
    onBookmark: () => void;
    onSummarize: () => void;
    onToggleCollapse: () => void;
}

const MessageToolbar: React.FC<MessageToolbarProps> = ({
    messageContent, isBookmarked, isCollapsed, onCopy, onBookmark, onSummarize, onToggleCollapse
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        onCopy();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center gap-2 text-gray-400 bg-gray-800/50 rounded-full px-2 py-0.5">
            <button onClick={handleCopy} className="p-1 hover:text-white" title="Copy">
                {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
            </button>
            <button onClick={onBookmark} className={`p-1 hover:text-white ${isBookmarked ? 'text-yellow-400' : ''}`} title="Bookmark">
                <BookmarkIcon className="w-4 h-4" />
            </button>
            <button onClick={onSummarize} className="p-1 hover:text-white" title="Summarize">
                <SummarizeIcon className="w-4 h-4" />
            </button>
            <button onClick={onToggleCollapse} className="p-1 hover:text-white" title={isCollapsed ? "Expand" : "Collapse"}>
                {isCollapsed ? <ExpandIcon className="w-4 h-4" /> : <CollapseIcon className="w-4 h-4" />}
            </button>
        </div>
    );
};

export default MessageToolbar;