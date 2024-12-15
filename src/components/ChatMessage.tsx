import ReactMarkdown from 'react-markdown';
import { Message, Role } from '../models/chat';

import { Bot } from 'lucide-react';

type ChatMessageProps = {
  message: Message
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === Role.User;
  
  const bubbleClasses = isUser
    ? 'bg-[#3a3a3c] text-[#e5e5e5]'
    : 'bg-[#2c2c2e] text-[#e5e5e5]';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="mr-2 pt-3">
          <Bot className="text-[#e5e5e5] w-6 h-6" />
        </div>
      )}

      <div className={`max-w-sm rounded-lg p-3 ${bubbleClasses}`}>
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
    </div>
  );
}