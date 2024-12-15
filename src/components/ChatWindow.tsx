import { Message } from '../models/chat';
import { ChatMessage } from './ChatMessage';

type ChatWindowProps = {
  messages: Message[];
};

export function ChatWindow({ messages }: ChatWindowProps) {
  return (
    <>
      {messages.map((message, idx) => (
        <ChatMessage key={idx} message={message} />
      ))}
    </>
  );
}