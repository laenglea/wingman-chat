import { ChangeEvent, useState, FormEvent, useRef, useEffect } from "react";
import { Textarea, Button } from '@headlessui/react'

import { Send, Paperclip, ScreenShare, Image, X } from "lucide-react";

import { Attachment, AttachmentType, Message, Role } from "../models/chat";
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
};

export function ChatInput({ onSend }: ChatInputProps) {
  const config = getConfig();
  const client = config.client;

  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textInputRef.current) {
      textInputRef.current.style.height = "auto";
      const newHeight = Math.min(textInputRef.current.scrollHeight, window.innerHeight * 0.4) + 2;
      textInputRef.current.style.height = newHeight + "px";
    }
  }, [content]);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex py-2 items-center gap-1">
        <input
          type="file"
          multiple
          accept={supportedTypes.join(",")}
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />

        <Textarea
          ref={textInputRef}
          className="flex-1 chat-input max-h-[40vh] overflow-y-auto resize-none"
          style={{ scrollbarWidth: "thin" }}
          placeholder="we need to talk..."
          value={content}
          rows={1}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {supportsScreenshot() && (
          <Button
            type="button"
            className="chat-input-button"
            onClick={handleScreenshotClick}
          >
            <ScreenShare size={20} />
          </Button>
        )}

        <Button
          type="button"
          className="chat-input-button"
          onClick={handleAttachmentClick}
        >
          <Paperclip size={20} />
        </Button>

        <Button
          className="chat-input-button"
          type="submit"
        >
          <Send size={20} />
        </Button>
      </div>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mr-30">
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
