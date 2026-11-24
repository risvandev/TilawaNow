"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MushafPageData } from "@/lib/mushaf-layout";
import { sanitizeTajweedMarkup } from "@/lib/quran-markup";

const fontLoads = new Map<number, Promise<FontFace>>();
function loadPageFont(page: number) {
  let pending = fontLoads.get(page);
  if (!pending) {
    const face = new FontFace(`Mushaf${page}`, `url(https://verses.quran.foundation/fonts/quran/hafs/v2/woff2/p${page}.woff2)`);
    pending = face.load().then(font => {
      document.fonts.add(font);
      return font;
    }).catch(error => {
      fontLoads.delete(page);
      throw error;
    });
    fontLoads.set(page, pending);
  }
  return pending;
}

interface Props {
  data: MushafPageData;
  script: string;
  currentVerseKey: string | null;
  currentWordPosition: number | null;
  onWord: (url: string | null) => void;
  onVerse: (key: string) => void;
}

export function MushafPage({ data: { page, lines }, script, currentVerseKey, currentWordPosition, onWord, onVerse }: Props) {
  const body = useRef<HTMLDivElement>(null);
  const [loadedPage, setLoadedPage] = useState(0);
  const useGlyphs = loadedPage === page && script === "text_uthmani";

  useEffect(() => {
    if (script !== "text_uthmani" || typeof FontFace === "undefined") return;
    let mounted = true;
    loadPageFont(page).then(() => { if (mounted) setLoadedPage(page); }).catch(() => {
      // Unicode remains readable while offline or if the page font is unavailable.
    });
    return () => { mounted = false; };
  }, [page, script]);

  useLayoutEffect(() => {
    const element = body.current;
    if (!element) return;
    let mounted = true;
    function fit() {
      if (!mounted || !element) return;
      const available = element.clientWidth;
      if (!available) return;
      const rows = Array.from(element.children);
      function widestRow() {
        return Math.max(...rows.map(row => {
          const words = Array.from(row.children);
          const width = words.reduce((sum, word) => sum + parseFloat(getComputedStyle(word).width), 0);
          return width + Math.max(0, words.length - 1) * parseFloat(getComputedStyle(row).columnGap);
        }));
      }
      element.style.fontSize = "32px";
      let size = 32 * available / Math.max(480, widestRow());
      element.style.fontSize = `${size}px`;
      // Glyph advances can round differently at the final device size.
      for (let attempt = 0; attempt < 3; attempt++) {
        const width = widestRow();
        if (width <= available) break;
        size *= (available - 2) / width;
        element.style.fontSize = `${size}px`;
      }
    }
    let width = element.clientWidth;
    const observer = new ResizeObserver(() => {
      if (element.clientWidth === width) return;
      width = element.clientWidth;
      fit();
    });
    observer.observe(element);
    fit();
    document.fonts?.ready.then(fit);
    return () => { mounted = false; observer.disconnect(); };
  }, [lines, useGlyphs, script]);

  return (
    <section dir="rtl" aria-label={`Mushaf page ${page}`} className="mushaf-sheet mx-auto max-w-2xl py-6 text-foreground md:py-10">
      <div ref={body} lang="ar" className="mushaf-text" style={{ fontFamily: useGlyphs ? `Mushaf${page}` : "var(--font-quran)" }}>
        {lines.map(([line, tokens], index) => (
          <div key={line} data-line={line} className="mushaf-line" data-centered={page <= 2 || (index === lines.length - 1 && line < 15)}>
            {tokens.map(({ word, verse }) => {
              const end = word.char_type_name === "end";
              const arabic = word.text_uthmani || (end ? verse.verse_number.toLocaleString("ar-EG") : "");
              const selected = word[script as keyof typeof word];
              const fallback = typeof selected === "string" && selected ? selected : arabic;
              return (
                <button key={word.id} type="button" id={word.position === 1 ? `verse-${verse.verse_key}` : undefined}
                  className={currentVerseKey === verse.verse_key && currentWordPosition === word.position ? "word-highlight" : undefined}
                  aria-label={end ? `Play verse ${verse.verse_key}` : arabic}
                  onClick={() => end ? onVerse(verse.verse_key) : onWord(word.audio_url)}>
                  {useGlyphs && word.code_v2 ? (
                    <><span aria-hidden="true" data-glyph={word.code_v2} /><span className="sr-only">{arabic} </span></>
                  ) : script === "text_uthmani_tajweed" ? (
                    <span dangerouslySetInnerHTML={{ __html: sanitizeTajweedMarkup(fallback) }} />
                  ) : <span style={{ fontFamily: "var(--font-quran)" }}>{fallback}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <footer dir="ltr" className="mt-5 border-t border-border pt-3 text-center text-sm text-muted-foreground">Page {page}</footer>
    </section>
  );
}
