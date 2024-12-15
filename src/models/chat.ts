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

    model: Model | null;
    messages: Array<Message>;
};

export type Model = {
    id: string;
    name: string;
}