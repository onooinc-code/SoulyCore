import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Content } from "@google/genai";
import { Message } from '@/lib/types';
import { generateProactiveSuggestion } from '@/lib/gemini-server';
import { ContextAssemblyPipeline } from '@/core/pipelines/context_assembly';
import { EpisodicMemoryModule } from '@/core/memory/modules/episodic';
import llmProvider from '@/core/llm';

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
        
        await serverLog('V2 Chat API request received', { conversationId: conversation.id, messageCount: messages.length });
        const userMessageContent = messages[messages.length - 1].content;

        // --- Start of V2 Architecture Integration ---

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
        const history: Content[] = messages.map((msg: Message) => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));
        
        // Replace the last user message with the context-enhanced one
        const finalUserPrompt = [contextString, userMessageContent].filter(Boolean).join('\n\n');
        history[history.length-1].parts = [{ text: finalUserPrompt }];
        

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

        // 5. Persist the AI's response to episodic memory using the new module
        const aiMessageData: Omit<Message, 'id' | 'createdAt' | 'conversationId'> = {
            role: 'model',
            content: responseText,
        };
        // Note: The client will receive the response first for speed, but the server now handles
        // saving the AI message, differing from the legacy flow.
        await episodicMemory.store({ conversationId: conversation.id, message: aiMessageData });
        await serverLog('V2: AI response stored in episodic memory.');
        
        // 6. Generate proactive suggestion (can still use legacy helper for this)
        const suggestion = await generateProactiveSuggestion(history);

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