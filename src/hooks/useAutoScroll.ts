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

export function useAutoScroll({ dependencies, threshold = 50 }: UseAutoScrollOptions) {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTopRef = useRef(0);
  const scrollVelocityRef = useRef(0);
  const isUserScrollingRef = useRef(false);

  const checkIfAtBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return false;
    
    const { scrollTop, clientHeight, scrollHeight } = container;
    const atBottom = scrollTop + clientHeight >= scrollHeight - threshold;
    setIsAtBottom(atBottom);
    return atBottom;
  }, [threshold]);

  const scrollToBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container || isUserScrollingRef.current) return;
    
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
    
    // Reset the flag after a shorter delay
    scrollTimeoutRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 100);
  }, []);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const currentScrollTop = container.scrollTop;
    const scrollDelta = currentScrollTop - lastScrollTopRef.current;
    
    // Calculate scroll velocity for momentum detection
    scrollVelocityRef.current = Math.abs(scrollDelta);
    lastScrollTopRef.current = currentScrollTop;

    // If this is a programmatic scroll, ignore it
    if (isProgrammaticScrollRef.current) {
      return;
    }

    // This is a user-initiated scroll
    isUserScrollingRef.current = true;

    // Clear any existing user scroll timeout
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }

    // Check if user is at bottom
    const atBottom = checkIfAtBottom();

    // If user scrolled to bottom, immediately re-enable auto-scroll
    if (atBottom) {
      isUserScrollingRef.current = false;
    } else {
      // User is not at bottom, wait for scroll to stop before allowing auto-scroll again
      userScrollTimeoutRef.current = setTimeout(() => {
        // Only stop user scrolling if they're still not at bottom and velocity is low
        if (scrollVelocityRef.current < 5) {
          isUserScrollingRef.current = false;
          checkIfAtBottom();
        }
      }, 150);
    }
  }, [checkIfAtBottom]);

  // Get first dependency for reset logic
  const firstDependency = dependencies[0];

  // Auto-scroll when dependencies change and user is at bottom and not actively scrolling
  useEffect(() => {
    if (isAtBottom && !isUserScrollingRef.current) {
      scrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToBottom, isAtBottom, ...dependencies]);

  // Check initial position
  useEffect(() => {
    checkIfAtBottom();
  }, [checkIfAtBottom]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    };
  }, []);

  // Reset scroll state when first dependency changes (e.g., switching chats)
  useEffect(() => {
    setIsAtBottom(true);
    isProgrammaticScrollRef.current = false;
    isUserScrollingRef.current = false;
    scrollVelocityRef.current = 0;
    lastScrollTopRef.current = 0;
    
    // Clear any existing timeouts
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
      userScrollTimeoutRef.current = null;
    }
  }, [firstDependency]);

  return {
    containerRef,
    handleScroll,
    isAtBottom,
    scrollToBottom,
  };
}
