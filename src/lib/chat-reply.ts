// Puter can return a stream of deltas or one completed message.
const record = (value: unknown): Record<string, unknown> =>
    typeof value === "object" && value !== null ? value as Record<string, unknown> : {};

function contentText(content: unknown): string {
    if (typeof content === "string") return content;
    const parts = Array.isArray(content) ? content : [content];
    return parts.map(part => {
        if (typeof part === "string") return part;
        const { type, text } = record(part);
        return (!type || type === "text" || type === "output_text") && typeof text === "string" ? text : "";
    }).join("");
}

export function replyText(part: unknown): string {
    if (typeof part === "string") return part;
    const data = record(part);
    const choice = record(Array.isArray(data.choices) ? data.choices[0] : undefined);
    return contentText(record(data.message).content) || contentText(record(data.delta).content)
        || contentText(record(choice.delta).content) || contentText(record(choice.message).content)
        || contentText(data);
}

export async function readChatReply(
    response: unknown, onChunk: (text: string) => void, signal?: AbortSignal
) {
    let hasText = false;
    const accept = (part: unknown) => {
        const text = replyText(part);
        if (text.trim()) hasText = true;
        if (text) onChunk(text);
    };
    if (signal?.aborted) return;
    if (response && typeof (response as AsyncIterable<unknown>)[Symbol.asyncIterator] === "function") {
        for await (const part of response as AsyncIterable<unknown>) {
            if (signal?.aborted) return;
            accept(part);
        }
    } else {
        accept(response);
    }
    if (!signal?.aborted && !hasText) throw new Error("The AI returned no reply.");
}
