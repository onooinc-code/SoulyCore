export type Role = 'user' | 'model';

export interface Conversation {
    id: string;
    agentId: string;
    title: string;
    summary: string | null;
    createdAt: Date;
    lastUpdatedAt: Date;
    systemPrompt?: string;
    memoryConfig?: {
        useSemantic: boolean;
        useStructured: boolean;
    };
}

export interface Message {
    id: string;
    conversationId: string;
    role: Role;
    content: string;
    createdAt: Date;
    tokenCount: number;
    responseTime: number | null;
    isBookmarked: boolean;
}

export interface Contact {
    id: string;
    name: string;
    email: string;
    company: string;
    tags: string[];
    notes: string;
    createdAt: Date;
}

export interface Knowledge {
    id: string;
    content: string;
    embedding: number[];
    source: string;
}

export interface Entity {
    id: string;
    name: string;
    type: string;
    details_json: string;
}

export interface Tool {
    id:string;
    name: string;
    description: string;
    schema_json: string;
}

export interface Cache {
    key: string;
    value: string;
    expiresAt: Date;
}