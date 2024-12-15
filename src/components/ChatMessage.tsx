import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { Message, Role } from '../models/chat';

import { Bot, User } from 'lucide-react';

type ChatMessageProps = {
  message: Message
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === Role.User;

  const bubbleClasses = isUser
    ? 'bg-[#3a3a3c] text-[#e5e5e5]'
    : 'bg-[#2c2c2e] text-[#e5e5e5]';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-4 mb-4`}>
      {!isUser && (
        <div className="mr-2 pt-3">
          <Bot className="text-[#e5e5e5] w-6 h-6" />
        </div>
      )}

      <div className={`max-w-[60%] rounded-lg p-3 break-words ${bubbleClasses} whitespace-pre-wrap break-words overflow-x-auto`}>
        <ReactMarkdown
          children={message.content}
          components={{
            code(props) {
              const { children, className, node, ref, ...rest } = props
              const match = /language-(\w+)/.exec(className || '')
              return match ? (
                <SyntaxHighlighter
                  {...rest}
                  className={`${className} whitespace-pre-wrap`}
                  children={String(children).replace(/\n$/, '')}
                  PreTag="div"
                  style={vscDarkPlus}
                  language={match[1]}
                />
              ) : (
                <code
                  {...rest}
                  className={`${className} whitespace-pre-wrap`}
                  children={children}
                />
              )
            }
          }}
        />
      </div>

      {isUser && (
        <div className="ml-2 pt-3">
          <User className="text-[#e5e5e5] w-6 h-6" />
        </div>
      )}
    </div>
  );
}