import OpenAI from 'openai';

import { Message, Role } from '../models/chat';

export const models = [
	{
		"id": "poppy",
		"name": "Anthropic Claude"
	},
	{
		"id": "herby",
		"name": "OpenAI GPT-4o"
	},
	{
		"id": "gabi",
		"name": "Google Gemini"
	},
	{
		"id": "anton",
		"name": "Amazon Nova"
	},
	{
		"id": "brauni",
		"name": "Meta Llama"
	},
	{
		"id": "ernie",
		"name": "xAI Grok"
	},
	{
		"id": "schlaubi",
		"name": "OpenAI o1"
	}
];

const client = new OpenAI({
	baseURL: new URL('/api/v1', window.location.origin).toString(),
	apiKey: 'sk-',
	dangerouslyAllowBrowser: true,
})

export async function complete(model: string, input: Message[], handler?: (delta: string, snapshot: string) => void): Promise<Message> {
	const messages = [];

	for (const m of input) {
		const content = [];

		if (m.content) {
			content.push({ type: 'text', text: m.content });
		}

		for (const a of m.attachments ?? []) {
			content.push({
				type: 'image_url',
				image_url: {
					url: a.url
				}
			});
		}

		messages.push({
			role: m.role as OpenAI.Chat.ChatCompletionRole,
			content: content,
		});
	}

	const stream = client.beta.chat.completions.stream({
		model: model,
		stream: true,

		messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
	});

	stream.on('content', (delta, snapshot) => {
		if (handler) {
			handler(delta, snapshot);
		}
	});

	const completion = await stream.finalChatCompletion();

	const result = {
		role: Role.Assistant,
		content: completion.choices[0].message.content ?? '',
	}

	return result;
}