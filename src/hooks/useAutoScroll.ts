import { useState, useEffect, useRef, useCallback } from "react";

interface UseAutoScrollOptions {
  /**
   * Dependencies that trigger auto-scroll when changed (e.g., messages, chat)
   */
  dependencies: unknown[];
  /**
   * Threshold in pixels for determining if user is "at bottom"
   */
  threshold?: number;
}

export function useAutoScroll({ dependencies, threshold = 20 }: UseAutoScrollOptions) {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkIfAtBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return false;
    
    const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - threshold;
    setIsAtBottom(atBottom);
    return atBottom;
  }, [threshold]);

  const scrollToBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Mark that we're programmatically scrolling
    isProgrammaticScrollRef.current = true;
    
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
    
    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Reset the flag after a short delay to allow for the smooth scroll to complete
    scrollTimeoutRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 500);
  }, []);

  const handleScroll = useCallback(() => {
    // Only check if at bottom if this is a user-initiated scroll
    // Ignore scroll events that happen during programmatic scrolling
    if (!isProgrammaticScrollRef.current) {
      checkIfAtBottom();
    }
  }, [checkIfAtBottom]);

  // Get first dependency for reset logic
  const firstDependency = dependencies[0];

  // Auto-scroll when dependencies change and user is at bottom
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToBottom, isAtBottom, ...dependencies]);

  // Check initial position
  useEffect(() => {
    checkIfAtBottom();
  }, [checkIfAtBottom]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Reset scroll state when first dependency changes (e.g., switching chats)
  useEffect(() => {
    setIsAtBottom(true);
    isProgrammaticScrollRef.current = false;
  }, [firstDependency]);

  return {
    containerRef,
    handleScroll,
    isAtBottom,
    scrollToBottom,
  };
}
