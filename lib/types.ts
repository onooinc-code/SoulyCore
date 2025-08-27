export type Role = 'user' | 'model';

export interface Conversation {
    id: string;
    agentId: string;
    title: string;
    summary: string | null;
    createdAt: Date;
    lastUpdatedAt: Date;
    systemPrompt?: string;
    useSemanticMemory?: boolean;
    useStructuredMemory?: boolean;
    model?: string;
    temperature?: number;
    topP?: number;
}

export interface Message {
    id: string;
    conversationId: string;
    role: Role;
    content: string;
    createdAt: Date;
    tokenCount?: number;
    responseTime?: number | null;
    isBookmarked?: boolean;
}

export interface Contact {
    id: string;
    name: string;
    email?: string;
    company?: string;
    phone?: string;
    linkedin_url?: string;
    address?: string;
    tags?: string[];
    notes?: string;
    last_contacted_date?: Date;
    details_json?: Record<string, any>;
    createdAt: Date;
}


export interface Entity {
    id: string;
    name: string;
    type: string;
    details_json: string;
}

export type FeatureStatus = '✅ Completed' | '🟡 Needs Improvement' | '🔴 Needs Refactor' | '⚪ Planned';

export interface UiUxSubFeature {
    subFeature: string;
    description: string;
    status: FeatureStatus;
}

export interface Feature {
    id: string;
    name: string;
    overview: string;
    status: FeatureStatus;
    ui_ux_breakdown_json: string; // Stored as a JSON string
    logic_flow: string;
    key_files_json: string; // Stored as a JSON string
    notes: string;
    createdAt: Date;
    lastUpdatedAt: Date;
}


export interface Tool {
    id:string;
    name: string;
    description: string;
    schema_json: string;
}

export interface Knowledge {
    id: string;
    content: string;
    embedding: number[];
    source: string;
}

export interface Cache {
    key: string;
    value: string;
    expiresAt: Date;
}

export interface AppSettings {
    defaultModelConfig: {
        model: string;
        temperature: number;
        topP: number;
    };
    defaultAgentConfig: {
        systemPrompt: string;
        useSemanticMemory: boolean;
        useStructuredMemory: boolean;
    };
    enableDebugLog: {
        enabled: boolean;
    };
}

export interface Log {
    id: string;
    timestamp: Date;
    message: string;
    payload: Record<string, any> | null;
    level: 'info' | 'warn' | 'error';
}