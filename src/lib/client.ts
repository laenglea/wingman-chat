import OpenAI from 'openai';
import { Message, Role } from '../models/chat';

export const model = 'gpt-4o-mini';

const client = new OpenAI({
	baseURL: new URL('/api/v1', window.location.origin).toString(),
	apiKey: 'sk-',
	dangerouslyAllowBrowser: true,
})

export async function complete(input: Message[], handler?: (delta: string, snapshot: string) => void): Promise<Message> {
	const messages = input.map((m) => {
		return {
			role: m.role,
			content: m.content,
		};
	});
	
	const stream = client.beta.chat.completions.stream({
		model: model,
		stream: true,

		messages: messages,
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