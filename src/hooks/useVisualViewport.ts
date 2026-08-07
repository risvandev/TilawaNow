"use client";

import { useState, useEffect } from "react";

export function useVisualViewport() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    let originalViewportHeight = window.innerHeight;
    
    function updateLayoutForKeyboard(height: number) {
      const safeHeight = Math.max(0, height);
      setKeyboardHeight(safeHeight);
      setIsKeyboardVisible(safeHeight > 50);
    }

    function handleViewportChange() {
      if (!window.visualViewport) {
        // Fallback for Android Chrome / older browsers
        const heightDiff = originalViewportHeight - window.innerHeight;
        // If the window got smaller, keyboard opened
        if (heightDiff > 0) {
          updateLayoutForKeyboard(heightDiff);
        } else {
          updateLayoutForKeyboard(0);
        }
        return;
      }

      // VisualViewport API method
      const vv = window.visualViewport;
      
      const visibleHeight = vv.height;
      const layoutHeight = window.innerHeight;
      const calcKeyboardHeight = Math.max(0, layoutHeight - visibleHeight);

      const offsetY = vv.offsetTop;
      
      if (offsetY > 0 && calcKeyboardHeight < 50) {
        // iOS approximate keyboard height from offset
        const approxKeyboardHeight = Math.min(offsetY, window.innerHeight * 0.6);
        updateLayoutForKeyboard(approxKeyboardHeight);
      } else {
        updateLayoutForKeyboard(calcKeyboardHeight);
      }
    }

    function handleWindowResize() {
      // If the window resizes but keyboard isn't involved (orientation change)
      if (!isKeyboardVisible) {
        originalViewportHeight = window.innerHeight;
      }
      handleViewportChange();
    }

    // Initialize
    originalViewportHeight = window.innerHeight;

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportChange);
      window.visualViewport.addEventListener("scroll", handleViewportChange);
    }
    window.addEventListener("resize", handleWindowResize);

    // Initial check
    setTimeout(handleViewportChange, 200);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleViewportChange);
        window.visualViewport.removeEventListener("scroll", handleViewportChange);
      }
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [isKeyboardVisible]);

  return { keyboardHeight, isKeyboardVisible };
}
