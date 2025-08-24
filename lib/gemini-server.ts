import { GoogleGenAI, Type, GenerateContentResponse, Content } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY not set in environment.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const modelName = 'gemini-2.5-flash';

export const generateEmbedding = async (text: string): Promise<number[]> => {
    // NOTE: As the GenAI SDK does not have a dedicated embedding endpoint, this function simulates
    // the embedding process. In a production scenario with a specific embedding model, this
    // would be replaced with a direct API call to that model.
    console.warn("`generateEmbedding` is a placeholder. Using a simulated text-hash-based embedding.");
    
    // Simple hashing to create a deterministic vector from text
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }

    const embedding = Array(768).fill(0).map((_, i) => {
        // Create a pseudo-random but deterministic vector based on the hash
        return Math.sin(hash + i * 0.1);
    });

    return embedding;
};


export const generateChatResponse = async (
    history: Content[],
    systemInstruction: string,
): Promise<GenerateContentResponse | null> => {
    try {
        const result = await ai.models.generateContent({
            model: modelName,
            contents: history,
            config: {
                systemInstruction: systemInstruction || "You are a helpful AI assistant.",
                temperature: 0.7,
                topP: 0.95,
            }
        });
        return result;
    } catch (e) {
        console.error("Chat generation failed:", e);
        return null;
    }
};

export const extractDataFromText = async (text: string): Promise<{ entities: any[], knowledge: string[] }> => {
    try {
        const prompt = `
            From the following text, perform two tasks:
            1. Extract key entities (people, places, organizations, projects, concepts).
            2. Extract distinct, self-contained chunks of information that could be useful knowledge for the future.
            
            Return the result as a single JSON object with two keys: "entities" and "knowledge".
            - "entities" should be an array of objects, each with "name", "type", and "details" properties.
            - "knowledge" should be an array of strings. Do not extract trivial statements.

            Text:
            ---
            ${text}
            ---
        `;

        const result = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        entities: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    type: { type: Type.STRING },
                                    details: { type: Type.STRING }
                                },
                                required: ['name', 'type', 'details']
                            }
                        },
                        knowledge: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ['entities', 'knowledge']
                }
            }
        });
        
        const jsonStr = result.text.trim();
        return JSON.parse(jsonStr);

    } catch (e) {
        console.error("Data extraction failed:", e);
        return { entities: [], knowledge: [] };
    }
};

export const generateProactiveSuggestion = async (history: Content[]): Promise<string | null> => {
    if (history.length < 2) return null; // Needs at least one user/model exchange

    try {
         const prompt = `Based on the last few messages of this conversation, suggest a relevant proactive action. For example, if they are talking about a person, suggest mentioning them with @. If they discuss planning, suggest creating a task. Be concise and phrase it as a question. If no action is obvious, return an empty string. Conversation:\n\n${history.slice(-4).map(m => `${m.role}: ${m.parts[0].text}`).join('\n')}`;

         const result = await ai.models.generateContent({ model: modelName, contents: prompt });
         return result.text.trim() || null;

    } catch(e) {
        console.error("Suggestion generation failed:", e);
        return null;
    }
}
