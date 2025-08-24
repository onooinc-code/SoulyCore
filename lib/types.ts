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
    phone: string | null;
    linkedin_url: string | null;
    address: string | null;
    tags: string[];
    notes: string;
    last_contacted_date: Date | null;
    details_json: string | null;
    createdAt: Date;
}

export interface Knowledge {
    id: string;
    content: string;
    source: string;
    createdAt: Date;
}

export interface Entity {
    id: string;
    name: string;
    type: string;
    details_json: string;
    createdAt: Date;
}

export interface Tool {
    id:string;
    name: string;
    description: string;
    schema_json: string;
}
