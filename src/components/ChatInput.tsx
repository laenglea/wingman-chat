import { ChangeEvent, useState, FormEvent, useRef, useEffect } from "react";
import { Button, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'

import { Send, Paperclip, ScreenShare, Image, X, Brain, Link, File, Loader2, FileText, Lightbulb } from "lucide-react";

import { Attachment, AttachmentType, Message, Role, Tool } from "../models/chat";
import {
  captureScreenshot,
  getFileExt,
  readAsDataURL,
  readAsText,
  resizeImageBlob,
  supportsScreenshot,
  supportedTypes,
  textTypes,
  imageTypes,
  documentTypes,
} from "../lib/utils";
import { getConfig } from "../config";
import { useChat } from "../hooks/useChat";
import { useTextPaste } from "../hooks/useTextPaste";

export function ChatInput() {
  const config = getConfig();
  const client = config.client;
  const bridge = config.bridge;

  // Use only context values
  const { sendMessage: onSend, models, model, setModel: onModelChange, messages } = useChat();

  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState<Set<string>>(new Set());
  const [bridgeTools, setBridgeTools] = useState<Tool[]>([]);
  
  // Prompt suggestions state
  const [showPromptSuggestions, setShowPromptSuggestions] = useState(false);
  const [promptSuggestions, setPromptSuggestions] = useState<string[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Custom hook for plain text paste handling
  const handlePaste = useTextPaste(contentEditableRef, setContent);

  // Handle prompt suggestions click
  const handlePromptSuggestionsClick = async () => {
    if (!model) return;

    if (showPromptSuggestions) {
      setShowPromptSuggestions(false);
      return;
    }

    setLoadingPrompts(true);
    setShowPromptSuggestions(true);
    
    try {
      let suggestions: string[];
      
      if (messages.length === 0) {
        // For new chats, get common/popular prompts
        suggestions = await client.relatedPrompts(model.id, "");
      } else {
        // Get the last few messages for context
        const contextMessages = messages.slice(-6);
        const contextText = contextMessages
          .map(msg => `${msg.role}: ${msg.content}`)
          .join('\n');
        
        suggestions = await client.relatedPrompts(model.id, contextText);
      }
      
      setPromptSuggestions(suggestions);
    } catch (error) {
      console.error("Error fetching prompt suggestions:", error);
      setPromptSuggestions([]);
    } finally {
      setLoadingPrompts(false);
    }
  };

  // Handle selecting a prompt suggestion
  const handlePromptSelect = (suggestion: string) => {
    // Create and send message immediately
    const message: Message = {
      role: Role.User,
      content: suggestion,
      attachments: attachments,
    };

    onSend(message);
    
    // Clear attachments after sending
    setAttachments([]);
    
    // Hide prompt suggestions
    setShowPromptSuggestions(false);
  };

  // Helper function to get the appropriate icon for each attachment type
  const getAttachmentIcon = (attachment: Attachment) => {
    switch (attachment.type) {
      case AttachmentType.Image:
        return <Image size={24} />;
      case AttachmentType.Text:
        return <FileText size={24} />;
      case AttachmentType.File:
        return <File size={24} />;
      default:
        return <File size={24} />;
    }
  };

  // Fetch bridge tools when bridge is connected
  useEffect(() => {
    const fetchTools = async () => {
      if (bridge.isConnected()) {
        try {
          const tools = await bridge.listTools();
          setBridgeTools(tools);
        } catch (error) {
          console.error("Failed to fetch bridge tools:", error);
          setBridgeTools([]);
        }
      } else {
        setBridgeTools([]);
      }
    };

    fetchTools();
    
    const interval = setInterval(fetchTools, 5000);    
    return () => clearInterval(interval);
  }, [bridge]);

  // Force layout recalculation on mount to fix initial sizing issues
  useEffect(() => {
    const forceLayout = () => {
      if (containerRef.current) {
        // Force a repaint by reading offsetHeight
        void containerRef.current.offsetHeight;
      }
      if (contentEditableRef.current) {
        // Force a repaint for the content editable area
        void contentEditableRef.current.offsetHeight;
      }
    };

    // Run immediately and on next tick to ensure DOM is ready
    forceLayout();
    const timer = setTimeout(forceLayout, 0);
    
    // Also force layout on window load to handle CSS custom properties
    const handleLoad = () => forceLayout();
    window.addEventListener('load', handleLoad);
    
    // Handle resize events to maintain proper sizing
    const handleResize = () => {
      requestAnimationFrame(forceLayout);
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('load', handleLoad);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (content.trim()) {
      const message: Message = {
        role: Role.User,
        content: content,
        attachments: attachments,
      };

      onSend(message);
      setContent("");
      setAttachments([]);
      
      if (contentEditableRef.current) {
        contentEditableRef.current.textContent = "";
      }
    }
  };

  const handleAttachmentClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleScreenshotClick = async () => {
    const screenshotId = `screenshot-${Date.now()}`;
    setLoadingAttachments(prev => new Set([...prev, screenshotId]));
    
    try {
      const data = await captureScreenshot();

      const attachment = {
        type: AttachmentType.Image,
        name: "screenshot.png",
        data: data,
      };

      setAttachments((prev) => [...prev, attachment]);
    } catch (error) {
      console.error("Error capturing screenshot:", error);
    } finally {
      setLoadingAttachments(prev => {
        const newSet = new Set(prev);
        newSet.delete(screenshotId);
        return newSet;
      });
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = `${file.name}-${Date.now()}-${i}`;
        
        // Add to loading state
        setLoadingAttachments(prev => new Set([...prev, fileId]));
        
        try {
          let attachment: Attachment | null = null;

          if (textTypes.includes(file.type) || textTypes.includes(getFileExt(file.name))) {
            const text = await readAsText(file);
            attachment = {
              type: AttachmentType.Text,
              name: file.name,
              data: text,
            };
          }

          if (imageTypes.includes(file.type) || imageTypes.includes(getFileExt(file.name))) {
            const blob = await resizeImageBlob(file, 1920, 1920);
            const url = await readAsDataURL(blob);
            attachment = {
              type: AttachmentType.Image,
              name: file.name,
              data: url,
            };
          }

          if (documentTypes.includes(file.type) || documentTypes.includes(getFileExt(file.name))) {
            const text = await client.extractText(file);
            attachment = {
              type: AttachmentType.Text,
              name: file.name,
              data: text,
            };
          }

          if (attachment) {
            setAttachments((prev) => [...prev, attachment!]);
          }
        } catch (error) {
          console.error("Error processing file:", error);
        } finally {
          // Remove from loading state
          setLoadingAttachments(prev => {
            const newSet = new Set(prev);
            newSet.delete(fileId);
            return newSet;
          });
        }
      }

      e.target.value = "";
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div 
        ref={containerRef}
        className="chat-input-container border border-neutral-200 dark:border-neutral-900 bg-white/20 dark:bg-black/15 backdrop-blur-2xl rounded-lg md:rounded-2xl flex flex-col min-h-[3rem] shadow-2xl shadow-black/60 dark:shadow-black/80"
      >
        <input
          type="file"
          multiple
          accept={supportedTypes.join(",")}
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Attachments display */}
        {(attachments.length > 0 || loadingAttachments.size > 0) && (
          <div className="flex flex-wrap gap-3 p-3">
            {/* Loading attachments */}
            {Array.from(loadingAttachments).map((fileId, index) => (
              <div
                key={fileId}
                className="relative size-14 bg-white/30 dark:bg-black/20 backdrop-blur-lg rounded-xl border-2 border-dashed border-white/50 dark:border-white/30 flex items-center justify-center animate-pulse"
                title="Processing file..."
              >
                <Loader2 size={18} className="animate-spin text-neutral-500 dark:text-neutral-400" />
                {loadingAttachments.size > 1 && (
                  <div className="absolute -bottom-1 -right-1 size-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                    {index + 1}
                  </div>
                )}
              </div>
            ))}
            
            {/* Processed attachments */}
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="relative size-14 bg-white/40 dark:bg-black/25 backdrop-blur-lg rounded-xl border border-white/40 dark:border-white/25 shadow-sm flex items-center justify-center group hover:shadow-md hover:border-white/60 dark:hover:border-white/40 transition-all"
                title={attachment.name}
              >
                {attachment.type === AttachmentType.Image ? (
                  <img 
                    src={attachment.data} 
                    alt={attachment.name}
                    className="size-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="text-neutral-600 dark:text-neutral-300">
                    {getAttachmentIcon(attachment)}
                  </div>
                )}
                <button
                  type="button"
                  className="absolute top-0.5 right-0.5 size-5 bg-neutral-800/80 hover:bg-neutral-900 dark:bg-neutral-200/80 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm shadow-sm"
                  onClick={() => handleRemoveAttachment(index)}
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Prompt suggestions */}
        {showPromptSuggestions && (
          <div className="p-3">
            {loadingPrompts ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={16} className="animate-spin text-neutral-500 dark:text-neutral-400" />
                <span className="ml-2 text-sm text-neutral-500 dark:text-neutral-400">
                  Generating suggestions...
                </span>
              </div>
            ) : promptSuggestions.length > 0 ? (
              <div className="space-y-2">
                {promptSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handlePromptSelect(suggestion)}
                    className="w-full text-left p-3 text-sm bg-white/25 dark:bg-black/15 backdrop-blur-lg hover:bg-white/40 dark:hover:bg-black/25 rounded-lg border border-white/30 dark:border-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-neutral-500 dark:text-neutral-400">
                No suggestions available
              </div>
            )}
          </div>
        )}

        {/* Input area */}
        <div
          ref={contentEditableRef}
          className="p-3 md:p-4 flex-1 max-h-[40vh] overflow-y-auto min-h-[2.5rem] whitespace-pre-wrap break-words empty:before:content-[attr(data-placeholder)] empty:before:text-neutral-500 empty:before:dark:text-neutral-400 focus:outline-none text-neutral-800 dark:text-neutral-200"
          style={{ 
            scrollbarWidth: "thin",
            minHeight: "2.5rem",
            height: "auto"
          }}
          role="textbox"
          contentEditable
          suppressContentEditableWarning={true}
          data-placeholder="Ask anything"
          onInput={(e) => {
            const target = e.target as HTMLDivElement;
            const newContent = target.textContent || "";
            setContent(newContent);
            
            // Hide prompt suggestions when user starts typing
            if (newContent.trim() && showPromptSuggestions) {
              setShowPromptSuggestions(false);
            }
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        />

        {/* Controls */}
        <div className="flex items-center justify-between p-3 pt-0">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              className="text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 focus:outline-none cursor-pointer"
              onClick={handlePromptSuggestionsClick}
              title="Show prompt suggestions"
            >
              <Lightbulb size={16} />
            </Button>
            
            <Menu>
              <MenuButton className="flex items-center gap-1 pr-1.5 py-1.5 text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 focus:outline-none text-sm cursor-pointer">
                <Brain size={14} />
                <span>
                  {model?.name ?? model?.id ?? "Select Model"}
                </span>
              </MenuButton>
              <MenuItems
                transition
                anchor="bottom start"
                className="sidebar-scroll !max-h-[50vh] mt-2 rounded border bg-white/30 dark:bg-black/25 backdrop-blur-2xl border-white/30 dark:border-white/20 overflow-y-auto shadow-lg z-50"
              >
                {models.map((model) => (
                  <MenuItem key={model.id}>
                    <Button
                      onClick={() => onModelChange(model)}
                      title={model.description}
                      className="group flex w-full items-center px-4 py-2 data-[focus]:bg-white/40 dark:data-[focus]:bg-black/30 text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
                    >
                      {model.name ?? model.id}
                    </Button>
                  </MenuItem>
                ))}
              </MenuItems>
            </Menu>
            
            {bridge.isConnected() && (
              <div 
                className="flex items-center gap-1 pr-1.5 py-1.5 text-neutral-600 dark:text-neutral-400 text-sm relative group"
                title={bridgeTools.length > 0 ? `Available tools: ${bridgeTools.map(t => t.name).join(', ')}` : "Bridge connected"}
              >
                <Link size={14} />
                <span>Bridge</span>
                {bridgeTools.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-neutral-800 dark:bg-neutral-700 text-white text-xs rounded-md p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <div className="font-semibold mb-1">Available Tools ({bridgeTools.length}):</div>
                    <div className="space-y-1">
                      {bridgeTools.map((tool, index) => (
                        <div key={index} className="flex flex-col">
                          <span className="font-medium">{tool.name}</span>
                          {tool.description && (
                            <span className="text-neutral-300 dark:text-neutral-400 text-xs truncate" title={tool.description}>
                              {tool.description}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {supportsScreenshot() && (
              <Button
                type="button"
                className="p-1.5 text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 focus:outline-none cursor-pointer"
                onClick={handleScreenshotClick}
              >
                <ScreenShare size={16} />
              </Button>
            )}

            <Button
              type="button"
              className="p-1.5 text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 focus:outline-none cursor-pointer"
              onClick={handleAttachmentClick}
            >
              <Paperclip size={16} />
            </Button>

            <Button
              className="p-1.5 text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 focus:outline-none cursor-pointer"
              type="submit"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
