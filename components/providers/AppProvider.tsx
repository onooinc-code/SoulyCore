

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import type { Conversation, Message, Contact, AppSettings } from '@/lib/types';
import { useLog } from './LogProvider';
import { Content } from '@google/genai';

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
    addMessage: (message: Omit<Message, 'id' | 'createdAt' | 'conversationId'>, mentionedContacts?: Contact[], history?: Message[]) => Promise<{aiResponse: string | null, suggestion: string | null}>;
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
    deleteConversation: (conversationId: string) => Promise<void>;
    updateConversationTitle: (conversationId: string, newTitle: string) => Promise<void>;
    generateConversationTitle: (conversationId: string) => Promise<void>;
    deleteMessage: (messageId: string) => Promise<void>;
    updateMessage: (messageId: string, newContent: string) => Promise<void>;
    regenerateAiResponse: (messageId: string) => Promise<void>;
    regenerateUserPromptAndGetResponse: (messageId: string) => Promise<void>;
    unreadConversations: Set<string>;
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

    // State for unread conversation indicators
    const [unreadConversations, setUnreadConversations] = useState(new Set<string>());
    const isVisibleRef = useRef(true);

    // Effect to track if the browser tab is active
    useEffect(() => {
        const handleVisibilityChange = () => {
            isVisibleRef.current = document.visibilityState === 'visible';
            // If the tab becomes visible and there's an active conversation, mark it as read.
            if (isVisibleRef.current && currentConversation) {
                setUnreadConversations(prev => {
                    const newSet = new Set(prev);
                    if (newSet.delete(currentConversation.id)) {
                        return newSet;
                    }
                    return prev;
                });
            }
        };
        handleVisibilityChange();
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [currentConversation]);


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
             log('Failed to load global settings.', { error: { message: errorMessage, stack: (error as Error).stack } }, 'error');
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
            log(errorMessage, { error: { message: (error as Error).message, stack: (error as Error).stack } }, 'error');
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
             log(errorMessage, { error: { message: (error as Error).message, stack: (error as Error).stack } }, 'error');
             console.error(error);
        }
    }, [setStatus, log]);

    const setCurrentConversationById = useCallback(async (conversationId: string | null) => {
        // Mark the selected conversation as read by removing it from the unread set.
        if (conversationId) {
            setUnreadConversations(prev => {
                const newSet = new Set(prev);
                if (newSet.delete(conversationId)) {
                    return newSet;
                }
                return prev;
            });
        }
        
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
            log('Conversation not in cache, reloading conversation list to find it.');
            const freshResponse = await fetch('/api/conversations');
            if (!freshResponse.ok) {
                 log('Failed to reload conversation list.', null, 'error');
                 return;
            }
            const freshConvos = await freshResponse.json();
            setConversations(freshConvos);
            if (!findAndSetConvo(freshConvos)) {
                log('Could not find the new conversation even after refresh.', { conversationId }, 'error');
            }
        }
    }, [conversations, fetchMessages, log]);

    const updateCurrentConversation = useCallback((updatedData: Partial<Conversation>) => {
        if (currentConversation) {
            log('Updating current conversation settings in state.', updatedData);
            const newConversation = { ...currentConversation, ...updatedData };
            setCurrentConversation(newConversation);
            setConversations(convos => convos.map(c => c.id === newConversation.id ? newConversation : c));
        }
    }, [currentConversation, log]);
    
    const createNewConversation = useCallback(async () => {
        log('Creating new conversation via API.');
        setIsLoading(true);
        setStatus({ currentAction: "Creating new chat..." });
        try {
            const res = await fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: 'New Chat' })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Failed to create conversation on the server.' }));
                throw new Error(errorData.error || 'Failed to create conversation');
            }
            const newConversation: Conversation = await res.json();
            log('Successfully created new conversation in DB.', newConversation);

            await loadConversations(); // Refresh the sidebar list
            setCurrentConversationById(newConversation.id); // Set the new conversation as active

        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log('Error in createNewConversation process.', { error: { message: errorMessage, stack: (error as Error).stack } }, 'error');
        } finally {
            setIsLoading(false);
            setStatus({ currentAction: "" });
        }
    }, [log, setIsLoading, setStatus, loadConversations, setCurrentConversationById]);

    const addMessage = useCallback(async (
        message: Omit<Message, 'id' | 'createdAt' | 'conversationId'>, 
        mentionedContacts?: Contact[],
        historyOverride?: Message[],
    ) => {
        if (!currentConversation) {
            setStatus({ error: "Cannot send a message. No active conversation selected." });
            log('addMessage failed: No current conversation.', null, 'error');
            return { aiResponse: null, suggestion: null };
        }

        setIsLoading(true);
        setStatus({ currentAction: "Processing...", error: null });
        log('Starting addMessage process.', { message, mentionedContacts, historyOverride });

        const optimisticUserMessage: Message = { 
            ...message, 
            id: crypto.randomUUID(), 
            createdAt: new Date(), 
            conversationId: currentConversation.id
        };
        // Only add user message to UI if it's a new message, not a regeneration
        if (!historyOverride) {
            setMessages(prev => [...prev, optimisticUserMessage]);
            log('Optimistically added user message to UI.', optimisticUserMessage);
        }

        try {
            // For a normal message send, add the optimistic message before sending.
            // For a regeneration, the history is provided and already correct.
            let messageHistory = historyOverride ? [...historyOverride] : [...messages.filter(m => m.id !== optimisticUserMessage.id)];

            log('Saving user message to DB...');
            const userMsgRes = await fetch(`/api/conversations/${currentConversation.id}/messages`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ message: optimisticUserMessage }),
            });
            if (!userMsgRes.ok) throw new Error("Failed to save your message.");
            const savedUserMessage = await userMsgRes.json();
            log('User message saved successfully.', savedUserMessage);
            
            // Add the saved user message to the UI/history
            if (historyOverride) {
                 messageHistory.push(savedUserMessage);
                 setMessages(prev => [...prev, savedUserMessage]);
            } else {
                 setMessages(prev => prev.map(m => m.id === optimisticUserMessage.id ? savedUserMessage : m));
                 messageHistory.push(savedUserMessage);
            }
            
            const chatApiPayload = { 
                messages: messageHistory, 
                conversation: currentConversation,
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
                 const aiMsgRes = await fetch(`/api/conversations/${currentConversation.id}/messages`, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ message: aiMessageData }),
                });
                if (!aiMsgRes.ok) throw new Error("Failed to save AI's message.");
                const savedAiMessage = await aiMsgRes.json();
                log('AI message saved successfully.', savedAiMessage);
                setMessages(prev => [...prev, savedAiMessage!]);

                // If tab is not visible, mark the conversation as having unread messages.
                if (!isVisibleRef.current) {
                    log('Marking conversation as unread due to tab inactivity.', { conversationId: currentConversation.id });
                    setUnreadConversations(prev => new Set(prev).add(currentConversation.id));
                }

                 // Trigger background memory pipeline
                const textToAnalyze = `${message.content}\n${aiResponse}`;
                log('Triggering background memory pipeline.', { textLength: textToAnalyze.length });
                fetch('/api/memory/pipeline', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ textToAnalyze })
                }).catch(err => {
                    const errorMessage = "Memory pipeline trigger failed.";
                    log(errorMessage, { error: { message: (err as Error).message, stack: (err as Error).stack } }, 'error');
                    console.error(errorMessage, err)
                });
            }
            
            return { aiResponse, suggestion };
            
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage, currentAction: "Error" });
            log('Error in addMessage process.', { error: { message: errorMessage, stack: (error as Error).stack } }, 'error');
            console.error(error);
            if (!historyOverride) {
                setMessages(prev => prev.filter(m => m.id !== optimisticUserMessage.id));
            }
            return { aiResponse: null, suggestion: null };
        } finally {
            setIsLoading(false);
            setStatus({ currentAction: "" });
        }
    }, [currentConversation, messages, setStatus, log]);

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
            log('Failed to toggle bookmark.', { messageId, error: { message: errorMessage, stack: (error as Error).stack } }, 'error');
            console.error(error);
        } finally {
            setStatus({ currentAction: "" });
        }
    }, [setStatus, log]);

    const deleteConversation = useCallback(async (conversationId: string) => {
        log(`Deleting conversation: ${conversationId}`);
        try {
            const res = await fetch(`/api/conversations/${conversationId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete conversation.');
            
            log('Conversation deleted successfully from DB.');
            setConversations(prev => prev.filter(c => c.id !== conversationId));
            if (currentConversation?.id === conversationId) {
                setCurrentConversation(null);
                setMessages([]);
            }
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log('Failed to delete conversation.', { conversationId, error: { message: errorMessage } }, 'error');
        }
    }, [currentConversation, log, setStatus]);

    const updateConversationTitle = useCallback(async (conversationId: string, newTitle: string) => {
        log(`Updating title for conversation: ${conversationId}`, { newTitle });
        setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, title: newTitle } : c));
        if (currentConversation?.id === conversationId) {
            setCurrentConversation(prev => prev ? { ...prev, title: newTitle } : null);
        }

        try {
            await fetch(`/api/conversations/${conversationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle }),
            });
        } catch (error) {
            log('Failed to save updated title to DB.', { error }, 'error');
            // Note: No error is shown to the user for this background save failure.
            // Could add error handling to revert the title if needed.
            loadConversations(); // Re-sync with DB on failure
        }
    }, [currentConversation, log, loadConversations]);

    const generateConversationTitle = useCallback(async (conversationId: string) => {
        log(`Generating title for conversation: ${conversationId}`);
        setStatus({ currentAction: 'Generating title...' });
        try {
            const res = await fetch(`/api/conversations/${conversationId}/generate-title`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to generate title.');
            const updatedConversation = await res.json();
            
            setConversations(prev => prev.map(c => c.id === conversationId ? updatedConversation : c));
            if (currentConversation?.id === conversationId) {
                setCurrentConversation(updatedConversation);
            }
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log('Failed to generate title.', { conversationId, error }, 'error');
        } finally {
            setStatus({ currentAction: '' });
        }
    }, [currentConversation, log, setStatus]);

    const deleteMessage = useCallback(async (messageId: string) => {
        log(`Deleting message: ${messageId}`);
        const originalMessages = messages;
        setMessages(prev => prev.filter(m => m.id !== messageId));
        try {
            const res = await fetch(`/api/messages/${messageId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete message from server.');
        } catch (error) {
            setMessages(originalMessages);
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log('Failed to delete message.', { messageId, error }, 'error');
        }
    }, [messages, log, setStatus]);

    const updateMessage = useCallback(async (messageId: string, newContent: string) => {
        log(`Updating message: ${messageId}`);
        const originalMessages = messages;
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: newContent } : m));
        try {
            const res = await fetch(`/api/messages/${messageId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newContent }),
            });
            if (!res.ok) throw new Error('Failed to update message on server.');
            const updatedMessage = await res.json();
            setMessages(prev => prev.map(m => m.id === messageId ? updatedMessage : m));
        } catch (error) {
            setMessages(originalMessages);
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log('Failed to update message.', { messageId, error }, 'error');
        }
    }, [messages, log, setStatus]);

     const regenerateAiResponse = useCallback(async (messageId: string) => {
        log(`Regenerating AI response for message: ${messageId}`);
        const messageIndex = messages.findIndex(m => m.id === messageId);
        
        // Ensure the message exists and is not the very first message
        if (messageIndex < 1) return;

        const aiMessageToDelete = messages[messageIndex];
        // Ensure we are regenerating a 'model' response
        if (aiMessageToDelete.role !== 'model') return;

        const historyToResend = messages.slice(0, messageIndex);
        const userPromptMessage = historyToResend[historyToResend.length - 1];

        // Ensure the preceding message is from the user
        if (userPromptMessage.role !== 'user') return;
        
        // Delete the old AI response from the database and UI
        try {
            const res = await fetch(`/api/messages/${messageId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete the previous AI response.');
            log('Successfully deleted old AI response from DB.', { messageId });
            // Update UI state after successful deletion
            setMessages(prev => prev.filter(m => m.id !== messageId));
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: `Failed to remove the previous response. Please try again. Error: ${errorMessage}` });
            log('Error deleting old AI response during regeneration.', { messageId, error }, 'error');
            return; // Stop the process if deletion fails
        }

        // Call addMessage with the history *before* the deleted AI message
        // It will handle the API call and add the new AI response to the UI
        await addMessage(userPromptMessage, [], historyToResend);

    }, [messages, addMessage, log, setStatus]);

    const regenerateUserPromptAndGetResponse = useCallback(async (messageId: string) => {
        log(`Regenerating user prompt and getting new response for message: ${messageId}`);
        setStatus({ currentAction: "Rewriting your prompt...", error: null });
        setIsLoading(true);

        const messageIndex = messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1) {
            const errorMsg = "Original message not found for regeneration.";
            setStatus({ error: errorMsg });
            log(errorMsg, { messageId }, 'error');
            setIsLoading(false);
            return;
        }

        const userMessage = messages[messageIndex];
        if (userMessage.role !== 'user') {
            log('Attempted to regenerate prompt for a non-user message.', { messageId }, 'warn');
            setIsLoading(false);
            return;
        }
        
        let aiMessageToDelete: Message | null = null;
        if (messageIndex + 1 < messages.length && messages[messageIndex + 1].role === 'model') {
            aiMessageToDelete = messages[messageIndex + 1];
        }

        const historyForContext = messages.slice(0, messageIndex);
        
        try {
            const regenRes = await fetch('/api/prompt/regenerate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    promptToRewrite: userMessage.content,
                    history: historyForContext.map(m => ({ role: m.role, parts: [{ text: m.content }] }))
                }),
            });
            if (!regenRes.ok) throw new Error('Failed to get rewritten prompt from server.');
            const { rewrittenPrompt } = await regenRes.json();
            log('Received rewritten prompt from AI.', { rewrittenPrompt });

            setStatus({ currentAction: "Prompt rewritten. Getting new response..." });

            const deleteUserMsgRes = await fetch(`/api/messages/${userMessage.id}`, { method: 'DELETE' });
            if (!deleteUserMsgRes.ok) throw new Error('Failed to delete original user message.');
            log('Deleted old user message from DB.', { messageId: userMessage.id });

            if (aiMessageToDelete) {
                const deleteAiMsgRes = await fetch(`/api/messages/${aiMessageToDelete.id}`, { method: 'DELETE' });
                if (!deleteAiMsgRes.ok) throw new Error('Failed to delete original AI response.');
                log('Deleted old AI response from DB.', { messageId: aiMessageToDelete.id });
            }

            setMessages(prev => prev.filter(m => {
                if (m.id === userMessage.id) return false;
                if (aiMessageToDelete && m.id === aiMessageToDelete.id) return false;
                return true;
            }));

            const newPromptMessage: Omit<Message, 'id' | 'createdAt' | 'conversationId'> = {
                role: 'user',
                content: rewrittenPrompt,
                tokenCount: Math.ceil(rewrittenPrompt.length / 4),
            };
            
            await addMessage(newPromptMessage, [], historyForContext);

        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: `Failed during prompt regeneration process: ${errorMessage}` });
            log('Error regenerating user prompt.', { messageId, error: { message: errorMessage, stack: (error as Error).stack } }, 'error');
        } finally {
            setIsLoading(false);
            setStatus({ currentAction: "" });
        }
    }, [messages, log, setStatus, addMessage]);


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
            deleteConversation,
            updateConversationTitle,
            generateConversationTitle,
            deleteMessage,
            updateMessage,
            regenerateAiResponse,
            regenerateUserPromptAndGetResponse,
            unreadConversations,
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