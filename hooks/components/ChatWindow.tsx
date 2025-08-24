import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useGemini } from '../useGemini';
import Message from './Message';
import ChatInput from './ChatInput';
import type { Message as MessageType, Contact } from '../../types';
import { dbService } from '../context/db/db';
import StatusBar from './StatusBar';
import SettingsModal from './SettingsModal';
import AgentConfigModal from './AgentConfigModal';
import SummaryModal from './SummaryModal';

const ChatWindow: React.FC = () => {
    const { 
        currentConversation, 
        messages, 
        addMessage,
        updateMessage,
        isLoading,
        setIsLoading,
        loadConversations,
        setStatus
    } = useAppContext();
    const { generateChatResponse, generateTitle, summarizeConversation, summarizeText } = useGemini();
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
        setSummaryModalState({ isOpen: true, text: '', isLoading: true });
        const summary = await summarizeText(content);
        setSummaryModalState({ isOpen: true, text: summary || "Could not generate summary.", isLoading: false });
    };

    const handleSendMessage = async (content: string) => {
        if (!content.trim()) return;
        setIsLoading(true);
        setStatus({ currentAction: "Processing input..." });

        const startTime = Date.now();

        // Handle @ mentions
        const mentionRegex = /@(\w+)/g;
        const mentions = [...content.matchAll(mentionRegex)].map(match => match[1]);
        let mentionedContacts: Contact[] = [];
        if (mentions.length > 0) {
            setStatus({ currentAction: "Fetching contact info..." });
            const allContacts = await dbService.contacts.getAll();
            mentionedContacts = allContacts.filter(contact => 
                mentions.some(mention => contact.name.toLowerCase() === mention.toLowerCase())
            );
        }
        
        const tokenCount = Math.ceil(content.length / 4);

        const userMessage: MessageType = {
            id: crypto.randomUUID(),
            conversationId: currentConversation?.id || '',
            role: 'user',
            content,
            createdAt: new Date(),
            tokenCount,
            responseTime: null,
            isBookmarked: false,
        };

        const isNewConversation = !currentConversation;
        await addMessage(userMessage);

        const updatedMsgs = [...messages, userMessage];
        
        const conversationIdForAPI = userMessage.conversationId;
        const conversationForAPI = await dbService.conversations.get(conversationIdForAPI);

        if (!conversationForAPI) {
            console.error("Failed to retrieve conversation for API call");
            setIsLoading(false);
            return;
        }

        const aiResponse = await generateChatResponse(userMessage, updatedMsgs, conversationForAPI, setStatus, mentionedContacts);

        if (aiResponse) {
            const responseTime = Date.now() - startTime;
            const aiTokenCount = Math.ceil(aiResponse.length / 4);
            const aiMessage: MessageType = {
                id: crypto.randomUUID(),
                conversationId: conversationIdForAPI,
                role: 'model',
                content: aiResponse,
                createdAt: new Date(),
                tokenCount: aiTokenCount,
                responseTime,
                isBookmarked: false,
            };
            await addMessage(aiMessage);

            // After first AI response, generate title for new chats
            if (isNewConversation) {
                 const newTitle = await generateTitle([userMessage, aiMessage]);
                 const conversation = await dbService.conversations.get(conversationIdForAPI);
                 if (conversation) {
                    conversation.title = newTitle;
                    await dbService.conversations.update(conversation);
                    await loadConversations();
                 }
            } else if (messages.length > 10 && messages.length % 5 === 0) { // Periodically summarize
                const conversation = await dbService.conversations.get(conversationIdForAPI);
                if(conversation){
                    const newSummary = await summarizeConversation([...updatedMsgs, aiMessage]);
                    if(newSummary) {
                        conversation.summary = newSummary;
                        await dbService.conversations.update(conversation);
                    }
                }
            }
        }
        setIsLoading(false);
        setStatus({ currentAction: "" });
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
                                    onUpdateMessage={updateMessage}
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
                            <p className="mt-2 max-w-md">Start a new conversation with your AI assistant. Your chats are saved locally and can be enhanced with a knowledge base.</p>
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