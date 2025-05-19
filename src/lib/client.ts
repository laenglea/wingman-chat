import OpenAI from "openai";
import { Tool } from "../models/chat";
import { Message, Model, Role, AttachmentType, Partition } from "../models/chat";

export const textTypes = [
  "text/csv",
  "text/markdown",
  "text/plain",
  "application/json",
  "application/sql",
  "application/toml",
  "application/x-yaml",
  "application/xml",
  "text/css",
  "text/html",
  "text/xml",
  "text/yaml",
  ".c",
  ".cpp",
  ".cs",
  ".go",
  ".html",
  ".java",
  ".js",
  ".kt",
  ".py",
  ".rs",
  ".ts",
];

export const imageTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export const partitionTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const supportedTypes = [...textTypes, ...imageTypes, ...partitionTypes];

export class Client {
  private oai: OpenAI;

  constructor(apiKey: string = "sk-") {
    this.oai = new OpenAI({
      baseURL: new URL("/api/v1", window.location.origin).toString(),
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  async listModels(): Promise<Model[]> {
    const models = await this.oai.models.list();
    return models.data.map((model) => ({
      id: model.id,
      name: model.id,
    }));
  }

  async complete(model: string, tools: Tool[], input: Message[], handler?: (delta: string, snapshot: string) => void): Promise<Message> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    for (const m of input) {
      const content: OpenAI.Chat.ChatCompletionContentPart[] = [];

      if (m.content) {
        content.push({ type: "text", text: m.content });
      }

      for (const a of m.attachments ?? []) {
        if (a.type === AttachmentType.Text) {
          content.push({
            type: "text",
            text: a.name + ":\n```" + a.data + "\n```",
          });
        }

        if (a.type === AttachmentType.File) {
          content.push({
            type: "file",
            file: { file_data: a.data },
          });
        }

        if (a.type === AttachmentType.Image) {
          content.push({
            type: "image_url",
            image_url: { url: a.data },
          });
        }
      }

      messages.push({
        role: Role.User,
        content: content,
      });
    }

    const stream = this.oai.beta.chat.completions.stream({
      model: model,

      tools: this.toTools(tools),
      messages: messages,

      stream: true,
      stream_options: { include_usage: true },
    });

    if (handler) {
      stream.on("content", handler);
    }

    let completion = await stream.finalChatCompletion();
    messages.push(completion.choices[0].message);

    while (completion.choices[0].message?.tool_calls?.length ?? 0 > 0) {
      const toolCalls = completion.choices[0].message.tool_calls;
      if (!toolCalls) break;

      for (const toolCall of toolCalls) {
        const tool = tools.find((t) => t.name === toolCall.function.name);

        if (!tool) {
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: `Error: Tool "${toolCall.function.name}" not found or not executable.`,
          });

          continue;
        }

        try {
          const args = JSON.parse(toolCall.function.arguments);
          const content = await tool.function(args);

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: content,
          });
        } catch (error) {
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: `Error executing tool "${toolCall.function.name}": ${(error as Error).message}`,
          });
        }
      }

      completion = await this.oai.beta.chat.completions.parse({
        model: model,
        
        tools: this.toTools(tools),
        messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      });
    }

    const message = completion.choices[0].message;

    return {
      role: Role.Assistant,

      content: message.content ?? "",
      refusal: message.refusal ?? "",

      inputTokens: completion.usage?.prompt_tokens ?? 0,
      outputTokens: completion.usage?.completion_tokens ?? 0,
    };
  }

  async summarize(model: string, input: Message[]): Promise<string> {
    const history = input
      .slice(-6) // Get last 6 messages
      .map((m) => `${m.role}: ${m.content}`) // Include role for context
      .join("\\n");

    const completion = await this.oai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "user",
          content: `Summarize the following conversation into a short title (less than 10 words). Return only the title itself, without any introductory phrases, explanations, or quotation marks.\n\nConversation:\n${history}`,
        },
      ],
      temperature: 0.2,
    });

    return completion.choices[0].message.content?.trim() ?? "Summary not available";
  }

  async partition(blob: Blob): Promise<Partition[]> {
    const data = new FormData();
    data.append("files", blob);

    const resp = await fetch(new URL("/api/v1/partition", window.location.origin), {
      method: "POST",
      headers: {
        accept: "application/json",
      },
      body: data,
    });

    if (!resp.ok) {
      throw new Error(`Partition request failed with status ${resp.status}`);
    }

    return resp.json() as Promise<Partition[]>;
  }

  async translate(lang: string, text: string): Promise<string> {
    const data = new FormData();
    data.append("lang", lang);
    data.append("text", text);

    const resp = await fetch(new URL("/api/v1/translate", window.location.origin), {
      method: "POST",
      body: data,
    });

    if (!resp.ok) {
      throw new Error(`Translate request failed with status ${resp.status}`);
    }

    return resp.text();
  }

  private toTools(tools: Tool[]): OpenAI.Chat.Completions.ChatCompletionTool[] | undefined {
    if (!tools || tools.length === 0) {
      return undefined;
    }

    return tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,

        strict: true,
        parameters: tool.parameters,
      },
    }));
  }
}