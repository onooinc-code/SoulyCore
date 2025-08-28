





import { NextRequest, NextResponse } from 'next/server';
import { generateChatResponse, generateEmbedding, generateProactiveSuggestion } from '@/lib/gemini-server';
import { sql } from '@/lib/db';
import { knowledgeBaseIndex } from '@/lib/pinecone';
import { Content } from "@google/genai";
import { Message, Contact } from '@/lib/types';

async function serverLog(message: string, payload?: any, level: 'info' | 'warn' | 'error' = 'info') {
    try {
        await sql`
            INSERT INTO logs (message, payload, level)
            VALUES (${message}, ${payload ? JSON.stringify(payload) : null}, ${level});
        `;
    } catch (e) {
        // Fallback to console if DB logging fails
        console.error("Failed to write log to database:", e);
        console.log(`[${level.toUpperCase()}] ${message}`, payload || '');
    }
}

export async function POST(req: NextRequest) {
    try {
        const { messages, conversation, mentionedContacts } = await req.json();
        
        if (!messages || !conversation) {
            await serverLog('Chat API called with missing data', { messages, conversation }, 'warn');
            return NextResponse.json({ error: 'Missing messages or conversation data' }, { status: 400 });
        }
        
        await serverLog('Chat API request received', { conversationId: conversation.id, messageCount: messages.length });

        const userMessage = messages[messages.length - 1];
        let userMessageContent = userMessage.content;
        let imagePart: { inlineData: { mimeType: string; data: string } } | null = null;

        const imageRegex = /!\[.*?\]\((data:image\/(.*?);base64,([a-zA-Z0-9+/=]+))\)/;
        const match = userMessage.content.match(imageRegex);

        if (match) {
            const [fullMatch, , mimeSubtype, base64Data] = match;
            const mimeType = `image/${mimeSubtype}`;
            
            imagePart = {
                inlineData: {
                    mimeType,
                    data: base64Data,
                },
            };
            
            userMessageContent = userMessage.content.replace(fullMatch, '').trim();
            await serverLog('Image detected and extracted from user message');
        }

        let entityContext = '';
        if (conversation.useStructuredMemory) {
            const { rows: entities } = await sql`SELECT name, type, details_json FROM entities`;
            if (entities.length > 0) {
                 entityContext = "CONTEXT: You know about these entities:\n" + entities.map(e => `- ${e.name} (${e.type}): ${e.details_json}`).join('\n');
                 await serverLog('Fetched and injected structured memory context', { entityCount: entities.length });
            }
        }

        let semanticContext = '';
        if (conversation.useSemanticMemory) {
            const queryEmbedding = await generateEmbedding(userMessageContent);
            if(queryEmbedding.length > 0) {
                const queryResponse = await knowledgeBaseIndex.query({
                    vector: queryEmbedding,
                    topK: 3,
                    includeMetadata: true,
                });
                const relevantKnowledge = queryResponse.matches.map(match => (match.metadata as { text: string }).text).join('\n\n');
                if (relevantKnowledge) {
                    semanticContext = `CONTEXT: Here is some relevant information from your knowledge base:\n${relevantKnowledge}`;
                    await serverLog('Fetched and injected semantic memory context', { matchCount: queryResponse.matches.length });
                }
            }
        }
        
        let contactContext = '';
        if (mentionedContacts && mentionedContacts.length > 0) {
            contactContext = "CONTEXT: You have the following context about people mentioned in this message:\n" +
                (mentionedContacts as Contact[]).map(c => 
                    `- Name: ${c.name}\n  Email: ${c.email || 'N/A'}\n  Company: ${c.company || 'N/A'}\n  Notes: ${c.notes || 'N/A'}`
                ).join('\n\n');
            await serverLog('Injected mentioned contacts context', { contactCount: mentionedContacts.length });
        }

        const history: Content[] = messages.slice(0, -1).map((msg: Message) => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));
        
        const contextualPrompt = [entityContext, semanticContext, contactContext, userMessageContent].filter(Boolean).join('\n\n');
        
        const userParts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [];
        if (imagePart) {
            userParts.push(imagePart);
        }
        // FIX: Ensure contextualPrompt is added as a text part, even if it's the only part.
        if (contextualPrompt) {
            userParts.push({ text: contextualPrompt });
        }

        if (userParts.length > 0) {
            history.push({ role: 'user', parts: userParts });
        }
        
        const modelConfig = {
            temperature: conversation.temperature,
            topP: conversation.topP
        };

        await serverLog('Generating AI response from Gemini', { model: 'gemini-2.5-flash', config: modelConfig });
        const result = await generateChatResponse(
            history, 
            conversation.systemPrompt,
            modelConfig
        );
        
        if (!result) {
            await serverLog('Failed to get response from AI.', { history }, 'error');
            return NextResponse.json({ error: 'Failed to get response from AI.' }, { status: 500 });
        }

        // FIX: Per @google/genai guidelines, access the text property directly from the response object.
        const responseText = result.text;
        await serverLog('Successfully received AI response');
        
        let suggestion = null;
        if (history.length > 1) {
             await serverLog('Generating proactive suggestion...');
             const suggestionHistory = [...history, { role: 'model', parts: [{ text: responseText }] }];
             suggestion = await generateProactiveSuggestion(suggestionHistory);
             if (suggestion) {
                await serverLog('Proactive suggestion generated.', { suggestion });
             }
        }

        return NextResponse.json({ response: responseText, suggestion });

    } catch (error) {
        const errorDetails = {
            message: (error as Error).message,
            stack: (error as Error).stack,
        };
        console.error('Error in chat API:', error);
        await serverLog('Critical error in chat API', { error: errorDetails }, 'error');
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}