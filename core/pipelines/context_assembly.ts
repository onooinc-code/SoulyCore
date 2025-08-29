
/**
 * @fileoverview Implements the Context Assembly Pipeline (Read Path).
 * This service orchestrates queries across all relevant memory modules to build a
 * compact, optimized context block for the LLM on each conversational turn.
 */

import { EpisodicMemoryModule } from '../memory/modules/episodic';
import { SemanticMemoryModule, ISemanticQueryResult } from '../memory/modules/semantic';
import { StructuredMemoryModule } from '../memory/modules/structured';
import type { Contact } from '@/lib/types';

interface IAssembleContextParams {
    conversationId: string;
    userQuery: string;
    mentionedContacts?: Contact[];
}

export class ContextAssemblyPipeline {
    private episodicMemory: EpisodicMemoryModule;
    private semanticMemory: SemanticMemoryModule;
    private structuredMemory: StructuredMemoryModule;

    constructor() {
        this.episodicMemory = new EpisodicMemoryModule();
        this.semanticMemory = new SemanticMemoryModule();
        this.structuredMemory = new StructuredMemoryModule();
    }

    /**
     * Assembles a contextual string for the LLM by querying various memory sources.
     * @param params - An object containing the conversationId, userQuery, and any mentioned contacts.
     * @returns A promise that resolves to a single, formatted string of context.
     */
    async assembleContext(params: IAssembleContextParams): Promise<string> {
        const { conversationId, userQuery, mentionedContacts } = params;
        const contextParts: string[] = [];

        // 1. Fetch Structured Memory (Entities) - broad match for now
        // A more advanced implementation would parse the userQuery for entity names.
        const allEntities = await this.structuredMemory.query({ type: 'entity' }) as any[];
        if (allEntities.length > 0) {
            const entityContext = "CONTEXT: You know about these entities:\n" +
                allEntities.map(e => `- ${e.name} (${e.type}): ${e.details_json}`).join('\n');
            contextParts.push(entityContext);
        }

        // 2. Fetch Semantic Memory (Knowledge Base)
        const semanticResults = await this.semanticMemory.query({ queryText: userQuery, topK: 3 });
        if (semanticResults.length > 0) {
            const relevantKnowledge = semanticResults
                .map((match: ISemanticQueryResult) => match.text)
                .join('\n\n');
            const semanticContext = `CONTEXT: Here is some relevant information from your knowledge base:\n${relevantKnowledge}`;
            contextParts.push(semanticContext);
        }

        // 3. Fetch Contact Context
        if (mentionedContacts && mentionedContacts.length > 0) {
            const contactContext = "CONTEXT: You have the following context about people mentioned in this message:\n" +
                mentionedContacts.map(c =>
                    `- Name: ${c.name}\n  Email: ${c.email || 'N/A'}\n  Company: ${c.company || 'N/A'}\n  Notes: ${c.notes || 'N/A'}`
                ).join('\n\n');
            contextParts.push(contactContext);
        }

        return contextParts.join('\n\n');
    }
}
