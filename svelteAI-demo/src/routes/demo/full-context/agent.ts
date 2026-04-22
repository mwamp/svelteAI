import { DirectChatTransport, ToolLoopAgent, tool, stepCountIs } from 'ai'
import { Chat } from '@ai-sdk/svelte'
import { createOpenAI } from '@ai-sdk/openai'
import { goto } from '$app/navigation'
import { z } from 'zod'
import { svelteAI } from './svelteai.js'

/**
 * Creates a new Chat instance for the full-context demo.
 *
 * Uses DirectChatTransport + ToolLoopAgent so the agent runs entirely
 * in-process — no server route needed.
 *
 * @param apiKey - OpenAI API key. Falls back to VITE_OPENAI_API_KEY env var
 *   so local dev with a .env file still works without typing the key.
 */
export function createChat(apiKey: string): Chat {
	const openai = createOpenAI({ apiKey })

	const tools = {
		navigate: tool({
			description: 'Navigate to a different page in the app.',
			inputSchema: z.object({
				path: z.string().describe('The route path to navigate to.'),
			}),
			execute: async ({ path }) => {
				await goto(path)
				return { ok: true, path }
			},
		}),
		...svelteAI.tools.callAction,
		...svelteAI.tools.setState,
		...svelteAI.tools.lookupComponent,
	}

	const agent = new ToolLoopAgent({
		model: openai('gpt-4o-mini'),
		instructions: 'You are a smart home assistant.',
		tools,
		stopWhen: stepCountIs(10),
		prepareStep: async ({ messages }) => {
			return {
				messages: [
					{
						role: 'system' as const,
						content: `You are a smart home assistant. You can read and control the home's devices.

Current app state:
${svelteAI.getContext()}`,
					},
					...messages.filter((m: { role: string }) => m.role !== 'system'),
				],
			}
		},
	})

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return new Chat({
		transport: new DirectChatTransport({ agent }),
	}) as any
}
