
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SendIcon } from './Icons';
import LoadingIndicator from './LoadingIndicator';
import type { Contact } from '@/lib/types';
import { useAppContext } from '@/components/providers/AppProvider';

interface ChatInputProps {
    onSendMessage: (content: string, mentionedContacts: Contact[]) => void;
    isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
    const { setStatus } = useAppContext();
    const [content, setContent] = useState('');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionedContacts, setMentionedContacts] = useState<Contact[]>([]);
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const fetchContacts = useCallback(async () => {
        try {
            const res = await fetch('/api/contacts');
            if (!res.ok) throw new Error('Failed to fetch contacts');
            const data = await res.json();
            setContacts(data);
        } catch (error) {
            setStatus({ error: 'Could not load contacts for @mentions.' });
            console.error(error);
        }
    }, [setStatus]);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);
    
    const updateMentionedContacts = (text: string) => {
        const mentionRegex = /@(\w+)/g;
        const currentMentions = new Set(Array.from(text.matchAll(mentionRegex)).map(match => match[1].toLowerCase()));
        const newMentionedContacts = contacts.filter(c => currentMentions.has(c.name.toLowerCase()));
        setMentionedContacts(newMentionedContacts);
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setContent(value);
        updateMentionedContacts(value);
        
        const cursorPosition = e.target.selectionStart;
        const textUpToCursor = value.substring(0, cursorPosition);
        const mentionMatch = textUpToCursor.match(/@(\w*)$/);

        if (mentionMatch) {
            setShowMentions(true);
            setMentionQuery(mentionMatch[1].toLowerCase());
        } else {
            setShowMentions(false);
        }
    };
    
    const handleMentionSelect = (name: string) => {
        const cursorPosition = textareaRef.current?.selectionStart || content.length;
        const textUpToCursor = content.substring(0, cursorPosition);
        const newContent = textUpToCursor.replace(/@\w*$/, `@${name} `) + content.substring(cursorPosition);
        
        setContent(newContent);
        updateMentionedContacts(newContent);
        setShowMentions(false);
        textareaRef.current?.focus();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSendMessage(content, mentionedContacts);
        setContent('');
        setMentionedContacts([]);
        setShowMentions(false);
    };

    const filteredContacts = contacts.filter(c => c.name.toLowerCase().startsWith(mentionQuery));

    return (
        <>
        <div className="p-4 bg-gray-800 border-t border-gray-700">
            {showMentions && filteredContacts.length > 0 && (
                <div className="absolute bottom-full left-4 right-4 mb-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                    {filteredContacts.map(contact => (
                        <button
                            key={contact.id}
                            onClick={() => handleMentionSelect(contact.name)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                        >
                            {contact.name} <span className="text-gray-500">- {contact.company || contact.email}</span>
                        </button>
                    ))}
                </div>
            )}
            <form onSubmit={handleSubmit} className="flex items-start space-x-4">
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleContentChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        placeholder="Type your message... use @ to mention contacts."
                        className="w-full p-2 pr-24 bg-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        rows={1}
                        disabled={isLoading}
                    />
                    {mentionedContacts.length > 0 && (
                         <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-500/50 text-indigo-200 text-xs px-2 py-1 rounded-full">
                            Context: {mentionedContacts.map(c => c.name).join(', ')}
                        </div>
                    )}
                </div>
                <button
                    type="submit"
                    className="p-3 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                    disabled={isLoading || !content.trim()}
                >
                    <SendIcon className="w-5 h-5" />
                </button>
            </form>
        </div>
        {isLoading && <LoadingIndicator />}
        </>
    );
};

export default ChatInput;
