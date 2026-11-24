import assert from "node:assert/strict";
import { test } from "node:test";
import { getAssistantPath } from "../src/lib/assistant-navigation.ts";
import { sanitizeQuranMarkup, sanitizeTajweedMarkup } from "../src/lib/quran-markup.ts";
import { contactInput, createRateLimiter, donationInput, readJson } from "../src/lib/request-validation.ts";

test("the source formatting needed by the Quran reader is preserved", () => {
  assert.equal(sanitizeTajweedMarkup("<rule class=ham_wasl>ٱ</rule>للَّهِ"), '<rule class="ham_wasl">ٱ</rule>للَّهِ');
  assert.equal(sanitizeQuranMarkup('<p dir="rtl" style="color:red">نص<sup>1</sup></p>'), '<p dir="rtl">نص<sup>1</sup></p>');
});

test("assistant navigation accepts supported internal routes only", () => {
  assert.equal(getAssistantPath(" /READ | Read Quran"), "/read");
  assert.equal(getAssistantPath("https://example.com/read"), null);
  assert.equal(getAssistantPath("//example.com/read"), null);
});

test("malformed or oversized JSON is rejected before validation", async () => {
  const request = (body) => new Request("http://localhost/api/contact", { method: "POST", body });
  assert.equal(await readJson(request("{")), null);
  assert.equal(await readJson(request(JSON.stringify({ message: "أ".repeat(9_000) }))), null);
  assert.deepEqual(await readJson(request('{"message":"أ"}')), { message: "أ" });
});

test("contact and donation schemas reject invalid values", () => {
  assert.equal(contactInput.safeParse({ name: "Reader", email: "reader@example.com", subject: "Question", message: [] }).success, false);
  assert.equal(donationInput.safeParse({ amount: 5.03, currency: "USD" }).success, true);
  assert.equal(donationInput.safeParse({ amount: 5.031, currency: "USD" }).success, false);
  assert.equal(donationInput.safeParse({ amount: 5, currency: "OTHER" }).success, false);
  assert.equal(donationInput.safeParse({ amount: "5" }).success, false);
});

test("rate limits are independent and bounded", () => {
  const limited = createRateLimiter(2, 60_000, 2);
  assert.equal(limited("reader-a"), false);
  assert.equal(limited("reader-a"), false);
  assert.equal(limited("reader-a"), true);
  assert.equal(limited("reader-b"), false);
  assert.equal(limited("reader-c"), true);
});
