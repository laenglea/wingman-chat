import { Message } from '../models/chat';
import { ChatMessage } from './ChatMessage';

type ChatWindowProps = {
  messages: Message[];
};

export function ChatWindow({ messages }: ChatWindowProps) {
  return (
    <>
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center text-[#e5e5e5]">
          <img src="/logo.png" className="w-48 h-48 mb-4" />
        </div>
      ) : (
        messages.map((message, idx) => <ChatMessage key={idx} message={message} />)
      )}
    </>
  );
}