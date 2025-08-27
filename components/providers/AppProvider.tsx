"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Conversation, Message, Contact, AppSettings } from '@/lib/types';

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

    const setStatus = useCallback((newStatus: Partial<IStatus>) => {
        setBaseStatus(prev => ({ ...prev, ...newStatus }));
    }, []);

    const clearError = useCallback(() => setStatus({ error: null }), [setStatus]);
    
    const loadSettings = useCallback(async () => {
        try {
            const res = await fetch('/api/settings');
            if (!res.ok) throw new Error("Failed to fetch settings.");
            const appSettings = await res.json();
            setSettings(appSettings);
            return appSettings;
        } catch (error) {
             setStatus({ error: (error as Error).message });
             console.error(error);
        }
    }, [setStatus]);

    const loadConversations = useCallback(async () => {
        try {
            const response = await fetch('/api/conversations');
            if (!response.ok) throw new Error('Failed to fetch conversations');
            const convos = await response.json();
            setConversations(convos);
        } catch (error) {
            setStatus({ error: 'Could not load conversations.' });
            console.error(error);
        }
    }, [setStatus]);

    useEffect(() => {
        loadConversations();
        loadSettings();
    }, [loadConversations, loadSettings]);

    const fetchMessages = useCallback(async (conversationId: string) => {
        try {
            const response = await fetch(`/api/conversations/${conversationId}/messages`);
             if (!response.ok) throw new Error('Failed to fetch messages');
            const msgs = await response.json();
            setMessages(msgs);
        } catch (error) {
             setStatus({ error: 'Could not load messages for this chat.' });
             console.error(error);
        }
    }, [setStatus]);

    const setCurrentConversationById = useCallback(async (conversationId: string | null) => {
        if (!conversationId) {
            setCurrentConversation(null);
            setMessages([]);
            return;
        }

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
            await loadConversations();
            // Need to fetch fresh conversations to find the new one
            const freshResponse = await fetch('/api/conversations');
            const freshConvos = await freshResponse.json();
            findAndSetConvo(freshConvos);
        }
    }, [conversations, fetchMessages, loadConversations]);

    const updateCurrentConversation = useCallback((updatedData: Partial<Conversation>) => {
        if (currentConversation) {
            const newConversation = { ...currentConversation, ...updatedData };
            setCurrentConversation(newConversation);
            setConversations(convos => convos.map(c => c.id === newConversation.id ? newConversation : c));
        }
    }, [currentConversation]);

    const createNewConversation = useCallback(async () => {
        setCurrentConversation(null);
        setMessages([]);
    }, []);

    const addMessage = useCallback(async (message: Omit<Message, 'id' | 'createdAt' | 'conversationId'>, mentionedContacts?: Contact[]) => {
        setIsLoading(true);
        setStatus({ currentAction: "Processing...", error: null });

        const optimisticUserMessage: Message = { 
            ...message, 
            id: crypto.randomUUID(), 
            createdAt: new Date(), 
            conversationId: currentConversation?.id || 'temp'
        };
        setMessages(prev => [...prev, optimisticUserMessage]);

        try {
            let conversationToUpdate = currentConversation;
            
            if (!conversationToUpdate) {
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
            }
            
            if (!conversationToUpdate) throw new Error("Conversation could not be established.");

            const finalUserMessage: Message = { ...optimisticUserMessage, conversationId: conversationToUpdate.id };
            
            const userMsgRes = await fetch(`/api/conversations/${conversationToUpdate.id}/messages`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ message: finalUserMessage }),
            });
            if (!userMsgRes.ok) throw new Error("Failed to save your message.");
            const savedUserMessage = await userMsgRes.json();
            
            setMessages(prev => prev.map(m => m.id === optimisticUserMessage.id ? savedUserMessage : m));
            
            const updatedMessagesHistory = [...messages.filter(m => m.id !== optimisticUserMessage.id), savedUserMessage];

            const chatRes = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    messages: updatedMessagesHistory, 
                    conversation: conversationToUpdate,
                    mentionedContacts,
                })
            });
            if (!chatRes.ok) {
                 const errorData = await chatRes.json();
                 throw new Error(errorData.error || 'Failed to get AI response');
            }
            const { response: aiResponse, suggestion } = await chatRes.json();
            
            if (aiResponse) {
                const aiMessageData: Omit<Message, 'id' | 'createdAt' | 'conversationId'> = {
                    role: 'model',
                    content: aiResponse,
                    tokenCount: Math.ceil(aiResponse.length / 4), // Estimate token count
                };
                 const aiMsgRes = await fetch(`/api/conversations/${conversationToUpdate.id}/messages`, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ message: aiMessageData }),
                });
                if (!aiMsgRes.ok) throw new Error("Failed to save AI's message.");
                const savedAiMessage = await aiMsgRes.json();
                setMessages(prev => [...prev, savedAiMessage!]);
            }
            
            return { aiResponse, suggestion };
            
        } catch (error) {
            setStatus({ error: (error as Error).message, currentAction: "Error" });
            console.error(error);
            setMessages(prev => prev.filter(m => m.id !== optimisticUserMessage.id));
            return { aiResponse: null, suggestion: null };
        } finally {
            setIsLoading(false);
            setStatus({ currentAction: "" });
        }
    }, [currentConversation, loadConversations, messages, setStatus]);

    const toggleBookmark = useCallback(async (messageId: string) => {
        setStatus({ currentAction: "Updating bookmark..." });
        try {
            const res = await fetch(`/api/messages/${messageId}/bookmark`, { method: 'PUT' });
            if (!res.ok) throw new Error('Failed to toggle bookmark status.');
            const updatedMessage = await res.json();
            
            setMessages(prev => prev.map(m => m.id === messageId ? updatedMessage : m));

        } catch (error) {
            setStatus({ error: (error as Error).message });
            console.error(error);
        } finally {
            setStatus({ currentAction: "" });
        }
    }, [setStatus]);

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