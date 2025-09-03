import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { AgentRun, AgentRunStep } from '@/lib/types';
import { GoogleGenAI, Type } from "@google/genai";
import { generateChatResponse } from '@/lib/gemini-server';

export const dynamic = 'force-dynamic';

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API key not found.");
  }
  return new GoogleGenAI({ apiKey });
};
// @google/genai-api-guideline-fix: Use 'gemini-2.5-flash' for general text tasks.
const modelName = 'gemini-2.5-flash';

// GET all runs
export async function GET() {
    try {
        const { rows } = await sql<AgentRun>`SELECT * FROM agent_runs ORDER BY "createdAt" DESC;`;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch agent runs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


// POST to create and execute a new run
export async function POST(req: NextRequest) {
    const { goal } = await req.json();
    if (!goal) {
        return NextResponse.json({ error: 'Goal is required' }, { status: 400 });
    }

    const startTime = Date.now();
    let runId: string = ''; // Initialize runId
    try {
        // Create initial run record
        const { rows: runRows } = await sql<AgentRun>`
            INSERT INTO agent_runs (goal, status) VALUES (${goal}, 'running') RETURNING *;
        `;
        const run = runRows[0];
        runId = run.id;

        let stepOrder = 1;
        const maxSteps = 15; // Increased max steps for complex tasks
        let history: { thought: string; action: any; observation: string }[] = [];

        for (let i = 0; i < maxSteps; i++) {
            const historyString = history.map((h, index) => 
                `Step ${index + 1}:\nThought: ${h.thought}\nAction: ${JSON.stringify(h.action)}\nObservation: ${h.observation}`
            ).join('\n\n---\n\n');

            const prompt = `
You are an autonomous agent designed to achieve a high-level goal by breaking it down into a sequence of smaller steps.

**Main Goal:** "${goal}"

**Available Tools:**
1. \`send_prompt(prompt: string)\`: Sends a prompt to a powerful AI assistant to get information or process text. Use this for research, analysis, and content generation.
2. \`finish(final_answer: string)\`: Use this action ONLY when you have fully completed the main goal and have the final, complete answer.

**Your Task:**
Based on the main goal and the history of your previous steps, decide on the very next action to take. You must follow the ReAct (Reason + Act) methodology.

1.  **Thought:** First, reason about your current situation. Analyze the goal, review the history, and decide what single, small step you need to take next to get closer to the final answer.
2.  **Action:** Formulate the action to take based on your thought. Your action MUST be one of the available tools.

**Output Format:**
Your response MUST be ONLY a single "Thought" followed by a single JSON block. Do NOT add any other text, explanations, or conversational filler.

**Execution History:**
${historyString || 'No steps taken yet.'}

**Your Next Step:**

Thought: [Your reasoning for the next single action]
\`\`\`json
{
  "action": "send_prompt" or "finish",
  "input": "If action is 'send_prompt', this is the precise text for the prompt. If 'finish', this is the final, comprehensive answer to the user's main goal."
}
\`\`\`
`;

            // 1. Get next thought and action from agent
            const ai = getAiClient();
            const agentResponse = await ai.models.generateContent({
                model: modelName,
                contents: prompt,
            });
            const responseText = agentResponse.text;
            
            if (!responseText) {
                throw new Error("Agent failed to generate a response. The response from the model was empty.");
            }

            const thoughtMatch = responseText.match(/Thought:\s*([\s\S]*?)(?=```json)/);
            const thought = thoughtMatch ? thoughtMatch[1].trim() : 'No thought process found.';
            
            const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
            if (!jsonMatch) {
                console.error("Invalid agent response format:", responseText);
                throw new Error('Agent did not return a valid JSON action block.');
            }
            
            let action;
            try {
                 action = JSON.parse(jsonMatch[1]);
            } catch(e) {
                console.error("Failed to parse JSON action block:", jsonMatch[1]);
                throw new Error('Agent returned a malformed JSON action block.');
            }


            // 2. Execute the action
            let observation = '';
            if (action.action === 'finish') {
                await sql<AgentRunStep>`
                    INSERT INTO agent_run_steps (run_id, step_order, thought, action_type, action_input, observation)
                    VALUES (${runId}, ${stepOrder}, ${thought}, ${action.action}, ${action.input ? JSON.stringify({input: action.input}) : null}, 'Goal marked as finished.');
                `;
                const duration = Date.now() - startTime;
                await sql`
                    UPDATE agent_runs 
                    SET status = 'completed', final_result = ${action.input}, "completedAt" = CURRENT_TIMESTAMP, duration_ms = ${duration}
                    WHERE id = ${runId};
                `;
                return NextResponse.json(run, { status: 201 });
            } else if (action.action === 'send_prompt') {
                const assistantResponse = await generateChatResponse([{ role: 'user', parts: [{ text: action.input }] }], 'You are a helpful assistant.');
                observation = assistantResponse?.text || 'No response from assistant.';
            } else {
                observation = `Error: Unknown action '${action.action}'. Available actions are 'send_prompt' and 'finish'.`;
            }

            // 3. Log the step and observation
            await sql<AgentRunStep>`
                INSERT INTO agent_run_steps (run_id, step_order, thought, action_type, action_input, observation)
                VALUES (${runId}, ${stepOrder}, ${thought}, ${action.action}, ${action.input ? JSON.stringify({input: action.input}) : null}, ${observation});
            `;
            
            history.push({ thought, action, observation });
            stepOrder++;
        }

        // If loop finishes due to max steps
        const duration = Date.now() - startTime;
        await sql`
            UPDATE agent_runs 
            SET status = 'failed', final_result = 'Agent reached maximum steps without finishing.', "completedAt" = CURRENT_TIMESTAMP, duration_ms = ${duration}
            WHERE id = ${runId};
        `;
        return NextResponse.json({ error: 'Agent reached max steps' }, { status: 500 });


    } catch (error) {
        console.error('Agent run failed:', error);
        const duration = Date.now() - startTime;
        if (runId) {
            await sql`
                UPDATE agent_runs 
                SET status = 'failed', final_result = ${(error as Error).message}, "completedAt" = CURRENT_TIMESTAMP, duration_ms = ${duration}
                WHERE id = ${runId};
            `;
        }
        return NextResponse.json({ error: 'Agent run failed', details: (error as Error).message }, { status: 500 });
    }
}
