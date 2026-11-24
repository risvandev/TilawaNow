import assert from "node:assert/strict";
import { test } from "node:test";
import { readChatReply } from "../src/lib/chat-reply.ts";

test("streams visible text, preserving spaces and excluding reasoning", async () => {
    async function* stream() {
        yield { reasoning: "internal" };
        yield { text: "First" };
        yield { text: " " };
        yield { choices: [{ delta: { content: "reply" } }] };
    }
    const parts = [];
    await readChatReply(stream(), text => parts.push(text));
    assert.equal(parts.join(""), "First reply");
});

test("reads structured and plain completed replies", async () => {
    for (const response of ["Hello", { message: { content: [{ type: "text", text: "Hello" }] } }]) {
        const parts = [];
        await readChatReply(response, text => parts.push(text));
        assert.deepEqual(parts, ["Hello"]);
    }
});

test("reports an empty reply unless the user stopped it", async () => {
    await assert.rejects(readChatReply({ reasoning: "thinking" }, assert.fail), /no reply/);
    await readChatReply("late result", assert.fail, AbortSignal.abort());
});
