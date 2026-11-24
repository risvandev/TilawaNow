"use client";

import { useEffect, useState } from "react";

interface ViewportSample {
  width: number;
  layoutHeight: number;
  visibleHeight: number;
  offsetTop: number;
  scale: number;
  editing: boolean;
  touch: boolean;
}

interface ViewportState {
  width: number;
  idleHeight: number;
  viewportHeight: number;
  viewportTop: number;
  isKeyboardVisible: boolean;
}

const initialViewport: ViewportState = {
  width: 0,
  idleHeight: 0,
  viewportHeight: 0,
  viewportTop: 0,
  isKeyboardVisible: false,
};

export function measureViewport(previous: ViewportState, sample: ViewportSample): ViewportState {
  const { width, layoutHeight, visibleHeight, offsetTop, scale, editing, touch } = sample;
  const sameWidth = width === previous.width;
  const atDefaultScale = Math.abs(scale - 1) < 0.02;
  const idleHeight = sameWidth ? previous.idleHeight : layoutHeight;
  const viewportLoss = layoutHeight - visibleHeight;
  const layoutLoss = idleHeight - layoutHeight;
  const isKeyboardVisible = touch && atDefaultScale && (editing || (sameWidth && previous.isKeyboardVisible))
    && Math.max(viewportLoss, layoutLoss) > 100;

  return {
    width,
    // Keep the keyboard-closed baseline across every resize event during typing.
    idleHeight: editing || isKeyboardVisible ? idleHeight : layoutHeight,
    viewportHeight: isKeyboardVisible ? Math.round(visibleHeight) : 0,
    viewportTop: isKeyboardVisible ? Math.max(0, Math.round(offsetTop)) : 0,
    isKeyboardVisible,
  };
}

export function useVisualViewport() {
  const [state, setState] = useState(initialViewport);

  useEffect(() => {
    const viewport = window.visualViewport;
    const touchPointer = window.matchMedia("(any-pointer: coarse)");
    let frame = 0;
    let previous = initialViewport;

    function update() {
      const focused = document.activeElement;
      const editing = focused instanceof HTMLElement && (
        focused.isContentEditable ||
        (focused instanceof HTMLTextAreaElement && !focused.readOnly && focused.inputMode !== "none") ||
        (focused instanceof HTMLInputElement && !focused.readOnly && focused.inputMode !== "none"
          && /^(text|search|url|tel|email|password|number)$/.test(focused.type))
      );

      const next = measureViewport(previous, {
        width: window.innerWidth,
        layoutHeight: window.innerHeight,
        visibleHeight: viewport?.height ?? window.innerHeight,
        offsetTop: viewport?.offsetTop ?? 0,
        scale: viewport?.scale ?? 1,
        editing,
        touch: touchPointer.matches || navigator.maxTouchPoints > 0,
      });

      if (next.isKeyboardVisible !== previous.isKeyboardVisible ||
          next.viewportHeight !== previous.viewportHeight || next.viewportTop !== previous.viewportTop) {
        setState(next);
      }
      previous = next;
    }

    function scheduleUpdate() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    }

    update();
    viewport?.addEventListener("resize", scheduleUpdate);
    viewport?.addEventListener("scroll", scheduleUpdate);
    window.addEventListener("resize", scheduleUpdate);
    document.addEventListener("focusin", scheduleUpdate);
    document.addEventListener("focusout", scheduleUpdate);

    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", scheduleUpdate);
      viewport?.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      document.removeEventListener("focusin", scheduleUpdate);
      document.removeEventListener("focusout", scheduleUpdate);
    };
  }, []);

  return state;
}
