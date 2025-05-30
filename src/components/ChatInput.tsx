import { ChangeEvent, useState, FormEvent, useRef } from "react";
import { Button, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'

import { Send, Paperclip, ScreenShare, Image, X, Brain } from "lucide-react";

import { Attachment, AttachmentType, Message, Role, Model } from "../models/chat";
import {
  captureScreenshot,
  getFileExt,
  readAsDataURL,
  readAsText,
  resizeImageBlob,
  supportsScreenshot,
  supportedTypes,
  textTypes,
  partitionTypes,
  imageTypes,
} from "../lib/utils";
import { getConfig } from "../config";

type ChatInputProps = {
  onSend: (message: Message) => void;
  models: Model[];
  currentModel: Model | undefined;
  onModelChange: (model: Model) => void;
};

export function ChatInput({ onSend, models, currentModel, onModelChange }: ChatInputProps) {
  const config = getConfig();
  const client = config.client;

  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentEditableRef = useRef<HTMLDivElement>(null);

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
      
      // Clear the contenteditable div
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
    const data = await captureScreenshot();

    const attachment = {
      type: AttachmentType.Image,
      name: "screenshot.png",
      data: data,
    };

    setAttachments((prev) => [...prev, attachment]);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (files) {
      const newAttachments: Attachment[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (textTypes.includes(file.type) || textTypes.includes(getFileExt(file.name))) {
          const text = await readAsText(file);
          newAttachments.push({
            type: AttachmentType.Text,
            name: file.name,
            data: text,
          });
        }

        if (imageTypes.includes(file.type) || imageTypes.includes(getFileExt(file.name))) {
          const blob = await resizeImageBlob(file, 1920, 1920);
          const url = await readAsDataURL(blob);
          newAttachments.push({
            type: AttachmentType.Image,
            name: file.name,
            data: url,
          });
        }

        if (partitionTypes.includes(file.type) || partitionTypes.includes(getFileExt(file.name))) {
          const parts = await client.partition(file);
          const text = parts.map((part) => part.text).join("\n\n");

          newAttachments.push({
            type: AttachmentType.Text,
            name: file.name,
            data: text,
          });
        }
      }

      setAttachments((prev) => [...prev, ...newAttachments]);
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
      <div className="border border-neutral-400 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 rounded flex flex-col min-h-[3rem]">
        <input
          type="file"
          multiple
          accept={supportedTypes.join(",")}
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />

        <div
          ref={contentEditableRef}
          className="p-2 pr-0 bg-transparent dark:text-neutral-200 focus:outline-none flex-1 max-h-[40vh] overflow-y-auto min-h-[2.5rem] whitespace-pre-wrap break-words empty:before:content-[attr(data-placeholder)] empty:before:text-neutral-500 empty:before:dark:text-neutral-400"
          style={{ scrollbarWidth: "thin" }}
          role="textbox"
          contentEditable
          suppressContentEditableWarning={true}
          data-placeholder="Ask anything"
          onInput={(e) => {
            const target = e.target as HTMLDivElement;
            setContent(target.textContent || "");
          }}
          onKeyDown={handleKeyDown}
        />

        <div className="flex items-center justify-between gap-1 p-2 pt-0">
          <div className="flex items-center">
            <Menu>
              <MenuButton className="inline-flex items-center gap-1 pl-0 pr-1.5 py-1.5 text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 cursor-pointer focus:outline-none text-sm">
                <Brain size={14} />
                <span>
                  {currentModel?.name ?? currentModel?.id ?? "Select Model"}
                </span>
              </MenuButton>
              <MenuItems
                transition
                anchor="bottom start"
                className="!max-h-[50vh] mt-2 rounded border bg-neutral-200 dark:bg-neutral-900 border-neutral-700 overflow-y-auto shadow-lg z-50"
              >
                {models.map((model) => (
                  <MenuItem key={model.id}>
                    <Button
                      onClick={() => onModelChange(model)}
                      title={model.description}
                      className="group flex w-full items-center px-4 py-2 data-[focus]:bg-neutral-300 dark:text-neutral-200 dark:data-[focus]:bg-[#2c2c2e] cursor-pointer"
                    >
                      {model.name ?? model.id}
                    </Button>
                  </MenuItem>
                ))}
              </MenuItems>
            </Menu>
          </div>

          <div className="flex items-center gap-1">
            {supportsScreenshot() && (
              <Button
                type="button"
                className="p-1.5 text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 cursor-pointer focus:outline-none"
                onClick={handleScreenshotClick}
              >
                <ScreenShare size={16} />
              </Button>
            )}

            <Button
              type="button"
              className="p-1.5 text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 cursor-pointer focus:outline-none"
              onClick={handleAttachmentClick}
            >
              <Paperclip size={16} />
            </Button>

            <Button
              className="pl-1.5 pr-0 py-1.5 text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 cursor-pointer focus:outline-none"
              type="submit"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {attachments.map((val, i) => (
            <div key={i} className="flex items-center gap-1 chat-input-attachment">
              <Image size={16} />
              <span className="text-sm break-all">
                {val.name}
              </span>
              <Button
                type="button"
                className="cursor-pointer"
                onClick={() => handleRemoveAttachment(i)}
              >
                <X size={16} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
