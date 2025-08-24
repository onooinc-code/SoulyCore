import { NextRequest, NextResponse } from 'next/server';
import { generateChatResponseStream, generateEmbedding } from '../../../lib/gemini-server';
import { sql } from '@vercel/postgres';
import { knowledgeBaseIndex } from '../../../lib/pinecone';
import { Content } from "@google/genai";

export async function POST(req: NextRequest) {
    try {
        const { messages, conversation } = await req.json();
        
        const userMessage = messages[messages.length - 1];

        // 1. Fetch Structured Memory (Entities)
        const { rows: entities } = await sql`SELECT name, type, details_json FROM entities`;
        const entityContext = entities.length > 0
            ? "You know about these entities:\n" + entities.map(e => `- ${e.name} (${e.type}): ${e.details_json}`).join('\n')
            : '';

        // 2. Fetch Semantic Memory (Knowledge from Pinecone)
        let semanticContext = '';
        if (conversation.memoryConfig?.useSemantic) {
            const queryEmbedding = await generateEmbedding(userMessage.content);
            const queryResponse = await knowledgeBaseIndex.query({
                vector: queryEmbedding,
                topK: 3,
                includeMetadata: true,
            });
            const relevantKnowledge = queryResponse.matches.map(match => (match.metadata as { text: string }).text).join('\n\n');
            if (relevantKnowledge) {
                semanticContext = `Here is some relevant context from your knowledge base:\n${relevantKnowledge}`;
            }
        }

        // 3. Construct the full prompt
        const fullPrompt = `${entityContext}\n${semanticContext}\n${conversation.summary ? `Summary of conversation so far: ${conversation.summary}\n` : ''}User: ${userMessage.content}`.trim();

        const history: Content[] = messages.slice(0, -1).map((msg: any) => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));
        history.push({ role: 'user', parts: [{ text: fullPrompt }]});

        // 4. Generate AI Response
        const result = await generateChatResponseStream(
            history, 
            conversation.systemPrompt
        );
        
        if (!result) {
            return NextResponse.json({ error: 'Failed to get response from AI.' }, { status: 500 });
        }

        const responseText = result.text;

        return NextResponse.json({ response: responseText });

    } catch (error) {
        console.error('Error in chat API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
