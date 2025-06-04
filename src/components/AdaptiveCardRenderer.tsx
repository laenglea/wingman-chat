import { memo, useEffect, useRef, useState } from 'react';
import * as AdaptiveCards from 'adaptivecards';
import markdownit from 'markdown-it'

interface AdaptiveCardRendererProps {
    cardJson: string;
}

AdaptiveCards.AdaptiveCard.onProcessMarkdown = function (text, result) {
    result.outputHtml = markdownit().render(text);
    result.didProcess = true;
};

const NonMemoizedAdaptiveCardRenderer = ({ cardJson }: AdaptiveCardRendererProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [renderedCard, setRenderedCard] = useState<HTMLElement | null>(null);
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    // Helper function to validate if JSON is complete and valid
    const isValidCompleteJson = (jsonString: string): boolean => {
        if (!jsonString || jsonString.trim() === '') return false;

        try {
            const parsed = JSON.parse(jsonString);
            // Check if it's an object and has some basic Adaptive Card structure
            return typeof parsed === 'object' && parsed !== null &&
                (parsed.type || parsed.$schema || parsed.body || parsed.actions);
        } catch {
            return false;
        }
    };

    useEffect(() => {
        const renderAdaptiveCard = async () => {
            if (!cardJson.trim()) {
                setIsLoading(true);
                setError('');
                setRenderedCard(null);
                return;
            }

            // Don't attempt to render if JSON is not valid/complete (still streaming)
            if (!isValidCompleteJson(cardJson)) {
                setIsLoading(true);
                setError('');
                setRenderedCard(null);
                return;
            }

            try {
                setIsLoading(true);
                setError('');

                // Parse the JSON
                const cardPayload = JSON.parse(cardJson);

                // Create an AdaptiveCard instance
                const adaptiveCard = new AdaptiveCards.AdaptiveCard();

                // Check if user prefers dark mode
                const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches ||
                    document.documentElement.classList.contains('dark');

                // Set host config for better styling integration with your app
                adaptiveCard.hostConfig = new AdaptiveCards.HostConfig({
                    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    spacing: {
                        small: 4,
                        default: 8,
                        medium: 16,
                        large: 24,
                        extraLarge: 32,
                        padding: 12
                    },
                    separator: {
                        lineThickness: 1,
                        lineColor: isDarkMode ? "#374151" : "#E5E7EB"
                    },
                    fontSizes: {
                        small: 12,
                        default: 14,
                        medium: 16,
                        large: 18,
                        extraLarge: 20
                    },
                    fontWeights: {
                        lighter: 200,
                        default: 400,
                        bolder: 600
                    },
                    containerStyles: {
                        default: {
                            backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                            foregroundColors: {
                                default: {
                                    default: isDarkMode ? "#F9FAFB" : "#1F2937",
                                    subtle: isDarkMode ? "#9CA3AF" : "#6B7280"
                                },
                                accent: {
                                    default: isDarkMode ? "#60A5FA" : "#3B82F6",
                                    subtle: isDarkMode ? "#93C5FD" : "#60A5FA"
                                },
                                attention: {
                                    default: isDarkMode ? "#F87171" : "#EF4444",
                                    subtle: isDarkMode ? "#FCA5A5" : "#F87171"
                                },
                                good: {
                                    default: isDarkMode ? "#34D399" : "#10B981",
                                    subtle: isDarkMode ? "#6EE7B7" : "#34D399"
                                },
                                warning: {
                                    default: isDarkMode ? "#FBBF24" : "#F59E0B",
                                    subtle: isDarkMode ? "#FCD34D" : "#FBBF24"
                                }
                            }
                        },
                        emphasis: {
                            backgroundColor: isDarkMode ? "#374151" : "#F3F4F6",
                            foregroundColors: {
                                default: {
                                    default: isDarkMode ? "#F9FAFB" : "#1F2937",
                                    subtle: isDarkMode ? "#9CA3AF" : "#6B7280"
                                }
                            }
                        }
                    },
                    actions: {
                        buttonSpacing: 8,
                        maxActions: 5,
                        spacing: "Default",
                        actionAlignment: "Left",
                        actionsOrientation: "Horizontal",
                        showCard: {
                            actionMode: "Inline",
                            inlineTopMargin: 16,
                            style: "emphasis"
                        }
                    }
                });

                // Set up action handlers
                adaptiveCard.onExecuteAction = function (action) {
                    if (action instanceof AdaptiveCards.OpenUrlAction) {
                        window.open(action.url, '_blank', 'noopener,noreferrer');
                    } else if (action instanceof AdaptiveCards.SubmitAction) {
                        console.log('Adaptive Card Submit action:', action.data);
                        // You can customize this to handle form submissions as needed
                        // For example, emit an event or call a callback function
                    } else if (action instanceof AdaptiveCards.ShowCardAction) {
                        // ShowCard actions are handled automatically by the SDK
                        console.log('ShowCard action executed');
                    }
                };

                // Parse and render the card
                adaptiveCard.parse(cardPayload);
                const renderedCardElement = adaptiveCard.render();

                if (renderedCardElement) {
                    // Apply additional styling to the rendered card for better integration
                    renderedCardElement.style.borderRadius = '0';
                    renderedCardElement.style.border = 'none';
                    renderedCardElement.style.boxShadow = 'none';
                    setRenderedCard(renderedCardElement);
                } else {
                    setError('Failed to render card');
                }
                setIsLoading(false);
            } catch (error) {
                // Only show error for complete JSON that fails to render
                setError(error instanceof Error ? error.message : 'Unknown error');
                setRenderedCard(null);
                setIsLoading(false);
            }
        };

        // Debounce rendering to avoid excessive re-renders during streaming
        const timeoutId = setTimeout(renderAdaptiveCard, 300);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [cardJson]);

    // Effect to update the DOM when renderedCard changes
    useEffect(() => {
        if (containerRef.current && renderedCard) {
            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(renderedCard);
        }
    }, [renderedCard]);

    // Show loading placeholder while waiting for content
    if (isLoading && !cardJson.trim()) {
        return (
            <div className="my-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800/50">
                <div className="flex items-center justify-center h-24 text-neutral-600 dark:text-neutral-400">
                    <div className="animate-pulse">Waiting for Adaptive Card...</div>
                </div>
            </div>
        );
    }

    // Show error fallback with raw JSON
    if (error) {
        return (
            <div className="my-4 p-4 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 rounded-lg border border-red-200 dark:border-red-800/50">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                        <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h4 className="text-red-800 dark:text-red-200 font-medium">Failed to render Adaptive Card</h4>
                </div>
                <p className="text-red-700 dark:text-red-300 text-sm mb-3">{error}</p>
                <details className="text-xs">
                    <summary className="cursor-pointer text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 font-medium">Show card JSON</summary>
                    <pre className="mt-2 p-3 bg-red-100 dark:bg-red-900/40 rounded-md text-red-800 dark:text-red-200 overflow-auto text-xs font-mono">{cardJson}</pre>
                </details>
            </div>
        );
    }

    // Show loading spinner while processing valid content
    if (isLoading && cardJson.trim()) {
        return (
            <div className="my-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800/50">
                <div className="flex items-center justify-center h-24 text-neutral-600 dark:text-neutral-400">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-300 border-t-blue-600 dark:border-blue-700 dark:border-t-blue-400"></div>
                    <span className="ml-3">Rendering Adaptive Card...</span>
                </div>
            </div>
        );
    }

    // Render the adaptive card
    if (renderedCard) {
        return (
            <div className="my-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
                <div
                    ref={containerRef}
                    style={{
                        // Ensure the adaptive card styling works well with the container
                        colorScheme: 'light dark'
                    }}
                />
            </div>
        );
    }

    return null;
};

export const AdaptiveCardRenderer = memo(
    NonMemoizedAdaptiveCardRenderer,
    (prevProps, nextProps) =>
        prevProps.cardJson === nextProps.cardJson
);
