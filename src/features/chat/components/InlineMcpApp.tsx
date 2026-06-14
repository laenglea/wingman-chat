import { Loader2, Maximize2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useToolsContext } from "@/features/tools/hooks/useToolsContext";
import { parseToolArguments } from "@/shared/lib/toolArguments";
import type { ToolContext, ToolResultContent } from "@/shared/types/chat";
import { ACTION_ICON_SIZE, actionButtonClassName } from "@/shared/ui/actionButton";
import { useApp } from "@/shell/hooks/useApp";

interface InlineMcpAppProps {
  toolResult: ToolResultContent;
  isLastFullscreenApp: boolean;
}

type AppDisplayMode = "inline" | "fullscreen";

function getAppDisplayModes(toolResult: ToolResultContent): AppDisplayMode[] {
  const modes = toolResult.meta?.appDisplayModes as AppDisplayMode[] | undefined;
  if (modes && modes.length > 0) return modes;
  const defaultMode = toolResult.meta?.defaultDisplayMode as string | undefined;
  if (defaultMode === "fullscreen") return ["fullscreen"];
  if (defaultMode === "inline") return ["inline"];
  return ["inline", "fullscreen"];
}

export function InlineMcpApp({ toolResult, isLastFullscreenApp }: InlineMcpAppProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const cleanupRef = useRef<(() => Promise<void> | void) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { renderAppInto, renderApp, showDrawer, showAppDrawer, activeAppKey, setActiveAppKey } = useApp();
  const { setProviderEnabled, restoreToolUI } = useToolsContext();

  const providerId = toolResult.meta?.toolProvider as string;
  const resourceUri = toolResult.meta?.toolResource as string;
  const appKey = `${providerId}-${resourceUri}-${toolResult.id}`;
  // Persisted by the MCP tool function; the app reads it (e.g. viewUUID/url) to render.
  const content = toolResult.content;

  const appDisplayModes = getAppDisplayModes(toolResult);

  const [bridgeDisplayModes, setBridgeDisplayModes] = useState<AppDisplayMode[] | null>(null);
  const effectiveDisplayModes = bridgeDisplayModes ?? appDisplayModes;
  const isInlineOnly = effectiveDisplayModes.length === 1 && effectiveDisplayModes[0] === "inline";
  const isFullscreenOnly = effectiveDisplayModes.length === 1 && effectiveDisplayModes[0] === "fullscreen";

  const getInitialDisplayMode = (): AppDisplayMode => {
    if (appDisplayModes.length === 1 && appDisplayModes[0] === "fullscreen") return "fullscreen";
    // Restore fullscreen if this app was active in the drawer (e.g. tab switch).
    if (showAppDrawer && activeAppKey === appKey) return "fullscreen";
    return "inline";
  };

  const [displayMode, setDisplayMode] = useState<AppDisplayMode>(getInitialDisplayMode);

  const expandToFullscreen = useCallback(async () => {
    // Cleanup inline bridge first
    if (cleanupRef.current) {
      try {
        await cleanupRef.current();
      } catch {
        // ignore
      }
      cleanupRef.current = null;
    }

    setDisplayMode("fullscreen");
    setActiveAppKey(appKey);

    try {
      const args = parseToolArguments(toolResult.arguments);
      await setProviderEnabled(providerId, true);

      const context: ToolContext = {
        render: () => renderApp(),
      };

      await restoreToolUI(providerId, toolResult.name, resourceUri, args, toolResult.result, content, context, {
        displayMode: "fullscreen",
      });
    } catch (error) {
      console.error("Failed to expand to fullscreen:", error);
      if (!isFullscreenOnly) {
        setDisplayMode("inline");
      }
    }
  }, [
    toolResult,
    providerId,
    resourceUri,
    appKey,
    isFullscreenOnly,
    setProviderEnabled,
    renderApp,
    restoreToolUI,
    setActiveAppKey,
    content,
  ]);

  const renderInline = useCallback(async () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    setIsLoading(true);

    try {
      const args = parseToolArguments(toolResult.arguments);
      await setProviderEnabled(providerId, true);

      await renderAppInto(iframe);

      const context: ToolContext = {
        render: async () => ({
          iframe,
          registerCleanup: (cleanup) => {
            cleanupRef.current = cleanup;
          },
        }),
        updateMeta: (meta) => {
          const modes = meta.appDisplayModes as AppDisplayMode[] | undefined;
          if (modes && modes.length > 0) {
            setBridgeDisplayModes(modes);
          }
        },
      };

      await restoreToolUI(providerId, toolResult.name, resourceUri, args, toolResult.result, content, context, {
        displayMode: "inline",
        onDisplayModeRequested: (mode) => setDisplayMode(mode as AppDisplayMode),
      });

      setIsLoading(false);
    } catch (error) {
      console.error("Failed to render inline MCP app:", error);
      setIsLoading(false);
    }
  }, [toolResult, providerId, resourceUri, setProviderEnabled, renderAppInto, restoreToolUI, content]);

  const [prevShowAppDrawer, setPrevShowAppDrawer] = useState(showAppDrawer);
  if (showAppDrawer !== prevShowAppDrawer) {
    setPrevShowAppDrawer(showAppDrawer);
    if (!showAppDrawer && displayMode === "fullscreen" && activeAppKey === appKey) {
      if (!isInlineOnly && !isFullscreenOnly) {
        setDisplayMode("inline");
      }
    }
  }

  const [prevActiveAppKey, setPrevActiveAppKey] = useState(activeAppKey);
  if (activeAppKey !== prevActiveAppKey) {
    setPrevActiveAppKey(activeAppKey);
    if (activeAppKey !== appKey && displayMode === "fullscreen" && !isFullscreenOnly) {
      setDisplayMode("inline");
    }
  }

  // Read the render fns via refs so the effect below only re-runs on actual mode
  // changes — not when context callbacks (restoreToolUI, etc.) change identity as
  // the MCP client connects. Re-running on every identity change would spawn a
  // second AppBridge and the guest would see duplicate JSON-RPC responses.
  const expandToFullscreenRef = useRef(expandToFullscreen);
  expandToFullscreenRef.current = expandToFullscreen;
  const renderInlineRef = useRef(renderInline);
  renderInlineRef.current = renderInline;

  useEffect(() => {
    if (displayMode === "fullscreen" && !isFullscreenOnly) {
      expandToFullscreenRef.current();
    } else if (displayMode === "fullscreen" && isFullscreenOnly && isLastFullscreenApp) {
      expandToFullscreenRef.current();
    } else if (displayMode === "inline") {
      renderInlineRef.current();
    }

    return () => {
      if (cleanupRef.current) {
        const cleanup = cleanupRef.current;
        cleanupRef.current = null;
        Promise.resolve(cleanup()).catch(console.error);
      }
    };
  }, [displayMode, isFullscreenOnly, isLastFullscreenApp]);

  if (isFullscreenOnly) {
    return (
      <div className="mt-2 mb-2">
        <button
          type="button"
          onClick={() => expandToFullscreen()}
          className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors py-1.5 px-2 rounded-md bg-neutral-100 dark:bg-neutral-900/40"
        >
          <Maximize2 size={12} />
          <span>{showAppDrawer && activeAppKey === appKey ? "Showing in panel" : "Open in panel"}</span>
        </button>
      </div>
    );
  }

  if (displayMode === "fullscreen" && !isFullscreenOnly) {
    return (
      <div className="mt-2 mb-2">
        <button
          type="button"
          onClick={() => showDrawer()}
          className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors py-1.5 px-2 rounded-md bg-neutral-100 dark:bg-neutral-900/40"
        >
          <Maximize2 size={12} />
          <span>Showing in panel</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 mb-2">
      {!isInlineOnly && !isFullscreenOnly && (
        <div className="flex justify-end mb-1">
          <button type="button" onClick={expandToFullscreen} className={actionButtonClassName} title="Expand to panel">
            <Maximize2 size={ACTION_ICON_SIZE} />
            <span>Open in panel</span>
          </button>
        </div>
      )}
      <div className="relative rounded-md overflow-hidden bg-neutral-100 dark:bg-neutral-900/40 min-h-[60px]">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-neutral-950/80 z-10 min-h-[60px]">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          </div>
        )}
        <iframe
          ref={iframeRef}
          className="w-full border-none"
          style={{ height: 0 }}
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          title={`MCP App: ${toolResult.name}`}
        />
      </div>
    </div>
  );
}
