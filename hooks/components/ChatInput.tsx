import React, { useState, useEffect } from 'react';
import { SendIcon } from './Icons';
import LoadingIndicator from './LoadingIndicator';
import { dbService } from '../context/db/db';
import type { Contact } from '../../types';

interface ChatInputProps {
    onSendMessage: (content: string) => void;
    isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
    const [content, setContent] = useState('');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');

    useEffect(() => {
        const fetchContacts = async () => {
            const allContacts = await dbService.contacts.getAll();
            setContacts(allContacts);
        };
        fetchContacts();
    }, []);

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setContent(value);
        
        const mentionMatch = value.match(/@(\w*)$/);
        if (mentionMatch) {
            setShowMentions(true);
            setMentionQuery(mentionMatch[1].toLowerCase());
        } else {
            setShowMentions(false);
        }
    };
    
    const handleMentionSelect = (name: string) => {
        const newContent = content.replace(/@\w*$/, `@${name} `);
        setContent(newContent);
        setShowMentions(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSendMessage(content);
        setContent('');
        setShowMentions(false);
    };

    const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(mentionQuery));

    return (
        <>
        <div className="p-4 bg-gray-800 border-t border-gray-700 relative">
            {showMentions && filteredContacts.length > 0 && (
                <div className="absolute bottom-full left-4 right-4 mb-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                    {filteredContacts.map(contact => (
                        <button
                            key={contact.id}
                            onClick={() => handleMentionSelect(contact.name)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                        >
                            {contact.name}
                        </button>
                    ))}
                </div>
            )}
            <form onSubmit={handleSubmit} className="flex items-center space-x-4">
                <textarea
                    value={content}
                    onChange={handleContentChange}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                        }
                    }}
                    placeholder="Type your message here... use @ to mention contacts."
                    className="flex-1 p-2 bg-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    rows={1}
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="p-3 bg-indigo-600 rounded-full text-white hover:bg-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
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