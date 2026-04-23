import { DirectChatTransport, ToolLoopAgent, stepCountIs } from 'ai'
import { Chat } from '@ai-sdk/svelte'
import { createOpenAI } from '@ai-sdk/openai'
import { svelteAI } from './svelteai.js'

/**
 * Creates a new Chat instance for the full-context demo.
 *
 * Uses DirectChatTransport + ToolLoopAgent so the agent runs entirely
 * in-process — no server route needed.
 *
 * Navigation tools (navigateByUrl, navigateByIndex, lookupRoute) let the
 * agent move between pages in the /demo/full-context route group.
 */
export function createChat(apiKey: string): Chat {
	const openai = createOpenAI({ apiKey })

	const tools = {
		...svelteAI.tools.lookupRoute,
		...svelteAI.tools.navigateByUrl,
		...svelteAI.tools.navigateByIndex,
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
						content: `You are a smart home assistant. You can read and control the home's devices and navigate between pages.

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
