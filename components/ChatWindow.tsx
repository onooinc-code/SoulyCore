"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from './providers/AppProvider';
import Message from './Message';
import ChatInput from './ChatInput';
import type { Message as MessageType, Contact } from '../lib/types';
import StatusBar from './StatusBar';
import SettingsModal from './SettingsModal';
import AgentConfigModal from './AgentConfigModal';
import SummaryModal from './SummaryModal';

const ChatWindow: React.FC = () => {
    const { 
        currentConversation, 
        messages, 
        addMessage,
        isLoading,
        setIsLoading,
        loadConversations,
        setStatus
    } = useAppContext();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [isAgentConfigModalOpen, setAgentConfigModalOpen] = useState(false);
    const [summaryModalState, setSummaryModalState] = useState<{isOpen: boolean, text: string, isLoading: boolean}>({isOpen: false, text: '', isLoading: false});

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSummarizeMessage = async (content: string) => {
        // This would call a backend route in a real scenario
        setSummaryModalState({ isOpen: true, text: `Summary of: "${content}"`, isLoading: false });
    };

    const handleSendMessage = async (content: string, mentionedContacts: Contact[]) => {
        if (!content.trim() || !currentConversation) return;
        setIsLoading(true);
        setStatus({ currentAction: "Processing input..." });

        const userMessageData = {
            role: 'user' as const,
            content,
            tokenCount: Math.ceil(content.length / 4),
            responseTime: null,
            isBookmarked: false,
        };
        await addMessage(userMessageData);
        
        // This is an optimistic update, actual message is on the server
        const updatedMsgs = [...messages, { ...userMessageData, id: 'temp-user', conversationId: currentConversation.id, createdAt: new Date() }];

        try {
            setStatus({ currentAction: "Generating response..." });
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: updatedMsgs, conversation: currentConversation, mentionedContacts }),
            });

            if (!res.ok) {
                throw new Error('Failed to get chat response from server.');
            }
            
            const { response: aiResponse } = await res.json();
            
            if (aiResponse) {
                const aiMessageData = {
                    role: 'model' as const,
                    content: aiResponse,
                    tokenCount: Math.ceil(aiResponse.length / 4),
                    responseTime: 1000, // Placeholder
                    isBookmarked: false,
                };
                await addMessage(aiMessageData);

                // Trigger autonomous memory pipeline in the background
                fetch('/api/memory/pipeline', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ textToAnalyze: `${content}\n${aiResponse}` }),
                }).catch(e => console.error("Memory pipeline trigger failed:", e));
            }

        } catch (error) {
            console.error(error);
            // Handle error in UI
        } finally {
            setIsLoading(false);
            setStatus({ currentAction: "" });
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    {messages.length > 0 ? (
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <Message 
                                    key={msg.id} 
                                    message={msg}
                                    onSummarize={handleSummarizeMessage}
                                />
                            ))}
                             <div ref={messagesEndRef} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                             <div className="p-4 bg-gray-800 rounded-full mb-4">
                               <svg className="w-16 h-16 text-indigo-400" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V8.25a2.25 2.25 0 00-2.25-2.25H8.25a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-200">SoulyCore</h1>
                            <p className="mt-2 max-w-md">Start a new conversation or select one from the sidebar. Your AI's memory is now powered by a cloud-native backend.</p>
                        </div>
                    )}
                </div>
            </div>
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
            <StatusBar 
                onSettingsClick={() => setSettingsModalOpen(true)}
                onAgentConfigClick={() => setAgentConfigModalOpen(true)}
            />
            <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setSettingsModalOpen(false)} />
            <AgentConfigModal 
                isOpen={isAgentConfigModalOpen} 
                onClose={() => setAgentConfigModalOpen(false)} 
                conversation={currentConversation}
            />
            <SummaryModal 
                isOpen={summaryModalState.isOpen}
                onClose={() => setSummaryModalState({isOpen: false, text: '', isLoading: false})}
                summaryText={summaryModalState.text}
                isLoading={summaryModalState.isLoading}
            />
        </div>
    );
};

export default ChatWindow;
