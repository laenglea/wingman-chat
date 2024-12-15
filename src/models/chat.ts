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

    created: Date | null;
    updated: Date | null;

    model: Model | null;
    messages: Array<Message>;
};

export type Model = {
    id: string;
    name: string;
}