

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Content } from "@google/genai";
import { Message } from '@/lib/types';
import { generateChatResponse, generateProactiveSuggestion } from '@/lib/gemini-server';

/* V2 Architecture Imports (Temporarily Disabled)
import { ContextAssemblyPipeline } from '@/core/pipelines/context_assembly';
import { EpisodicMemoryModule } from '@/core/memory/modules/episodic';
import llmProvider from '@/core/llm';
*/


// The serverLog function is used in both legacy and V2 paths.
async function serverLog(message: string, payload?: any, level: 'info' | 'warn' | 'error' = 'info') {
    try {
        await sql`
            INSERT INTO logs (message, payload, level)
            VALUES (${message}, ${payload ? JSON.stringify(payload) : null}, ${level});
        `;
    } catch (e) {
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

        // --- Start of Legacy Architecture (Build Fix) ---

        // 1. Prepare message history for the LLM
        const history: Content[] = messages.map((msg: Message) => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));

        const modelConfig = {
            temperature: conversation.temperature,
            topP: conversation.topP
        };

        // 2. Generate AI response using the legacy gemini-server library
        await serverLog('Generating AI response from gemini-server.ts', { model: 'gemini-2.5-flash', config: modelConfig });
        
        const result = await generateChatResponse(
            history, 
            conversation.systemPrompt,
            modelConfig
        );
        
        const responseText = result?.text?.trim() || null;
        
        if (!responseText) {
            await serverLog('Failed to get response from gemini-server.ts.', { history }, 'error');
            return NextResponse.json({ error: 'Failed to get response from AI.' }, { status: 500 });
        }
        await serverLog('Successfully received AI response from gemini-server.ts.');

        // 3. Generate proactive suggestion using the legacy gemini-server library
        const suggestion = await generateProactiveSuggestion(history);
        
        // Note: In the legacy flow, the client-side AppProvider is responsible for
        // saving the AI's message to the database after receiving this response.

        return NextResponse.json({ response: responseText, suggestion });

        // --- End of Legacy Architecture (Build Fix) ---


        /*
        // --- Start of V2 Architecture Integration (Temporarily Disabled) ---

        // 1. Instantiate Core Services
        const contextPipeline = new ContextAssemblyPipeline();
        const episodicMemory = new EpisodicMemoryModule();
        
        // 2. Assemble Context using the new pipeline
        await serverLog('V2: Assembling context via pipeline...');
        const contextString = await contextPipeline.assembleContext({
            conversationId: conversation.id,
            userQuery: userMessageContent,
            mentionedContacts,
        });
        if (contextString) {
             await serverLog('V2: Context assembled successfully.', { contextLength: contextString.length });
        }
       
        // 3. Prepare message history for the LLM
        const history: Content[] = messages.slice(0, -1).map((msg: Message) => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));
        
        const finalUserPrompt = [contextString, userMessageContent].filter(Boolean).join('\n\n---\n\n');
        history.push({ role: 'user', parts: [{ text: finalUserPrompt }] });

        const modelConfig = {
            temperature: conversation.temperature,
            topP: conversation.topP
        };

        // 4. Generate AI response using the new LLM Provider
        await serverLog('V2: Generating AI response from LLMProvider', { model: 'gemini-2.5-flash', config: modelConfig });
        const responseText = await llmProvider.generateContent(
            history, 
            conversation.systemPrompt,
            modelConfig
        );
        
        if (!responseText) {
            await serverLog('V2: Failed to get response from LLMProvider.', { history }, 'error');
            return NextResponse.json({ error: 'Failed to get response from AI.' }, { status: 500 });
        }
        await serverLog('V2: Successfully received AI response.');

        // 5. Persist the AI's response to episodic memory
        const aiMessage: Omit<Message, 'id' | 'createdAt' | 'conversationId'> = {
            role: 'model',
            content: responseText,
        };
        await episodicMemory.store({ conversationId: conversation.id, message: aiMessage });
        await serverLog('V2: AI response stored in episodic memory.');

        // --- End of V2 Architecture Integration ---
        
        // Suggestion generation can be re-added later. For now, we return null.
        const suggestion = null;

        return NextResponse.json({ response: responseText, suggestion });
        */

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
