import { memo, useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '../contexts/ThemeContext';
import { CopyButton } from './CopyButton';

interface MermaidRendererProps {
  chart: string;
  language: string;
}

const NonMemoizedMermaidRenderer = ({ chart, language }: MermaidRendererProps) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const elementId = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);
  const { isDark } = useTheme();

  // Configure mermaid theme based on current theme
  useEffect(() => {
    const themeConfig = {
      startOnLoad: false,
      securityLevel: 'loose' as const,
      fontFamily: 'Fira Code, Monaco, Cascadia Code, Roboto Mono, monospace',
      suppressErrorRendering: true,
      theme: 'base' as const,
      themeVariables: isDark ? {
        // Dark mode configuration
        primaryColor: '#3b82f6',        // Blue-500
        primaryBorderColor: '#2563eb',  // Blue-600
        lineColor: '#60a5fa',          // Blue-400
        secondaryColor: '#1e40af',     // Blue-800
        tertiaryColor: '#1d4ed8',      // Blue-700
        background: '#1f2937',         // Gray-800 (dark background)
        mainBkg: '#1f2937',           // Gray-800
        secondBkg: '#374151',         // Gray-700
        tertiaryBkg: '#4b5563',       // Gray-600
        // Pie chart specific colors - bright blues for dark mode
        pie1: '#60a5fa',              // Blue-400 (bright)
        pie2: '#3b82f6',              // Blue-500 (bright)
        pie3: '#2563eb',              // Blue-600 (bright)
        pie4: '#1d4ed8',              // Blue-700 (bright)
        pie5: '#1e40af',              // Blue-800 (bright)
        pie6: '#93c5fd',              // Blue-300 (very bright)
        pie7: '#38bdf8',              // Sky-400 (bright)
        pie8: '#0ea5e9',              // Sky-500 (bright)
        pie9: '#0284c7',              // Sky-600 (bright)
        pie10: '#0369a1',             // Sky-700 (bright)
        pie11: '#67e8f9',             // Cyan-300 (bright)
        pie12: '#22d3ee',             // Cyan-400 (bright)
        // Text colors - white/light for dark mode
        pieTitleTextSize: '24px',
        pieTitleTextColor: '#ffffff',  // White
        pieSectionTextSize: '16px',
        pieSectionTextColor: '#ffffff', // White
        pieLegendTextSize: '14px',
        pieLegendTextColor: '#e5e7eb', // Gray-200 (light)
        // Node colors - white/light for dark mode
        primaryTextColor: '#ffffff',   // White
        secondaryTextColor: '#e5e7eb', // Gray-200 (light)
        tertiaryTextColor: '#d1d5db',  // Gray-300 (light)
      } : {
        // Light mode configuration
        primaryColor: '#1e40af',        // Blue-800 (darker)
        primaryBorderColor: '#1e3a8a',  // Blue-900 (darker)
        lineColor: '#3b82f6',          // Blue-500 (darker than before)
        secondaryColor: '#93c5fd',     // Blue-300 (darker)
        tertiaryColor: '#dbeafe',      // Blue-100 (darker)
        background: '#ffffff',         // White background (matching main container)
        mainBkg: '#ffffff',           // White
        secondBkg: '#f8fafc',         // Slate-50
        tertiaryBkg: '#f1f5f9',       // Slate-100
        // Pie chart specific colors - darker blues
        pie1: '#1e40af',              // Blue-800 (darker)
        pie2: '#1e3a8a',              // Blue-900 (darker)
        pie3: '#1d4ed8',              // Blue-700 (darker)
        pie4: '#2563eb',              // Blue-600 (darker)
        pie5: '#3b82f6',              // Blue-500 (darker)
        pie6: '#0f172a',              // Slate-900 (very dark)
        pie7: '#0c4a6e',              // Sky-900 (darker)
        pie8: '#075985',              // Sky-700 (darker)
        pie9: '#0284c7',              // Sky-600 (darker)
        pie10: '#0369a1',             // Sky-700 (darker)
        pie11: '#164e63',             // Cyan-800 (darker)
        pie12: '#155e75',             // Cyan-700 (darker)
        // Text colors - darker for better contrast
        pieTitleTextSize: '24px',
        pieTitleTextColor: '#0f172a',  // Slate-900 (very dark)
        pieSectionTextSize: '16px',
        pieSectionTextColor: '#0f172a', // Slate-900 (very dark)
        pieLegendTextSize: '14px',
        pieLegendTextColor: '#1f2937', // Gray-800 (darker)
        // Node colors - darker for better contrast
        primaryTextColor: '#0f172a',   // Slate-900 (very dark)
        secondaryTextColor: '#1f2937', // Gray-800 (darker)
        tertiaryTextColor: '#374151',  // Gray-700 (darker)
      }
    };

    mermaid.initialize(themeConfig);
  }, [isDark]);

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
        
        // Generate a new element ID to force re-render when theme changes
        elementId.current = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
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
  }, [chart, isDark]);

  // Show loading placeholder while streaming or processing
  if (isLoading && !chart.trim()) {
    return (
      <div className="relative my-4">
        <div className="flex justify-between items-center bg-gray-100 dark:bg-neutral-700 pl-4 pr-2 py-1.5 rounded-t-md text-xs text-gray-700 dark:text-neutral-300">
          <span>{language}</span>
        </div>
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-b-md border border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-center h-24 text-gray-500 dark:text-neutral-500">
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
        <div className="flex justify-between items-center bg-gray-100 dark:bg-neutral-700 pl-4 pr-2 py-1.5 rounded-t-md text-xs text-gray-700 dark:text-neutral-300">
          <span>{language}</span>
          <span className="text-xs text-red-500 dark:text-red-400 opacity-70">render failed</span>
        </div>
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-b-md border border-gray-200 dark:border-neutral-700">
          <pre className="text-gray-800 dark:text-neutral-300 text-sm whitespace-pre-wrap overflow-x-auto">
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
        <div className="flex justify-between items-center bg-gray-100 dark:bg-neutral-700 pl-4 pr-2 py-1.5 rounded-t-md text-xs text-gray-700 dark:text-neutral-300">
          <span>{language}</span>
        </div>
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-b-md border border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-center h-24 text-gray-500 dark:text-neutral-500">
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
        <div className="flex justify-between items-center bg-gray-100 dark:bg-neutral-700 pl-4 pr-2 py-1.5 rounded-t-md text-xs text-gray-700 dark:text-neutral-300">
          <span>{language}</span>
          <CopyButton text={chart} />
        </div>
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-b-md border border-gray-200 dark:border-neutral-700 overflow-x-auto">
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
