"use client";

import { useState, useEffect } from "react";

export function useVisualViewport() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let originalWindowWidth = window.innerWidth;
    let originalWindowHeight = window.innerHeight;

    function handleViewportChange() {
      requestAnimationFrame(() => {
        const vv = window.visualViewport;
        const currentInnerHeight = window.innerHeight;
        
        if (vv) {
          setViewportHeight(vv.height);

          const iosHeightDiff = Math.max(0, currentInnerHeight - vv.height);
          const androidHeightDiff = Math.max(0, originalWindowHeight - currentInnerHeight);

          if (iosHeightDiff > 100) {
            // iOS: visualViewport shrank, window did not resize. Transform needed.
            setKeyboardHeight(iosHeightDiff);
            setIsKeyboardVisible(true);
          } else if (androidHeightDiff > 100) {
            // Android: window resized natively. Flexbox naturally pushes content up.
            setKeyboardHeight(0);
            setIsKeyboardVisible(true);
          } else if (vv.offsetTop > 0 && iosHeightDiff < 50) {
            // iOS edge case offset
            setKeyboardHeight(Math.min(vv.offsetTop, currentInnerHeight * 0.5));
            setIsKeyboardVisible(true);
          } else {
            setKeyboardHeight(0);
            setIsKeyboardVisible(false);
          }
        } else {
          // Fallback for older browsers
          const heightDiff = Math.max(0, originalWindowHeight - currentInnerHeight);
          setViewportHeight(currentInnerHeight);
          if (heightDiff > 100) {
            setKeyboardHeight(heightDiff);
            setIsKeyboardVisible(true);
          } else {
            setKeyboardHeight(0);
            setIsKeyboardVisible(false);
          }
        }
      });
    }

    function handleWindowResize() {
      // Only reset original height if width changed (orientation change/split screen)
      if (window.innerWidth !== originalWindowWidth) {
        originalWindowWidth = window.innerWidth;
        originalWindowHeight = window.innerHeight;
      }
      handleViewportChange();
    }

    // Initial setup
    originalWindowWidth = window.innerWidth;
    originalWindowHeight = window.innerHeight;
    setViewportHeight(window.visualViewport ? window.visualViewport.height : window.innerHeight);

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportChange);
      window.visualViewport.addEventListener("scroll", handleViewportChange);
    }
    window.addEventListener("resize", handleWindowResize);

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
