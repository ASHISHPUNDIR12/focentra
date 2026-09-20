import assert from "node:assert/strict";
import { test } from "node:test";
import { readApiResponse } from "./api-response.ts";

const fallback = "Room sounds couldn’t load. Please try again.";
test("HTML error pages produce a readable error instead of a JSON syntax error", async () => {
    for (const status of [200, 404, 500]) {
        const response = new Response('<!DOCTYPE html><html>Error</html>', {
            status, headers: { "content-type": "text/html" },
        });
        await assert.rejects(readApiResponse(response, fallback), { message: fallback });
    }
});
test("malformed JSON also provides a retryable message", async () => {
    await assert.rejects(readApiResponse(new Response('<!DOCTYPE html>', {
        headers: { "content-type": "application/json" },
    }), fallback), { message: fallback });
});
test("JSON API errors preserve their useful message", async () => {
    await assert.rejects(readApiResponse(Response.json({ message: "Only the creator can change sound" }, { status: 403 }), fallback), {
        message: "Only the creator can change sound",
    });
});
test("successful music payloads are returned", async () => {
    const data = { music: { trackId: "rain", revision: 1 } };
    assert.deepEqual(await readApiResponse(Response.json(data), fallback), data);
});
