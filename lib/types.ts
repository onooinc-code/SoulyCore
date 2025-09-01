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
    enableMemoryExtraction?: boolean;
    enableProactiveSuggestions?: boolean;
    enableAutoSummarization?: boolean;
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

export interface PromptChainStep {
    step: number;
    promptId: string;
    inputMapping: Record<string, { source: 'userInput' | 'stepOutput'; step?: number }>;
}

export interface Prompt {
    id: string;
    name: string;
    content: string;
    folder?: string | null;
    tags?: string[] | null;
    createdAt: Date;
    lastUpdatedAt: Date;
    type: 'single' | 'chain';
    chain_definition?: PromptChainStep[] | null;
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
    featureFlags: {
        enableMemoryExtraction: boolean;
        enableProactiveSuggestions: boolean;
        enableAutoSummarization: boolean;
    };
}

export interface Log {
    id: string;
    timestamp: Date;
    message: string;
    payload: Record<string, any> | null;
    level: 'info' | 'warn' | 'error';
}

export type TestStatus = 'Passed' | 'Failed' | 'Not Run';

export interface FeatureTest {
    id: string;
    featureId: string;
    description: string;
    manual_steps: string | null;
    expected_result: string;
    last_run_status: TestStatus;
    last_run_at: Date | null;
    createdAt: Date;
}

export interface Brain {
    id: string;
    name: string;
    config_json: Record<string, any>;
    createdAt: Date;
}

export type ApiTestStatus = 'Passed' | 'Failed' | 'Not Run';

export interface ApiEndpoint {
    id: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    group_name: string;
    description: string | null;
    default_params_json: Record<string, any> | null;
    default_body_json: Record<string, any> | null;
    expected_status_code: number;
    last_test_status: ApiTestStatus;
    last_test_at: Date | null;
    createdAt: Date;
}

export interface EndpointTestLog {
    id: string;
    endpoint_id: string;
    status: ApiTestStatus;
    status_code: number;
    response_body: Record<string, any> | null;
    response_headers: Record<string, any> | null;
    duration_ms: number;
    createdAt: Date;
}

export interface PipelineRun {
    id: string;
    message_id: string;
    pipeline_type: 'ContextAssembly' | 'MemoryExtraction';
    status: 'running' | 'completed' | 'failed';
    final_output: string | null;
    error_message: string | null;
    start_time: Date;
    end_time: Date | null;
    duration_ms: number | null;
}

export interface PipelineRunStep {
    id: string;
    run_id: string;
    step_order: number;
    step_name: string;
    status: 'completed' | 'failed';
    input_payload: Record<string, any> | null;
    output_payload: Record<string, any> | null;
    model_used: string | null;
    prompt_used: string | null;
    config_used: Record<string, any> | null;
    error_message: string | null;
    start_time: Date;
    end_time: Date | null;
    duration_ms: number | null;
}

export interface Documentation {
    id: string;
    doc_key: string;
    title: string;
    content: string;
    lastUpdatedAt: Date;
}

export interface HedraGoal {
    id: string;
    section_key: 'main_goal' | 'ideas' | 'status';
    content: string;
    lastUpdatedAt: Date;
}