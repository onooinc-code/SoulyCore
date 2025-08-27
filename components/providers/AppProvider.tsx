"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Conversation, Message, Contact, AppSettings } from '@/lib/types';
import { useLog } from './LogProvider';

export interface IStatus {
  currentAction: string;
  error: string | null;
}

interface AppContextType {
    conversations: Conversation[];
    currentConversation: Conversation | null;
    messages: Message[];
    setCurrentConversation: (conversationId: string | null) => void;
    updateCurrentConversation: (updatedData: Partial<Conversation>) => void;
    createNewConversation: () => Promise<void>;
    addMessage: (message: Omit<Message, 'id' | 'createdAt' | 'conversationId'>, mentionedContacts?: Contact[]) => Promise<{aiResponse: string | null, suggestion: string | null}>;
    toggleBookmark: (messageId: string) => Promise<void>;
    loadConversations: () => Promise<void>;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    status: IStatus;
    setStatus: (status: Partial<IStatus>) => void;
    clearError: () => void;
    settings: AppSettings | null;
    loadSettings: () => Promise<void>;
    setSettings: React.Dispatch<React.SetStateAction<AppSettings | null>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setBaseStatus] = useState<IStatus>({ currentAction: '', error: null });
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const { log, setLoggingEnabled } = useLog();

    // Effect to update the LogProvider's setting whenever the app's settings are loaded or changed.
    useEffect(() => {
        if (settings) {
            setLoggingEnabled(settings.enableDebugLog.enabled);
        }
    }, [settings, setLoggingEnabled]);

    const setStatus = useCallback((newStatus: Partial<IStatus>) => {
        setBaseStatus(prev => ({ ...prev, ...newStatus }));
    }, []);

    const clearError = useCallback(() => setStatus({ error: null }), [setStatus]);
    
    const loadSettings = useCallback(async () => {
        log('Attempting to load global settings...');
        try {
            const res = await fetch('/api/settings');
            if (!res.ok) throw new Error("Failed to fetch settings.");
            const appSettings = await res.json();
            setSettings(appSettings);
            log('Global settings loaded successfully.', appSettings);
            return appSettings;
        } catch (error) {
             const errorMessage = (error as Error).message;
             setStatus({ error: errorMessage });
             log('Failed to load global settings.', { error: errorMessage }, 'error');
             console.error(error);
        }
    }, [setStatus, log]);

    const loadConversations = useCallback(async () => {
        log('Fetching conversation list...');
        try {
            const response = await fetch('/api/conversations');
            if (!response.ok) throw new Error('Failed to fetch conversations');
            const convos = await response.json();
            setConversations(convos);
            log(`Successfully fetched ${convos.length} conversations.`);
        } catch (error) {
            const errorMessage = 'Could not load conversations.';
            setStatus({ error: errorMessage });
            log(errorMessage, { details: (error as Error).message }, 'error');
            console.error(error);
        }
    }, [setStatus, log]);

    useEffect(() => {
        loadConversations();
        loadSettings();
    }, [loadConversations, loadSettings]);

    const fetchMessages = useCallback(async (conversationId: string) => {
        log(`Fetching messages for conversation: ${conversationId}`);
        try {
            const response = await fetch(`/api/conversations/${conversationId}/messages`);
             if (!response.ok) throw new Error('Failed to fetch messages');
            const msgs = await response.json();
            setMessages(msgs);
            log(`Successfully fetched ${msgs.length} messages.`);
        } catch (error) {
             const errorMessage = 'Could not load messages for this chat.';
             setStatus({ error: errorMessage });
             log(errorMessage, { conversationId, details: (error as Error).message }, 'error');
             console.error(error);
        }
    }, [setStatus, log]);

    const setCurrentConversationById = useCallback(async (conversationId: string | null) => {
        if (!conversationId) {
            log('Clearing current conversation.');
            setCurrentConversation(null);
            setMessages([]);
            return;
        }

        log(`Setting current conversation to: ${conversationId}`);
        const findAndSetConvo = (convos: Conversation[]) => {
            const convo = convos.find(c => c.id === conversationId);
            if (convo) {
                setCurrentConversation(convo);
                fetchMessages(conversationId);
                return true;
            }
            return false;
        }

        if (!findAndSetConvo(conversations)) {
            log('Conversation not in cache, reloading conversation list.');
            await loadConversations();
            // Need to fetch fresh conversations to find the new one
            const freshResponse = await fetch('/api/conversations');
            const freshConvos = await freshResponse.json();
            findAndSetConvo(freshConvos);
        }
    }, [conversations, fetchMessages, loadConversations, log]);

    const updateCurrentConversation = useCallback((updatedData: Partial<Conversation>) => {
        if (currentConversation) {
            log('Updating current conversation settings in state.', updatedData);
            const newConversation = { ...currentConversation, ...updatedData };
            setCurrentConversation(newConversation);
            setConversations(convos => convos.map(c => c.id === newConversation.id ? newConversation : c));
        }
    }, [currentConversation, log]);

    const createNewConversation = useCallback(async () => {
        log('Creating new conversation.');
        setCurrentConversation(null);
        setMessages([]);
    }, [log]);

    const addMessage = useCallback(async (message: Omit<Message, 'id' | 'createdAt' | 'conversationId'>, mentionedContacts?: Contact[]) => {
        setIsLoading(true);
        setStatus({ currentAction: "Processing...", error: null });
        log('Starting addMessage process.', { message, mentionedContacts });

        const optimisticUserMessage: Message = { 
            ...message, 
            id: crypto.randomUUID(), 
            createdAt: new Date(), 
            conversationId: currentConversation?.id || 'temp'
        };
        setMessages(prev => [...prev, optimisticUserMessage]);
        log('Optimistically added user message to UI.', optimisticUserMessage);

        try {
            let conversationToUpdate = currentConversation;
            
            if (!conversationToUpdate) {
                log('No active conversation, creating a new one.');
                const res = await fetch('/api/conversations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: 'New Chat' })
                });
                if (!res.ok) throw new Error('Failed to create conversation');
                const newConversation = await res.json();
                conversationToUpdate = newConversation;
                setCurrentConversation(newConversation);
                await loadConversations();
                log('Successfully created and set new conversation.', newConversation);
            }
            
            if (!conversationToUpdate) throw new Error("Conversation could not be established.");

            const finalUserMessage: Message = { ...optimisticUserMessage, conversationId: conversationToUpdate.id };
            
            log('Saving user message to DB...');
            const userMsgRes = await fetch(`/api/conversations/${conversationToUpdate.id}/messages`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ message: finalUserMessage }),
            });
            if (!userMsgRes.ok) throw new Error("Failed to save your message.");
            const savedUserMessage = await userMsgRes.json();
            log('User message saved successfully.', savedUserMessage);
            
            setMessages(prev => prev.map(m => m.id === optimisticUserMessage.id ? savedUserMessage : m));
            
            const updatedMessagesHistory = [...messages.filter(m => m.id !== optimisticUserMessage.id), savedUserMessage];

            const chatApiPayload = { 
                messages: updatedMessagesHistory, 
                conversation: conversationToUpdate,
                mentionedContacts,
            };
            log('Sending request to /api/chat', chatApiPayload);
            const chatRes = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(chatApiPayload)
            });
            if (!chatRes.ok) {
                 const errorData = await chatRes.json();
                 throw new Error(errorData.error || 'Failed to get AI response');
            }
            const { response: aiResponse, suggestion } = await chatRes.json();
            log('Received response from /api/chat.', { aiResponse, suggestion });
            
            if (aiResponse) {
                const aiMessageData: Omit<Message, 'id' | 'createdAt' | 'conversationId'> = {
                    role: 'model',
                    content: aiResponse,
                    tokenCount: Math.ceil(aiResponse.length / 4), // Estimate token count
                };
                log('Saving AI message to DB...');
                 const aiMsgRes = await fetch(`/api/conversations/${conversationToUpdate.id}/messages`, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ message: aiMessageData }),
                });
                if (!aiMsgRes.ok) throw new Error("Failed to save AI's message.");
                const savedAiMessage = await aiMsgRes.json();
                log('AI message saved successfully.', savedAiMessage);
                setMessages(prev => [...prev, savedAiMessage!]);
            }
            
            return { aiResponse, suggestion };
            
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage, currentAction: "Error" });
            log('Error in addMessage process.', { error: errorMessage }, 'error');
            console.error(error);
            setMessages(prev => prev.filter(m => m.id !== optimisticUserMessage.id));
            return { aiResponse: null, suggestion: null };
        } finally {
            setIsLoading(false);
            setStatus({ currentAction: "" });
        }
    }, [currentConversation, loadConversations, messages, setStatus, log]);

    const toggleBookmark = useCallback(async (messageId: string) => {
        setStatus({ currentAction: "Updating bookmark..." });
        log(`Toggling bookmark for message: ${messageId}`);
        try {
            const res = await fetch(`/api/messages/${messageId}/bookmark`, { method: 'PUT' });
            if (!res.ok) throw new Error('Failed to toggle bookmark status.');
            const updatedMessage = await res.json();
            
            setMessages(prev => prev.map(m => m.id === messageId ? updatedMessage : m));
            log('Bookmark toggled successfully.', { messageId, newStatus: updatedMessage.isBookmarked });
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log('Failed to toggle bookmark.', { messageId, error: errorMessage }, 'error');
            console.error(error);
        } finally {
            setStatus({ currentAction: "" });
        }
    }, [setStatus, log]);

    return (
        <AppContext.Provider value={{
            conversations,
            currentConversation,
            messages,
            setCurrentConversation: setCurrentConversationById,
            updateCurrentConversation,
            createNewConversation,
            addMessage,
            toggleBookmark,
            loadConversations,
            isLoading,
            setIsLoading,
            status,
            setStatus,
            clearError,
            settings,
            loadSettings,
            setSettings,
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};