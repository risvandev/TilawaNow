/**
 * TilawaNow - A modern Quran platform.
 * Copyright (c) 2026 Muhammed Risvan.
 * Licensed under the GNU Affero General Public License v3.0.
 */

import getPuter from "./puter-service";
import { fetchTafsir, fetchSingleVerse, fetchSurahOverview, TAFSIR_RESOURCES } from "./quran-api";

// Types
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export type AIChatMode = 'Quick' | 'Research';

export interface GroundingContext {
    verseKey?: string;
    surahId?: number;
    mode: AIChatMode;
}

// Tool Executor
export async function executeTextToolCall(toolName: string, verseKey: string): Promise<string> {
    if (!verseKey) return "Error: Missing verseKey.";
    const name = toolName.trim().toLowerCase();
    
    try {
        if (name === "get_arabic_text") {
            if (!verseKey) return "Error: Missing verseKey.";
            const verse = await fetchSingleVerse(verseKey);
            return verse?.text_uthmani ? `Arabic Text for ${verseKey}: ${verse.text_uthmani}` : "Verse not found.";
        } else if (name === "get_translation") {
            if (!verseKey) return "Error: Missing verseKey.";
            const verse = await fetchSingleVerse(verseKey);
            return verse?.translations?.[0]?.text ? `Translation for ${verseKey}: ${verse.translations[0].text}` : "Translation not found.";
        } else if (name === "get_tafsir") {
            if (!verseKey) return "Error: Missing verseKey.";
            const tafsir = await fetchTafsir(verseKey, TAFSIR_RESOURCES.IBN_KATHIR_EN);
            return tafsir?.text ? `Tafsir for ${verseKey}:\n${tafsir.text}` : "Tafsir not found.";
        } else if (name === "get_surah_info") {
            const sid = parseInt(verseKey);
            if (!sid || isNaN(sid)) return "Error: Missing or invalid surahId.";
            const info = await fetchSurahOverview(sid);
            return info ? `Surah ${info.name} Details:\nRevelation Place: ${info.revelation_place}\nTotal Verses: ${info.verses_count}\nOverview: ${info.info_text}` : "Surah info not found.";
        }
    } catch (e) {
        return `Error executing tool: ${e}`;
    }
    return "Unknown tool command.";
}

export function getToolStatusMessage(toolName: string): string {
    const name = toolName.trim().toLowerCase();
    switch (name) {
        case "get_arabic_text": return "Fetching Verse Data...";
        case "get_translation": return "Retrieving Translation...";
        case "get_tafsir": return "Analyzing Classical Tafsir...";
        case "get_surah_info": return "Fetching Surah Details...";
        case "web_search": return "Searching the Web...";
        default: return "Analyzing...";
    }
}

/**
 * Pre-flight Check: Determines if the user's message requires calling a tool.
 * Returns an array of tool commands, e.g., [{ tool: "get_tafsir", verseKey: "1:1" }]
 */
export const determineRequiredTools = async (
    messages: ChatMessage[],
    options: GroundingContext = { mode: 'Quick' }
): Promise<{tool: string, verseKey?: string, surahId?: number}[]> => {
    if (typeof window === "undefined") return [];

    try {
        const puter = getPuter();
        if (!puter) throw new Error("Puter.js SDK not initialized");

        const routerPrompt = `You are a routing agent. Does the user's request require fetching exact Quranic text, a translation, Tafsir, or general Surah Information? 
If YES, reply ONLY with a JSON array of tool objects.
Examples: 
- [{"tool": "get_tafsir", "verseKey": "1:1"}]
- [{"tool": "get_surah_info", "surahId": 1}]
If NO, reply ONLY with an empty array: []
Valid tools: get_arabic_text, get_translation, get_tafsir, get_surah_info. Verse keys must be single ayah format (e.g. 1:1, NEVER 1:1-7).`;

        const routerMessages = [
            { role: "system", content: routerPrompt },
            ...messages.slice(-3) // Only look at recent context to decide
        ];

        const chatOptions = { model: 'gpt-4o-mini', stream: false };
        const response = (await puter.ai.chat(routerMessages, chatOptions)) as any;
        const resultText = response?.message?.content || response?.text || "[]";
        
        try {
            // Find JSON array in the response (sometimes the model wraps in markdown)
            const jsonMatch = resultText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const tools = JSON.parse(jsonMatch[0]);
                if (Array.isArray(tools)) return tools;
            }
        } catch (e) {
            console.error("Failed to parse router JSON", resultText);
        }
    } catch (error) {
        console.error("Router error:", error);
    }
    return [];
};

/**
 * Pure Streaming Chat calling Puter.js (No recursive tool logic)
 */
export const streamChatWithAI = async (
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    options: GroundingContext = { mode: 'Quick' }
): Promise<void> => {
    if (typeof window === "undefined") return;

    try {
        const puter = getPuter();
        if (!puter) throw new Error("Puter.js SDK not initialized");

        const isAdvanced = options.mode !== 'Quick';
        const model = isAdvanced ? 'gpt-4o' : 'gpt-4o-mini';

        const chatOptions: any = { model, stream: true };

        // Smooth streaming queue
        const queue: string[] = [];
        let isProcessingQueue = false;
        let isStreamFinished = false;

        const processQueue = () => {
            if (queue.length === 0) {
                if (isStreamFinished) {
                    isProcessingQueue = false;
                } else {
                    setTimeout(processQueue, 16);
                }
                return;
            }

            isProcessingQueue = true;
            const nextPiece = queue.shift()!;
            onChunk(nextPiece);
            setTimeout(processQueue, 16);
        };

        const pushToQueue = (text: string) => {
            const chunkSize = 3;
            for (let i = 0; i < text.length; i += chunkSize) {
                queue.push(text.slice(i, i + chunkSize));
            }
            if (!isProcessingQueue) {
                processQueue();
            }
        };

        const responseStream = (await puter.ai.chat(messages, chatOptions)) as any;

        if (responseStream && typeof responseStream[Symbol.asyncIterator] === 'function') {
            for await (const part of responseStream) {
                const text = part?.text || part?.message?.content || part?.delta?.content || (typeof part === 'string' ? part : '');
                if (text) pushToQueue(text);
            }
        } else if (responseStream?.message?.content || responseStream?.text) {
            pushToQueue(responseStream.message?.content || responseStream.text || "");
        }

        isStreamFinished = true;
        while (queue.length > 0 || isProcessingQueue) {
            await new Promise(r => setTimeout(r, 20));
        }

    } catch (error: any) {
        console.error("AI Stream Error:", error);
        onChunk("\n\n[Connection interrupted. Please try again.]");
        throw error;
    }
};

/**
 * Single-shot Chat calling Puter.js
 */
export const chatWithAI = async (
    messages: ChatMessage[],
    options: GroundingContext = { mode: 'Quick' }
): Promise<string> => {
    if (typeof window === "undefined") return "";

    try {
        const puter = getPuter();
        if (!puter) throw new Error("Puter.js SDK not initialized");

        const isAdvanced = options.mode !== 'Quick';
        const model = isAdvanced ? 'gpt-4o' : 'gpt-4o-mini';
        
        let tools: any = undefined;
        if (options.mode === 'Research') {
            tools = [{ type: "web_search" }];
        }

        const chatOptions: any = { model, stream: false };
        if (tools) chatOptions.tools = tools;

        const response = (await puter.ai.chat(messages, chatOptions)) as any;
        return response?.message?.content || response?.text || "";
    } catch (error: any) {
        console.error("AI Chat Error:", error);
        throw error;
    }
};

/**
 * Utility to generate context-aware system prompts
 */
export function generateCompanionSystemPrompt(memory: any, basePrompt: string) {
    const contextSection = `
CURRENT USER CONTEXT:
- Reading Position: ${memory.currentPosition?.verseKey || 'Overview'}

FORMATTING: 
- Use structured markdown (headers, bold, bullets).
- Mimic the clean, professional visual style of ChatGPT/Gemini.

NAVIGATION:
- [[NAVIGATE:/path]] (LOWERCASE)
- [[OFFER_NAVIGATE:/path|Label]]
`;

    return basePrompt + contextSection;
}
