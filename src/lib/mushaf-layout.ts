import type { Verse, Word } from "./quran-api";

export interface MushafToken {
  word: Word;
  verse: Verse;
}

export function groupMushafPages(verses: Verse[]) {
  const pages = new Map<number, Map<number, MushafToken[]>>();
  for (const verse of verses) {
    for (const word of verse.words ?? []) {
      const page = word.v2_page || word.page_number || verse.page_number;
      let lines = pages.get(page);
      if (!lines) pages.set(page, lines = new Map());
      const number = word.line_number;
      let tokens = lines.get(number);
      if (!tokens) lines.set(number, tokens = []);
      tokens.push({ verse, word });
    }
  }
  return Array.from(pages, ([page, lines]) => ({
    page,
    lines: [...lines].sort(([a], [b]) => a - b),
  })).sort((a, b) => a.page - b.page);
}

export type MushafPageData = ReturnType<typeof groupMushafPages>[number];
