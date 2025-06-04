import { memo, useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidRendererProps {
  chart: string;
  language: string;
}

// Initialize mermaid with dark theme configuration
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Fira Code, Monaco, Cascadia Code, Roboto Mono, monospace',
  suppressErrorRendering: true,
});

const NonMemoizedMermaidRenderer = ({ chart, language }: MermaidRendererProps) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const elementId = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const renderMermaid = async () => {
      if (!chart.trim()) {
        setIsLoading(true);
        setError('');
        setSvg('');
        return;
      }

      try {
        setIsLoading(true);
        setError('');
        
        // Basic validation - check if it looks like mermaid syntax
        const trimmedChart = chart.trim();
        if (!trimmedChart || trimmedChart.length < 3) {
          setIsLoading(false);
          return;
        }
        
        // Validate and render the chart
        const { svg: renderedSvg } = await mermaid.render(elementId.current, chart);
        setSvg(renderedSvg);
        setIsLoading(false);
      } catch {
        // Silently handle errors - just show the code block
        setError('silent');
        setSvg('');
        setIsLoading(false);
      }
    };

    // Debounce rendering to avoid excessive re-renders during streaming
    const timeoutId = setTimeout(renderMermaid, 300);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [chart]);

  // Show loading placeholder while streaming or processing
  if (isLoading && !chart.trim()) {
    return (
      <div className="relative my-4">
        <div className="flex justify-between items-center bg-neutral-800 dark:bg-neutral-700 pl-4 pr-2 py-1.5 rounded-t-md text-xs text-neutral-300">
          <span>{language}</span>
        </div>
        <div className="bg-neutral-900 dark:bg-neutral-800 p-4 rounded-b-md border border-neutral-700">
          <div className="flex items-center justify-center h-24 text-neutral-500">
            <div className="animate-pulse">Waiting for diagram...</div>
          </div>
        </div>
      </div>
    );
  }

  // Show error fallback with raw code (subtle error display)
  if (error) {
    return (
      <div className="relative my-4">
        <div className="flex justify-between items-center bg-neutral-800 dark:bg-neutral-700 pl-4 pr-2 py-1.5 rounded-t-md text-xs text-neutral-300">
          <span>{language}</span>
          <span className="text-xs text-red-400 opacity-70">render failed</span>
        </div>
        <div className="bg-neutral-900 dark:bg-neutral-800 p-4 rounded-b-md border border-neutral-700">
          <pre className="text-neutral-300 text-sm whitespace-pre-wrap overflow-x-auto">
            <code>{chart}</code>
          </pre>
        </div>
      </div>
    );
  }

  // Show loading spinner while processing
  if (isLoading && chart.trim()) {
    return (
      <div className="relative my-4">
        <div className="flex justify-between items-center bg-neutral-800 dark:bg-neutral-700 pl-4 pr-2 py-1.5 rounded-t-md text-xs text-neutral-300">
          <span>{language}</span>
        </div>
        <div className="bg-neutral-900 dark:bg-neutral-800 p-4 rounded-b-md border border-neutral-700">
          <div className="flex items-center justify-center h-24 text-neutral-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2">Rendering diagram...</span>
          </div>
        </div>
      </div>
    );
  }

  // Render the mermaid diagram
  if (svg) {
    return (
      <div className="relative my-4">
        <div className="flex justify-between items-center bg-neutral-800 dark:bg-neutral-700 pl-4 pr-2 py-1.5 rounded-t-md text-xs text-neutral-300">
          <span>{language}</span>
        </div>
        <div className="bg-neutral-900 dark:bg-neutral-800 p-4 rounded-b-md border border-neutral-700 overflow-x-auto">
          <div 
            className="mermaid-diagram flex justify-center"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      </div>
    );
  }

  return null;
};

export const MermaidRenderer = memo(
  NonMemoizedMermaidRenderer,
  (prevProps, nextProps) => 
    prevProps.chart === nextProps.chart && prevProps.language === nextProps.language
);
