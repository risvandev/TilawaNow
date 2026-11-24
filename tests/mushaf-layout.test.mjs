import assert from "node:assert/strict";
import { test } from "node:test";
import { groupMushafPages } from "../src/lib/mushaf-layout.ts";

test("preserves word and verse-marker order across printed lines and pages", () => {
  const word = (position, page_number, line_number, char_type_name = "word") => ({
    position, page_number, line_number, char_type_name,
  });
  const verses = [
    { verse_key: "a", page_number: 1, words: [word(1, 1, 15), word(2, 2, 1), word(3, 2, 1, "end")] },
    { verse_key: "b", page_number: 2, words: [word(1, 2, 1), word(2, 2, 2, "end")] },
  ];
  const layout = groupMushafPages(verses);
  assert.deepEqual(layout.map(({ page, lines }) => [page, lines.map(([line, tokens]) =>
    [line, tokens.map(({ verse, word }) => verse.verse_key + word.position)])]),
    [[1, [[15, ["a1"]]]], [2, [[1, ["a2", "a3", "b1"]], [2, ["b2"]]]]]);
});
