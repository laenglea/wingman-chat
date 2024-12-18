export type Model = {
    id: string;
    name: string;
}

export type Message = {
    role: 'user' | 'assistant';

    content: string;
    attachments?: Attachment[];
};

export enum Role {
    User = "user",
    Assistant = "assistant",
}

export enum AttachmentType {
    Image = "image_data",
    Text = "text",
  }

export type Attachment = {
    type: AttachmentType;
    name: string;

    data: string;
};

export type Chat = {
    id: string;
    title: string;

    created: Date | null;
    updated: Date | null;

    model: Model | null;
    messages: Array<Message>;
};

export type Partition = {
    text: string;
};