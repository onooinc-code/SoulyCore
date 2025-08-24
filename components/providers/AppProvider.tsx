"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Conversation, Message } from '../../lib/types';

export interface IStatus {
  inputTokens: number;
  conversationTokens: number;
  conversationMessages: number;
  model: string;
  currentAction: string;
}

interface AppContextType {
    conversations: Conversation[];
    currentConversation: Conversation | null;
    messages: Message[];
    setCurrentConversation: (conversationId: string | null) => void;
    createNewConversation: () => void;
    addMessage: (message: Omit<Message, 'id' | 'createdAt' | 'conversationId'>) => Promise<void>;
    loadConversations: () => Promise<void>;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    status: IStatus;
    setStatus: (status: Partial<IStatus>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setBaseStatus] = useState<IStatus>({
        inputTokens: 0,
        conversationTokens: 0,
        conversationMessages: 0,
        model: 'gemini-2.5-flash',
        currentAction: '',
    });

    const setStatus = (newStatus: Partial<IStatus>) => {
        setBaseStatus(prev => ({ ...prev, ...newStatus }));
    };

    const loadConversations = useCallback(async () => {
        const response = await fetch('/api/conversations');
        const convos = await response.json();
        setConversations(convos);
    }, []);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    const fetchMessages = useCallback(async (conversationId: string) => {
        const response = await fetch(`/api/conversations/${conversationId}/messages`);
        const msgs = await response.json();
        setMessages(msgs);
    }, []);

    const setCurrentConversationById = useCallback(async (conversationId: string | null) => {
        if (!conversationId) {
            setCurrentConversation(null);
            setMessages([]);
            return;
        }
        const convo = conversations.find(c => c.id === conversationId) || null;
        if (convo) {
            setCurrentConversation(convo);
            await fetchMessages(conversationId);
        } else {
            // If convo not found in state, fetch it directly
            const res = await fetch(`/api/conversations/${conversationId}`);
            if(res.ok) {
                const fetchedConvo = await res.json();
                setCurrentConversation(fetchedConvo);
                 await fetchMessages(conversationId);
            }
        }
    }, [conversations, fetchMessages]);

    const createNewConversation = () => {
        setCurrentConversation(null);
        setMessages([]);
    };

    const addMessage = async (message: Omit<Message, 'id' | 'createdAt' | 'conversationId'>) => {
        let conversationToUpdate = currentConversation;

        // Create new conversation if one doesn't exist
        if (!conversationToUpdate) {
            const res = await fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: 'New Chat' })
            });
            const newConversation = await res.json();
            conversationToUpdate = newConversation;
            setCurrentConversation(newConversation);
            await loadConversations();
        }

        // Optimistically update UI
        const optimisticMessage: Message = {
            ...message,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            conversationId: conversationToUpdate.id,
        };
        setMessages(prev => [...prev, optimisticMessage]);

        // Save to DB
        await fetch(`/api/conversations/${conversationToUpdate.id}/messages`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ message }),
        });
        
        // Optionally refetch messages to ensure consistency
        // await fetchMessages(conversationToUpdate.id);
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
