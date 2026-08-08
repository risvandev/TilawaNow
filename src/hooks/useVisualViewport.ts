"use client";

import { useState, useEffect } from "react";

export function useVisualViewport() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    let originalViewportHeight = window.innerHeight;
    const [viewportHeight, setViewportHeight] = useState(originalViewportHeight);
    
    function updateLayoutForKeyboard(height: number) {
      const safeHeight = Math.max(0, height);
      setKeyboardHeight(safeHeight);
      setIsKeyboardVisible(safeHeight > 50);
      
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      } else {
        setViewportHeight(window.innerHeight - safeHeight);
      }
    }

    function handleViewportChange() {
      if (!window.visualViewport) {
        // Fallback for older browsers
        const heightDiff = originalViewportHeight - window.innerHeight;
        if (heightDiff > 100) {
          updateLayoutForKeyboard(heightDiff);
        } else {
          updateLayoutForKeyboard(0);
        }
        return;
      }

      const vv = window.visualViewport;
      
      // On iOS, visualViewport.height shrinks but innerHeight does not.
      // On Android, BOTH visualViewport.height and innerHeight shrink.
      const visibleHeight = vv.height;
      const layoutHeight = window.innerHeight;
      
      // 1. iOS detection: layout height vs visible height
      const iosKeyboardHeight = Math.max(0, layoutHeight - visibleHeight);
      
      // 2. Android detection: original layout height vs current layout height
      const androidKeyboardHeight = Math.max(0, originalViewportHeight - layoutHeight);

      // If either method detects a significant keyboard (>100px)
      if (iosKeyboardHeight > 100) {
        updateLayoutForKeyboard(iosKeyboardHeight);
      } else if (androidKeyboardHeight > 100) {
        // On Android, because the native window resizes, the browser's flexbox 
        // will naturally push the content up. We DO NOT want to apply a CSS transform
        // as well, otherwise it will be pushed up twice.
        // So we set keyboardHeight to 0 for CSS transforms, BUT we set isKeyboardVisible to true
        // so the UI can strip out the bottom padding (pb-20).
        setKeyboardHeight(0);
        setIsKeyboardVisible(true);
        setViewportHeight(visibleHeight);
      } else if (vv.offsetTop > 0 && iosKeyboardHeight < 50) {
        // iOS approximate keyboard height from offset edge case
        const approxKeyboardHeight = Math.min(vv.offsetTop, window.innerHeight * 0.6);
        updateLayoutForKeyboard(approxKeyboardHeight);
      } else {
        updateLayoutForKeyboard(0);
      }
    }

    function handleWindowResize() {
      // If the window resizes and no keyboard was previously visible, 
      // it might be an orientation change, so we reset our baseline height.
      if (!isKeyboardVisible && Math.abs(originalViewportHeight - window.innerHeight) > 100) {
        originalViewportHeight = Math.max(originalViewportHeight, window.innerHeight);
      }
      handleViewportChange();
    }

    // Initialize
    originalViewportHeight = window.innerHeight;
    if (window.visualViewport) {
      setViewportHeight(window.visualViewport.height);
    }

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

  return { keyboardHeight, isKeyboardVisible, viewportHeight };
}
