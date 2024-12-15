import { ChangeEvent, useState, FormEvent, useRef } from 'react';
import { Attachment, Message, Role } from '../models/chat';
import { Send, Paperclip, Image, X } from 'lucide-react';

type ChatInputProps = {
  onSend: (message: Message) => void;
};

export function ChatInput({ onSend }: ChatInputProps) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (content.trim()) {
      const message: Message = {
        role: Role.User,
        content: content,
        attachments: attachments
      }

      onSend(message);
      setContent('');
      setAttachments([]);
    }
  };

  const handleAttachmentClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (files) {
      const newAttachments: Attachment[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const url = URL.createObjectURL(file);
        newAttachments.push({ name: file.name, url });
      }

      setAttachments((prev) => [...prev, ...newAttachments]);
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#121212]">
      <div className="flex py-4 px-4 items-center gap-2">
        <input
          type="file"
          multiple
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />

        <input
          className="flex-1 border border-[#3a3a3c] bg-[#2c2c2e] text-[#e5e5e5] rounded px-3 py-2 focus:outline-none"
          type="text"
          placeholder="Ask..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <button
          type="button"
          className="p-2 text-[#e5e5e5] hover:text-gray-300 bg-transparent"
          onClick={handleAttachmentClick}
        >
          <Paperclip size={20} />
        </button>

        <button
          className="p-2 text-[#e5e5e5] hover:text-gray-300 bg-transparent"
          type="submit"
        >
          <Send size={20} />
        </button>
      </div>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 pl-4 pr-26">
          {attachments.map((val, i) => (
            <div key={i} className="flex items-center gap-1 bg-[#2c2c2e] p-2 rounded">
              <Image className="text-[#e5e5e5]" size={16} />
              <span className="text-[#e5e5e5] text-sm break-all">{val.name}</span>
              <button
                type="button"
                className="text-[#e5e5e5] hover:text-gray-300"
                onClick={() => handleRemoveAttachment(i)}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </form>
  );
}