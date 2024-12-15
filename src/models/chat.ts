export enum Role {
    User = "user",
    Assistant = "assistant",
}

export type Attachment = {
    name: string;
    url: string;
};

export type Message = {
    role: 'user' | 'assistant';

    content: string;
    attachments?: Attachment[];
};

export type Chat = {
    id: string;
    title: string;

    model: string;
    messages: Array<Message>;
};