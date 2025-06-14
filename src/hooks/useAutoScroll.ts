import { useEffect, useRef, useCallback } from "react";

interface UseAutoScrollOptions {
  /**
   * Dependencies that trigger auto-scroll when changed (e.g., messages, chat)
   */
  dependencies: unknown[];
  /**
   * Pixel distance from the very bottom that still counts as “at bottom”.
   * Defaults to 10 px.
   */
  bottomThreshold?: number;
}

export function useAutoScroll({ dependencies, bottomThreshold = 10 }: UseAutoScrollOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isAutoScrollEnabledRef = useRef(true);
  const isProgrammaticScrollRef = useRef(false);

  const scrollToBottom = () => {
    const container = containerRef.current;
    const bottom = bottomRef.current;

    if (!container || !bottom) return;

    // Mark next scroll event as programmatic so handleScroll can ignore it.
    isProgrammaticScrollRef.current = true;

    const clearProgrammatic = () => {
      isProgrammaticScrollRef.current = false;
      container.removeEventListener("scroll", clearProgrammatic);
    };

    // Clear the flag on the first scroll event that fires after scrollIntoView.
    container.addEventListener("scroll", clearProgrammatic, { once: true });

    bottom.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;
    
    const container = containerRef.current;
    if (!container) return;

    // Check if user is at bottom (with small threshold)
    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < bottomThreshold;
    isAutoScrollEnabledRef.current = isAtBottom;
  }, [bottomThreshold]);

  const enableAutoScroll = useCallback(() => {
    isAutoScrollEnabledRef.current = true;
    scrollToBottom();
  }, []);

  // Auto-scroll when dependencies change if enabled
  useEffect(() => {
    if (isAutoScrollEnabledRef.current) {
      scrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    containerRef,
    bottomRef,
    handleScroll,
    enableAutoScroll,
    isAutoScrollEnabled: isAutoScrollEnabledRef,
  };
}
