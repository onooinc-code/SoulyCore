import { NextRequest, NextResponse } from 'next/server';
import { generateChatResponse, generateEmbedding, generateProactiveSuggestion } from '@/lib/gemini-server';
import { sql } from '@/lib/db';
import { knowledgeBaseIndex } from '@/lib/pinecone';
import { Content } from "@google/genai";
import { Message } from '@/lib/types';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const { messages, conversation } = await req.json();
        
        if (!messages || !conversation) {
            return NextResponse.json({ error: 'Missing messages or conversation data' }, { status: 400 });
        }
        
        const userMessage = messages[messages.length - 1];

        // 1. Fetch Structured Memory (Entities)
        let entityContext = '';
        if (conversation.useStructuredMemory) {
            const { rows: entities } = await sql`SELECT name, type, details_json FROM entities`;
            if (entities.length > 0) {
                 entityContext = "CONTEXT: You know about these entities:\n" + entities.map(e => `- ${e.name} (${e.type}): ${e.details_json}`).join('\n');
            }
        }

        // 2. Fetch Semantic Memory (Knowledge from Pinecone)
        let semanticContext = '';
        if (conversation.useSemanticMemory) {
            const queryEmbedding = await generateEmbedding(userMessage.content);
            const queryResponse = await knowledgeBaseIndex.query({
                vector: queryEmbedding,
                topK: 3,
                includeMetadata: true,
            });
            const relevantKnowledge = queryResponse.matches.map(match => (match.metadata as { text: string }).text).join('\n\n');
            if (relevantKnowledge) {
                semanticContext = `CONTEXT: Here is some relevant information from your knowledge base:\n${relevantKnowledge}`;
            }
        }

        // 3. Construct the full prompt history
        const history: Content[] = messages.slice(0, -1).map((msg: Message) => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));
        
        // Inject context directly before the user's final message for maximum relevance
        const contextualPrompt = [entityContext, semanticContext, userMessage.content].filter(Boolean).join('\n\n');
        history.push({ role: 'user', parts: [{ text: contextualPrompt }]});

        // 4. Generate AI Response
        const result = await generateChatResponse(
            history, 
            conversation.systemPrompt
        );
        
        if (!result) {
            return NextResponse.json({ error: 'Failed to get response from AI.' }, { status: 500 });
        }

        const responseText = result.text;
        
        // 5. Generate Proactive Suggestion (non-blocking)
        let suggestion = null;
        if (history.length > 1) { // Only suggest after at least one exchange
             const suggestionHistory = [...history, { role: 'model', parts: [{ text: responseText }] }];
             suggestion = await generateProactiveSuggestion(suggestionHistory);
        }

        return NextResponse.json({ response: responseText, suggestion });

    } catch (error) {
        console.error('Error in chat API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
