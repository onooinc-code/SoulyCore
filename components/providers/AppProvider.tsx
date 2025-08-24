"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Conversation, Message } from '@/lib/types';

export interface IStatus {
  currentAction: string;
  error: string | null;
}

interface AppContextType {
    conversations: Conversation[];
    currentConversation: Conversation | null;
    messages: Message[];
    setCurrentConversation: (conversationId: string | null) => void;
    createNewConversation: () => Promise<void>;
    addMessage: (message: Omit<Message, 'id' | 'createdAt' | 'conversationId'>) => Promise<{aiResponse: string | null, suggestion: string | null}>;
    loadConversations: () => Promise<void>;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    status: IStatus;
    setStatus: (status: Partial<IStatus>) => void;
    clearError: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setBaseStatus] = useState<IStatus>({
        currentAction: '',
        error: null,
    });

    const setStatus = (newStatus: Partial<IStatus>) => {
        setBaseStatus(prev => ({ ...prev, ...newStatus }));
    };

    const clearError = () => setStatus({ error: null });

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
    }, []);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

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
    }, []);

    const setCurrentConversationById = useCallback(async (conversationId: string | null) => {
        if (!conversationId) {
            setCurrentConversation(null);
            setMessages([]);
            return;
        }

        const convo = conversations.find(c => c.id === conversationId);
        if (convo) {
            setCurrentConversation(convo);
            await fetchMessages(conversationId);
        }
    }, [conversations, fetchMessages]);

    const createNewConversation = async () => {
        setCurrentConversation(null);
        setMessages([]);
    };

    const addMessage = async (message: Omit<Message, 'id' | 'createdAt' | 'conversationId'>) => {
        let conversationToUpdate = currentConversation;
        
        const optimisticUserMessage: Message = { ...message, id: crypto.randomUUID(), createdAt: new Date(), conversationId: 'temp' };
        setMessages(prev => [...prev, optimisticUserMessage]);

        try {
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

            const finalUserMessage: Message = { ...optimisticUserMessage, conversationId: conversationToUpdate.id };
            
            await fetch(`/api/conversations/${conversationToUpdate.id}/messages`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ message: finalUserMessage }),
            });
            
            // Now call the chat API with the updated messages list
            const updatedMessages = [...messages, finalUserMessage];

            const chatRes = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: updatedMessages, conversation: conversationToUpdate })
            });
            if (!chatRes.ok) throw new Error('Failed to get AI response');
            const { response: aiResponse, suggestion } = await chatRes.json();
            
            if (aiResponse) {
                const aiMessage: Message = {
                    role: 'model',
                    content: aiResponse,
                    id: crypto.randomUUID(),
                    createdAt: new Date(),
                    conversationId: conversationToUpdate.id
                };
                 await fetch(`/api/conversations/${conversationToUpdate.id}/messages`, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ message: aiMessage }),
                });
                setMessages(prev => [...prev, aiMessage]);
            }
            
            // Refetch messages to ensure sync, especially for new conversations
            await fetchMessages(conversationToUpdate.id);
            return { aiResponse, suggestion };
            
        } catch (error) {
            setStatus({ error: (error as Error).message });
            console.error(error);
            setMessages(messages); // Revert optimistic update on error
            return { aiResponse: null, suggestion: null };
        }
    };

    return (
        <AppContext.Provider value={{
            conversations,
            currentConversation,
            messages,
            setCurrentConversation: setCurrentConversationById,
            createNewConversation,
            addMessage,
            loadConversations,
            isLoading,
            setIsLoading,
            status,
            setStatus,
            clearError,
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
