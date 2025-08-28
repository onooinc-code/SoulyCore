
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SendIcon, PaperclipIcon, XIcon, PromptsIcon } from './Icons';
import LoadingIndicator from './LoadingIndicator';
import type { Contact, Prompt } from '@/lib/types';
import { useAppContext } from '@/components/providers/AppProvider';
import { useLog } from './providers/LogProvider';
import dynamic from 'next/dynamic';

const FillPromptVariablesModal = dynamic(() => import('@/components/FillPromptVariablesModal'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading...</p></div>
});


interface ChatInputProps {
    onSendMessage: (content: string, mentionedContacts: Contact[]) => void;
    isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
    const { setStatus } = useAppContext();
    const { log } = useLog();
    const [content, setContent] = useState('');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionedContacts, setMentionedContacts] = useState<Contact[]>([]);
    const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
    
    const [isPromptsListOpen, setIsPromptsListOpen] = useState(false);
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [promptSearchTerm, setPromptSearchTerm] = useState('');

    const [variableModalState, setVariableModalState] = useState<{
        isOpen: boolean;
        prompt: Prompt | null;
        variables: string[];
    }>({ isOpen: false, prompt: null, variables: [] });


    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const promptsListRef = useRef<HTMLDivElement>(null);

    const fetchContacts = useCallback(async () => {
        try {
            log('Fetching contacts for @mentions...');
            const res = await fetch('/api/contacts');
            if (!res.ok) {
                let errorMsg = 'An unknown error occurred while fetching contacts.';
                try {
                    const errorData = await res.json();
                    errorMsg = errorData.error || `Server responded with status: ${res.status}`;
                } catch (e) { 
                    errorMsg = `Server responded with status: ${res.status} ${res.statusText}`;
                }
                throw new Error(errorMsg);
            }
            const { contacts } = await res.json();
            setContacts(contacts);
            log(`Successfully fetched ${contacts.length} contacts for @mentions.`);
        } catch (error) {
            const errorMessage = (error as Error).message;
            log('Failed to fetch contacts for @mentions.', { error: { message: errorMessage, stack: (error as Error).stack } }, 'error');
            setStatus({ error: 'Contacts for @mentions could not be loaded. Please check logs for details.' });
            console.error("Fetch contacts error:", error);
        }
    }, [setStatus, log]);
    
    const fetchPrompts = useCallback(async () => {
        if (prompts.length > 0 && isPromptsListOpen) return;
        try {
            log('Fetching prompts for launcher...');
            const res = await fetch('/api/prompts');
            if (!res.ok) throw new Error('Failed to fetch prompts');
            const data = await res.json();
            setPrompts(data);
            log(`Fetched ${data.length} prompts for launcher.`);
        } catch(error) {
             const errorMessage = (error as Error).message;
             log('Failed to fetch prompts for launcher.', { error: { message: errorMessage } }, 'error');
        }
    }, [isPromptsListOpen, prompts.length, log]);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (promptsListRef.current && !promptsListRef.current.contains(event.target as Node)) {
                setIsPromptsListOpen(false);
            }
        };

        if (isPromptsListOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isPromptsListOpen]);

    
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
        log('User selected @mention', { contactName: name });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            log('Image file selected by user.', { name: file.name, type: file.type, size: file.size });
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                setImageDataUrl(loadEvent.target?.result as string);
                log('Image file loaded as data URL.');
            };
            reader.readAsDataURL(file);
        }
        if (e.target) e.target.value = '';
    };

    const removeImage = () => {
        log('User removed attached image.');
        setImageDataUrl(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && !imageDataUrl) return;

        let messageContent = content;
        if (imageDataUrl) {
            // Using markdown format to embed the image data URL
            messageContent = `![user image](${imageDataUrl})\n\n${content}`;
        }
        
        log('User submitted message form.', { contentLength: content.length, mentionedContactsCount: mentionedContacts.length, hasImage: !!imageDataUrl });
        onSendMessage(messageContent, mentionedContacts);
        setContent('');
        setImageDataUrl(null);
        setMentionedContacts([]);
        setShowMentions(false);
    };

    const handlePromptSelect = (prompt: Prompt) => {
        const variableRegex = /{{\s*(\w+)\s*}}/g;
        const matches = [...prompt.content.matchAll(variableRegex)];
        const uniqueVariables = [...new Set(matches.map(match => match[1]))];

        if (uniqueVariables.length > 0) {
            log('User selected a prompt with dynamic variables.', { promptName: prompt.name, variables: uniqueVariables });
            setVariableModalState({ isOpen: true, prompt: prompt, variables: uniqueVariables });
            setIsPromptsListOpen(false);
        } else {
            log('User selected a simple prompt.', { promptName: prompt.name });
            setContent(prompt.content);
            setIsPromptsListOpen(false);
        }
        setPromptSearchTerm('');
        textareaRef.current?.focus();
    };
    
    const handleVariableSubmit = (filledPrompt: string) => {
        log('User submitted variables and populated chat input.');
        setContent(filledPrompt);
        setVariableModalState({ isOpen: false, prompt: null, variables: [] });
        textareaRef.current?.focus();
    };

    const filteredContacts = contacts.filter(c => c.name.toLowerCase().startsWith(mentionQuery));

    const filteredPrompts = prompts.filter(p => 
        p.name.toLowerCase().includes(promptSearchTerm.toLowerCase()) ||
        p.content.toLowerCase().includes(promptSearchTerm.toLowerCase())
    );

    return (
        <>
        <div className="p-4 bg-gray-800 border-t border-gray-700 relative">
             {showMentions && filteredContacts.length > 0 && (
                <div className="absolute bottom-full left-4 right-4 mb-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                    {filteredContacts.map(contact => (
                        <button key={contact.id} onClick={() => handleMentionSelect(contact.name)} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                            {contact.name} <span className="text-gray-500">- {contact.company || contact.email}</span>
                        </button>
                    ))}
                </div>
            )}
             {isPromptsListOpen && (
                <div ref={promptsListRef} className="absolute bottom-full left-4 right-4 mb-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20 flex flex-col">
                    <input 
                        type="text"
                        placeholder="Search prompts..."
                        value={promptSearchTerm}
                        onChange={e => setPromptSearchTerm(e.target.value)}
                        className="sticky top-0 p-2 bg-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        autoFocus
                    />
                    <ul className="flex-1 overflow-y-auto">
                        {filteredPrompts.length > 0 ? filteredPrompts.map(prompt => (
                            <li key={prompt.id}>
                                <button onClick={() => handlePromptSelect(prompt)} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                                    <strong className="block font-semibold">{prompt.name}</strong>
                                    <p className="text-xs text-gray-400 truncate">{prompt.content}</p>
                                </button>
                            </li>
                        )) : <li className="px-4 py-3 text-sm text-gray-500 text-center">No prompts found.</li>}
                    </ul>
                </div>
            )}
            {imageDataUrl && (
                <div className="relative w-20 h-20 mb-2">
                    <img src={imageDataUrl} alt="Upload preview" className="w-full h-full object-cover rounded-md" />
                    <button onClick={removeImage} className="absolute -top-2 -right-2 bg-gray-600 rounded-full p-0.5 text-white hover:bg-gray-500 z-10" title="Remove attached image">
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
            <form onSubmit={handleSubmit} className="flex items-start space-x-4">
                <button
                    type="button"
                    onClick={() => {
                        log('User toggled Prompts Launcher.');
                        const willBeOpen = !isPromptsListOpen;
                        setIsPromptsListOpen(willBeOpen);
                        if (willBeOpen) {
                            fetchPrompts();
                        }
                    }}
                    className="p-3 bg-gray-700 rounded-lg text-gray-400 hover:text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                    disabled={isLoading}
                    title="Use a saved prompt"
                >
                    <PromptsIcon className="w-5 h-5" />
                </button>
                <button 
                    type="button" 
                    onClick={() => {
                        log('User clicked "Attach file" button.');
                        fileInputRef.current?.click();
                    }}
                    className="p-3 bg-gray-700 rounded-lg text-gray-400 hover:text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                    disabled={isLoading || !!imageDataUrl}
                    title="Attach an image to your message. Disabled while an image is already attached or the AI is processing."
                >
                    <PaperclipIcon className="w-5 h-5" />
                </button>
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
                        placeholder="Type your message or add an image..."
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
                    disabled={isLoading || (!content.trim() && !imageDataUrl)}
                    title="Send your message to the AI. (Enter to send, Shift+Enter for new line)"
                >
                    <SendIcon className="w-5 h-5" />
                </button>
            </form>
        </div>
        {isLoading && <LoadingIndicator />}
        
        <FillPromptVariablesModal
            isOpen={variableModalState.isOpen}
            onClose={() => setVariableModalState({ isOpen: false, prompt: null, variables: [] })}
            prompt={variableModalState.prompt}
            variables={variableModalState.variables}
            onSubmit={handleVariableSubmit}
        />
        </>
    );
};

export default ChatInput;
