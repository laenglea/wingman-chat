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
    Text = "text",
    File = "file_data",
    Image = "image_data",
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