"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef, useMemo } from 'react';
import type { Conversation, Message, Contact, AppSettings, Prompt, Role } from '@/lib/types';
import { useLog } from './LogProvider';
import { Content } from '@google/genai';

export interface IStatus {
  currentAction: string;
  error: string | null;
}

interface ActiveWorkflowState {
  prompt: Prompt;
  userInputs: Record<string, string>;
  currentStepIndex: number;
  stepOutputs: Record<number, string>; // Key is step number (1-based)
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
    clearMessages: (conversationId: string) => Promise<void>;
    changeFontSize: (direction: 'increase' | 'decrease') => void;
    isConversationPanelOpen: boolean;
    setConversationPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isConversationPanelMinimized: boolean;
    setIsConversationPanelMinimized: React.Dispatch<React.SetStateAction<boolean>>;
    isLogPanelOpen: boolean;
    setLogPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    backgroundTaskCount: number;
    startBackgroundTask: () => void;
    endBackgroundTask: () => void;
    startWorkflow: (prompt: Prompt, userInputs: Record<string, string>) => void;
    activeWorkflow: ActiveWorkflowState | null;
    activeView: string;
    setActiveView: (view: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const fontSizeSteps = ['sm', 'base', 'lg', 'xl'];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setBaseStatus] = useState<IStatus>({ currentAction: '', error: null });
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const { log, setLoggingEnabled } = useLog();

    const [isConversationPanelOpen, setConversationPanelOpen] = useState(true);
    const [isConversationPanelMinimized, setIsConversationPanelMinimized] = useState(false);
    const [isLogPanelOpen, setLogPanelOpen] = useState(false);

    const [activeView, setActiveView] = useState('dashboard'); // Default view

    const [unreadConversations, setUnreadConversations] = useState(new Set<string>());
    const isVisibleRef = useRef(true);
    const [fontSize, setFontSize] = useState('base');
    const [backgroundTaskCount, setBackgroundTaskCount] = useState(0);
    const [activeWorkflow, setActiveWorkflow] = useState<ActiveWorkflowState | null>(null);

    const startBackgroundTask = useCallback(() => {
        setBackgroundTaskCount(prev => prev + 1);
    }, []);

    const endBackgroundTask = useCallback(() => {
        setBackgroundTaskCount(prev => (prev > 0 ? prev - 1 : 0));
    }, []);

    useEffect(() => {
        const savedFontSize = localStorage.getItem('app-font-size');
        if (savedFontSize && fontSizeSteps.includes(savedFontSize)) {
            setFontSize(savedFontSize);
        }
    }, []);

    useEffect(() => {
        fontSizeSteps.forEach(step => {
            document.documentElement.classList.remove(`font-size-${step}`);
        });
        document.documentElement.classList.add(`font-size-${fontSize}`);
        localStorage.setItem('app-font-size', fontSize);
    }, [fontSize]);

    const changeFontSize = useCallback((direction: 'increase' | 'decrease') => {
        setFontSize(currentSize => {
            const currentIndex = fontSizeSteps.indexOf(currentSize);
            if (direction === 'increase' && currentIndex < fontSizeSteps.length - 1) {
                return fontSizeSteps[currentIndex + 1];
            }
            if (direction === 'decrease' && currentIndex > 0) {
                return fontSizeSteps[currentIndex - 1];
            }
            return currentSize;
        });
    }, []);


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
            return msgs;
        } catch (error) {
             const errorMessage = 'Could not load messages for this chat.';
             setStatus({ error: errorMessage });
             log(errorMessage, { error: { message: (error as Error).message, stack: (error as Error).stack } }, 'error');
             console.error(error);
             return [];
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
            setActiveView('dashboard'); // Go to dashboard if no chat is active
            return;
        }

        log(`Setting current conversation to: ${conversationId}`);
        setActiveView('chat'); // Switch to chat view when a conversation is selected

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
            setCurrentConversationById(newConversation.id); // Set the new conversation as active and switch view
            setConversationPanelOpen(true);

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
            let messageHistory = historyOverride ? [...historyOverride] : [...messages, optimisticUserMessage];
            
            log('Saving user message to DB...');
            const userMsgRes = await fetch(`/api/conversations/${currentConversation.id}/messages`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ message: optimisticUserMessage }),
            });
            if (!userMsgRes.ok) throw new Error("Failed to save your message.");
            const savedUserMessage: Message = await userMsgRes.json();
            log('User message saved successfully.', savedUserMessage);
            
             // Replace optimistic message with saved one
            setMessages(prev => prev.map(m => m.id === optimisticUserMessage.id ? savedUserMessage : m));
            messageHistory = messageHistory.map(m => m.id === optimisticUserMessage.id ? savedUserMessage : m);

            const chatApiPayload = { 
                messages: messageHistory, 
                conversation: currentConversation,
                mentionedContacts,
                userMessageId: savedUserMessage.id, // Pass ID for pipeline logging
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
                // In v2, the server saves the AI message. We refetch to get it and its ID.
                const updatedMessages = await fetchMessages(currentConversation.id);
                const aiMessage = updatedMessages[updatedMessages.length - 1];

                if (!isVisibleRef.current) {
                    log('Marking conversation as unread due to tab inactivity.', { conversationId: currentConversation.id });
                    setUnreadConversations(prev => new Set(prev).add(currentConversation.id));
                }

                 // Trigger background memory pipeline with the AI message ID (conditionally)
                 if (currentConversation.enableMemoryExtraction) {
                    const textToAnalyze = `${message.content}\n${aiResponse}`;
                    log('Triggering background memory pipeline.', { textLength: textToAnalyze.length, aiMessageId: aiMessage?.id });
                    startBackgroundTask();
                    fetch('/api/memory/pipeline', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ textToAnalyze, aiMessageId: aiMessage?.id })
                    }).catch(err => {
                        const errorMessage = "Memory pipeline trigger failed.";
                        log(errorMessage, { error: { message: (err as Error).message, stack: (err as Error).stack } }, 'error');
                        console.error(errorMessage, err)
                    }).finally(() => {
                        endBackgroundTask();
                    });
                 } else {
                    log('Memory extraction skipped due to conversation settings.');
                 }
            }
            
            return { aiResponse, suggestion };
            
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage, currentAction: "Error" });
            log('Error in addMessage process.', { error: { message: errorMessage, stack: (error as Error).stack } }, 'error');
            console.error(error);
            // Remove optimistic message on failure
            setMessages(prev => prev.filter(m => m.id !== optimisticUserMessage.id));
            return { aiResponse: null, suggestion: null };
        } finally {
            setIsLoading(false);
            setStatus({ currentAction: "" });
        }
    }, [currentConversation, messages, setStatus, log, startBackgroundTask, endBackgroundTask, fetchMessages]);

    const executeNextWorkflowStep = useCallback(async (workflowState: ActiveWorkflowState) => {
        const { prompt, userInputs, currentStepIndex, stepOutputs } = workflowState;
        
        if (!prompt.chain_definition || currentStepIndex >= prompt.chain_definition.length) {
            log('Workflow finished.');
            setActiveWorkflow(null);
            return;
        }

        const currentStep = prompt.chain_definition[currentStepIndex];
        log(`Executing workflow step ${currentStep.step}`, { promptId: currentStep.promptId });
        
        try {
            // Fetch the single prompt for the current step
            const promptRes = await fetch(`/api/prompts/${currentStep.promptId}`);
            if (!promptRes.ok) throw new Error(`Could not fetch prompt for step ${currentStep.step}`);
            const stepPrompt: Prompt = await promptRes.json();

            let interpolatedContent = stepPrompt.content;

            // Interpolate variables
            for (const [variableName, mapping] of Object.entries(currentStep.inputMapping)) {
                let value: string;
                if (mapping.source === 'userInput') {
                    value = userInputs[variableName];
                } else {
                    value = stepOutputs[mapping.step!];
                }
                if (value === undefined) {
                    throw new Error(`Missing value for variable ${variableName} in step ${currentStep.step}`);
                }
                const regex = new RegExp(`{{\\s*${variableName}\\s*}}`, 'g');
                interpolatedContent = interpolatedContent.replace(regex, value);
            }

            const stepMessage: Omit<Message, 'id' | 'createdAt' | 'conversationId'> = {
                role: 'user',
                content: interpolatedContent,
            };

            const { aiResponse } = await addMessage(stepMessage);

            if (!aiResponse) {
                throw new Error(`AI response was empty for step ${currentStep.step}. Halting workflow.`);
            }

            // Prepare for next step
            const nextState: ActiveWorkflowState = {
                ...workflowState,
                currentStepIndex: currentStepIndex + 1,
                stepOutputs: {
                    ...stepOutputs,
                    [currentStep.step]: aiResponse
                }
            };
            setActiveWorkflow(nextState);
            executeNextWorkflowStep(nextState); // Recursive call for the next step

        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: `Workflow failed at step ${currentStep.step}: ${errorMessage}` });
            log('Workflow step failed. Halting execution.', { step: currentStep.step, error: errorMessage }, 'error');
            setActiveWorkflow(null); // Stop the workflow
        }
    }, [addMessage, log, setStatus]);

    const startWorkflow = useCallback((prompt: Prompt, userInputs: Record<string, string>) => {
        log('Starting new workflow.', { promptName: prompt.name });
        if (!currentConversation) {
            setStatus({ error: "Cannot start a workflow without an active conversation." });
            return;
        }
        const initialState: ActiveWorkflowState = {
            prompt,
            userInputs,
            currentStepIndex: 0,
            stepOutputs: {}
        };
        setActiveWorkflow(initialState);
        executeNextWorkflowStep(initialState);
    }, [log, currentConversation, setStatus, executeNextWorkflowStep]);


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
    }, [messages, setStatus, log]);

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
        if (!currentConversation) return;

        const messageIndex = messages.findIndex(m => m.id === messageId);
        if (messageIndex < 1 || messages[messageIndex].role !== 'model') {
            log('Regeneration aborted: Invalid message selected.', { messageId, role: messages[messageIndex]?.role });
            return;
        }

        const historyToResend = messages.slice(0, messageIndex);
        const userMessageForContext = historyToResend[historyToResend.length - 1];
        if (userMessageForContext.role !== 'user') {
            log('Regeneration aborted: Preceding message is not from user.', { messageId });
            return;
        }
        
        setIsLoading(true);
        setStatus({ currentAction: "Getting new response...", error: null });

        try {
            // Delete the old AI response from the database and UI first
            await deleteMessage(messageId);

            // Now, get a new response
            // FIX: Explicitly type the new message object to ensure its `role` property
            // is correctly inferred as type 'Role' ('user' | 'model') instead of the broader 'string'.
            const newPromptMessage: Omit<Message, 'id' | 'createdAt' | 'conversationId'> = {
                role: 'user' as Role,
                content: userMessageForContext.content,
            };
            
            await addMessage(newPromptMessage, [], historyToResend.slice(0, -1));

        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: `Failed during regeneration. ${errorMessage}` });
            log('Error regenerating AI response.', { messageId, error: { message: errorMessage, stack: (error as Error).stack } }, 'error');
            fetchMessages(currentConversation.id); // Resync on error
        } finally {
            setIsLoading(false);
            setStatus({ currentAction: "" });
        }
    }, [messages, currentConversation, log, setStatus, fetchMessages, addMessage, deleteMessage]);

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

            // Delete old messages
            await deleteMessage(userMessage.id);
            if(aiMessageToDelete) {
                await deleteMessage(aiMessageToDelete.id);
            }

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
    }, [messages, log, setStatus, addMessage, deleteMessage]);

    const clearMessages = useCallback(async (conversationId: string) => {
        log(`Clearing all messages for conversation: ${conversationId}`);
        const originalMessages = messages;
        // Optimistic update
        if (currentConversation?.id === conversationId) {
            setMessages([]);
        }
        try {
            const res = await fetch(`/api/conversations/${conversationId}/clear-messages`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to clear messages on server.');
            log('Successfully cleared messages from DB.');
        } catch (error) {
            if (currentConversation?.id === conversationId) {
                setMessages(originalMessages);
            }
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log('Failed to clear messages.', { conversationId, error }, 'error');
        }
    }, [messages, currentConversation, log, setStatus]);


    // FIX: The context value was incorrectly defined as an array `[]` instead of an object `{}`.
    // This has been corrected to return an object that matches the `AppContextType`.
    const contextValue = useMemo(() => ({
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
        clearMessages,
        changeFontSize,
        isConversationPanelOpen,
        setConversationPanelOpen,
        isConversationPanelMinimized,
        setIsConversationPanelMinimized,
        isLogPanelOpen,
        setLogPanelOpen,
        backgroundTaskCount,
        startBackgroundTask,
        endBackgroundTask,
        startWorkflow,
        activeWorkflow,
        activeView,
        setActiveView,
    }), [
        conversations, currentConversation, messages, setCurrentConversationById,
        updateCurrentConversation, createNewConversation, addMessage, toggleBookmark,
        loadConversations, isLoading, setIsLoading, status, setStatus, clearError,
        settings, loadSettings, setSettings, deleteConversation, updateConversationTitle,
        generateConversationTitle, deleteMessage, updateMessage, regenerateAiResponse,
        regenerateUserPromptAndGetResponse, unreadConversations, clearMessages,
        changeFontSize, isConversationPanelOpen, setConversationPanelOpen, 
        isConversationPanelMinimized, setIsConversationPanelMinimized,
        isLogPanelOpen, setLogPanelOpen,
        backgroundTaskCount, startBackgroundTask, 
        endBackgroundTask, startWorkflow, activeWorkflow, activeView, setActiveView
    ]);

    return (
        <AppContext.Provider value={contextValue}>
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
