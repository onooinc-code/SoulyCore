import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Content } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY not set in environment.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const modelName = 'gemini-2.5-flash';

export const generateEmbedding = async (text: string): Promise<number[]> => {
    // Note: The GenAI SDK does not directly expose an embedding endpoint.
    // This is a conceptual placeholder. In a real application with a dedicated embedding model,
    // you would use the specific API for that. For this project, we simulate this function.
    console.warn("`generateEmbedding` is a placeholder. Using a simulated embedding.");
    const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const embedding = Array(768).fill(0).map((_, i) => Math.sin(hash + i));
    return embedding;
};


export const generateChatResponseStream = async (
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
            - "knowledge" should be an array of strings.

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
                                }
                            }
                        },
                        knowledge: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        
        let jsonStr = result.text.trim();
        return JSON.parse(jsonStr);

    } catch (e) {
        console.error("Data extraction failed:", e);
        return { entities: [], knowledge: [] };
    }
};
