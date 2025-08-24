
"use client";

import { useState, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { dbService } from '@/lib/db/db';
import type { Message, Conversation, Contact } from '@/lib/types';
import type { IStatus } from '@/lib/context/AppContext';

// Get settings from localStorage for model and parameters, but not API key
const getStoredSettings = () => {
    if (typeof window === 'undefined') return {};
    return JSON.parse(localStorage.getItem('gemini-settings') || '{}');
}

const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

if (!API_KEY) {
    console.error("NEXT_PUBLIC_API_KEY not set in environment.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const useGemini = () => {
    const [error, setError] = useState<string | null>(null);

    const countTokens = useCallback(async (text: string | string[]): Promise<number> => {
        const fullText = Array.isArray(text) ? text.join(' ') : text;
        return Promise.resolve(Math.ceil(fullText.length / 4));
    }, []);

    const createEmbedding = useCallback(async (text: string): Promise<number[] | null> => {
        console.warn("`createEmbedding` is not supported by the current API guidelines and has been disabled.");
        return null;
    }, []);

    const extractEntitiesFromText = useCallback(async (text: string): Promise<any[] | null> => {
        try {
            const storedSettings = getStoredSettings();
            const modelName = storedSettings.model || 'gemini-2.5-flash';
            const prompt = `From the following text, extract key entities like people, places, organizations, or important concepts. Return them as a JSON array. Text: \n\n${text}`;
            
            const result = await ai.models.generateContent({
                model: modelName,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: 'Name of the entity' },
                                type: { type: Type.STRING, description: 'Type of entity (e.g., Person, Place, Concept)' },
                                details: { type: Type.STRING, description: 'A brief description or context' }
                            },
                            required: ['name', 'type', 'details']
                        }
                    }
                }
            });

            let jsonStr = result.text.trim();
            if (jsonStr.startsWith('```json')) {
                jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
            } else if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.substring(3, jsonStr.length - 3).trim();
            }

            return JSON.parse(jsonStr);

        } catch (e) {
            console.error("Entity extraction failed:", e);
            setError("Failed to extract entities.");
            return null;
        }
    }, []);

    const generateChatResponse = useCallback(async (
        userMessage: Message,
        history: Message[],
        conversation: Conversation,
        setStatus: (status: Partial<IStatus>) => void,
        mentionedContacts: Contact[] = []
    ): Promise<string | null> => {
        setError(null);
        const storedSettings = getStoredSettings();
        const modelName = storedSettings.model || 'gemini-2.5-flash';
        const temperature = storedSettings.temperature || 0.7;
        const topP = storedSettings.topP || 0.95;
        try {
            setStatus({ currentAction: "Initializing context..." });
            const useSemantic = conversation.memoryConfig?.useSemantic ?? false;
            const useStructured = conversation.memoryConfig?.useStructured ?? true;
            
            let semanticContext = '';
            let sentKnowledgeCount = 0;
            if (useSemantic) { 
                // Semantic memory is disabled per API guidelines, this block remains for future compatibility.
            }
            
            let entityContext = '';
            let sentEntityCount = 0;
            if (useStructured) {
                setStatus({ currentAction: "Loading structured memory..." });
                const allEntities = await dbService.entities.getAll();
                if (allEntities.length > 0) {
                    entityContext = "You know about these entities:\n" + allEntities.map(e => `- ${e.name} (${e.type}): ${e.details_json}`).join('\n');
                    sentEntityCount = allEntities.length;
                }
            }
            
            let contactContext = '';
            if (mentionedContacts.length > 0) {
                setStatus({ currentAction: "Injecting contact details..." });
                contactContext = "You have the following context about people mentioned in this message:\n" +
                    mentionedContacts.map(c => 
                        `- Name: ${c.name}\n  Email: ${c.email}\n  Company: ${c.company}\n  Notes: ${c.notes}`
                    ).join('\n\n');
            }

            const fullPrompt = `${entityContext}\n${contactContext}\n${conversation.summary ? `Summary: ${conversation.summary}\n` : ''}User: ${userMessage.content}`.trim();
            
            const chatHistory = history.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.content }]
            }));
             const contents = [...chatHistory, { role: 'user', parts: [{ text: fullPrompt }] }];

            const inputTokens = await countTokens(userMessage.content);
            const conversationTokens = await countTokens(contents.map(c => c.parts[0].text));

            setStatus({
                inputTokens,
                conversationTokens,
                conversationMessages: contents.length,
                sentMessagesCount: history.length,
                sentKnowledgeCount,
                sentEntityCount,
                model: modelName,
                apiKey: API_KEY!,
                extractedEntityCount: 0 
            });

            setStatus({ currentAction: "Generating response..." });
            const result = await ai.models.generateContent({
                model: modelName,
                contents,
                config: {
                    systemInstruction: conversation.systemPrompt || "You are a helpful AI assistant.",
                    temperature,
                    topP,
                }
            });

            const responseText = result.text;
            
            setStatus({ currentAction: "Analyzing response for entities..." });
            const extracted = await extractEntitiesFromText(responseText);
            if (extracted) {
                setStatus({ extractedEntityCount: extracted.length });
            }
            setStatus({ currentAction: "" });

            return responseText;

        } catch (e) {
            console.error("Chat generation failed:", e);
            setError("Failed to get response from AI.");
            setStatus({ inputTokens: 0, conversationTokens: 0, currentAction: "Error" });
            return null;
        }
    }, [countTokens, extractEntitiesFromText]);

    const generateTitle = useCallback(async (messages: Message[]): Promise<string> => {
        if(messages.length === 0) return "New Chat";
        const storedSettings = getStoredSettings();
        const modelName = storedSettings.model || 'gemini-2.5-flash';
        try {
            const prompt = `Based on the following conversation start, create a short, concise title (4-5 words max):\n\nUser: ${messages[0].content}\n${messages[1] ? `Model: ${messages[1].content}` : ''}`;
            const result = await ai.models.generateContent({
                model: modelName,
                contents: prompt,
            });
            return result.text.replace(/["']/g, "");
        } catch (e) {
            console.error("Title generation failed", e);
            return "Chat";
        }
    }, []);

    const summarizeConversation = useCallback(async (messages: Message[]): Promise<string | null> => {
        const storedSettings = getStoredSettings();
        const modelName = storedSettings.model || 'gemini-2.5-flash';
        try {
            const conversationText = messages.map(m => `${m.role}: ${m.content}`).join('\n');
            const prompt = `Please provide a concise summary of the following conversation:\n\n${conversationText}`;
            const result = await ai.models.generateContent({
                model: modelName,
                contents: prompt,
            });
            return result.text;
        } catch (e) {
            console.error("Summarization failed:", e);
            return null;
        }
    }, []);
    
    const summarizeText = useCallback(async (text: string): Promise<string | null> => {
        const storedSettings = getStoredSettings();
        const modelName = storedSettings.model || 'gemini-2.5-flash';
        try {
            const prompt = `Please provide a concise summary of the following text:\n\n"${text}"`;
            const result = await ai.models.generateContent({
                model: modelName,
                contents: prompt,
            });
            return result.text;
        } catch (e) {
            console.error("Text summarization failed:", e);
            setError("Failed to summarize text.");
            return "Error: Could not generate summary.";
        }
    }, []);
    
    const generateNewFeatureIdea = useCallback(async (): Promise<string> => {
        const storedSettings = getStoredSettings();
        const modelName = storedSettings.model || 'gemini-2.5-flash';
        try {
            const prompt = "You are an expert product manager for a highly advanced, self-aware AI application called SoulyCore. Suggest one new, innovative feature idea for the application. The idea should be ambitious but achievable. Describe the feature and its potential benefit. Format as a single paragraph.";
            const result = await ai.models.generateContent({ model: modelName, contents: prompt });
            return result.text;
        } catch(e) { return "Error generating idea."; }
    }, []);
    
    const generateTechDesign = useCallback(async (featureIdea: string): Promise<string> => {
        const storedSettings = getStoredSettings();
        const modelName = storedSettings.model || 'gemini-2.5-flash';
        try {
            const prompt = `You are a world-class senior frontend engineer. You are building SoulyCore. For the following feature idea, create a technical design document. Specify which React components need to be created or modified, what state management changes are needed (using React Context), and any database schema changes for IndexedDB. Be concise but thorough.\n\nFeature Idea: ${featureIdea}`;
            const result = await ai.models.generateContent({ model: modelName, contents: prompt });
            return result.text;
        } catch(e) { return "Error generating design."; }
    }, []);
    
    const updateDocumentation = useCallback(async (gitDiff: string): Promise<string> => {
        const storedSettings = getStoredSettings();
        const modelName = storedSettings.model || 'gemini-2.5-flash';
        try {
            const prompt = `You are a technical writer responsible for maintaining the documentation for the SoulyCore project. Based on the following 'git diff' output, update the project's markdown documentation. Only provide the new or updated markdown sections. Do not repeat existing, unchanged documentation.\n\nGit Diff:\n${gitDiff}`;
            const result = await ai.models.generateContent({ model: modelName, contents: prompt });
            return result.text;
        } catch(e) { return "Error updating documentation."; }
    }, []);


    return { error, generateChatResponse, createEmbedding, generateTitle, summarizeConversation, extractEntitiesFromText, summarizeText, generateNewFeatureIdea, generateTechDesign, updateDocumentation };
};
