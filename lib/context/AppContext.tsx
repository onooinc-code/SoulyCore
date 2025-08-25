"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Conversation, Message } from '@/lib/types';
import { initDB, dbService, seedInitialData } from '@/lib/db/db';

export interface IStatus {
  inputTokens: number;
  conversationTokens: number;
  conversationMessages: number;
  sentMessagesCount: number;
  sentKnowledgeCount: number;
  sentEntityCount: number;
  extractedEntityCount: number; 
  model: string;
  apiKey: string;
  currentAction: string;
}

interface AppContextType {
    dbReady: boolean;
    conversations: Conversation[];
    currentConversation: Conversation | null;
    messages: Message[];
    setCurrentConversation: (conversation: Conversation | null) => void;
    createNewConversation: () => void;
    addMessage: (message: Message) => Promise<void>;
    updateMessage: (message: Message) => Promise<void>;
    loadConversations: () => Promise<void>;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    status: IStatus;
    setStatus: (status: Partial<IStatus>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [dbReady, setDbReady] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setBaseStatus] = useState<IStatus>({
        inputTokens: 0,
        conversationTokens: 0,
        conversationMessages: 0,
        sentMessagesCount: 0,
        sentKnowledgeCount: 0,
        sentEntityCount: 0,
        extractedEntityCount: 0,
        model: '',
        apiKey: '',
        currentAction: '',
    });

    const setStatus = (newStatus: Partial<IStatus>) => {
        setBaseStatus(prev => ({ ...prev, ...newStatus }));
    };

    const loadConversations = useCallback(async () => {
        if (dbReady) {
            const convos = await dbService.conversations.getAll();
            convos.sort((a,b) => b.lastUpdatedAt.getTime() - a.lastUpdatedAt.getTime());
            setConversations(convos);
        }
    }, [dbReady]);

    useEffect(() => {
        const initialize = async () => {
            const ready = await initDB();
            setDbReady(ready);
            if (ready) {
                await seedInitialData();
                await loadConversations();
            }
        };
        initialize();
    }, [loadConversations]);

    useEffect(() => {
        const fetchMessages = async () => {
            if (currentConversation) {
                const msgs = await dbService.messages.getByConversation(currentConversation.id);
                setMessages(msgs);
            } else {
                setMessages([]);
            }
        };
        fetchMessages();
    }, [currentConversation]);

    const createNewConversation = () => {
        setCurrentConversation(null);
    };

    const addMessage = async (message: Message) => {
        let conversationToUpdate = currentConversation;

        // Create new conversation if one doesn't exist
        if (!conversationToUpdate) {
            const newConversation: Conversation = {
                id: crypto.randomUUID(),
                agentId: 'default',
                title: 'New Chat',
                summary: null,
                createdAt: new Date(),
                lastUpdatedAt: new Date(),
                systemPrompt: "You are a helpful AI assistant.", // Default value
                useSemanticMemory: false,
                useStructuredMemory: true
            };
            await dbService.conversations.add(newConversation);
            conversationToUpdate = newConversation;
            setCurrentConversation(newConversation); // Set it as current
            // Set message's conversationId
            message.conversationId = newConversation.id;
        } else {
            conversationToUpdate.lastUpdatedAt = new Date();
            await dbService.conversations.update(conversationToUpdate);
        }

        await dbService.messages.add(message);
        setMessages(prev => [...prev, message]);
        await loadConversations();
    };
    
    const updateMessage = async (message: Message) => {
        await dbService.messages.update(message);
        setMessages(prev => prev.map(m => m.id === message.id ? message : m));
    };


    return (
        <AppContext.Provider value={{
            dbReady,
            conversations,
            currentConversation,
            messages,
            setCurrentConversation,
            createNewConversation,
            addMessage,
            updateMessage,
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