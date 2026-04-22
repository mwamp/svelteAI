import { DirectChatTransport, ToolLoopAgent, stepCountIs } from 'ai'
import { Chat } from '@ai-sdk/svelte'
import { createOpenAI } from '@ai-sdk/openai'
import { svelteAI } from './svelteai.js'

/**
 * Creates a Chat instance for the Sverdle AI assistant.
 *
 * The agent uses the full-context pattern: game state is injected into the
 * system prompt on every turn via svelteAI.getContext().
 *
 * Tools provided by the framework:
 *  - call_action: invokes enterGuess() on the SverdelGame component
 *  - set_state / lookup_component: standard svelteAI tools
 *
 * The agent reasons about hints and word suggestions from its own knowledge
 * of English words — no server route needed.
 */
export function createChat(apiKey: string): Chat {
	const openai = createOpenAI({ apiKey })

	const tools = {
		...svelteAI.tools.callAction,
		...svelteAI.tools.setState,
		...svelteAI.tools.lookupComponent,
	}

	const agent = new ToolLoopAgent({
		model: openai('gpt-4o-mini'),
		instructions: 'You are a Sverdle (Wordle) assistant.',
		tools,
		stopWhen: stepCountIs(10),
		prepareStep: async ({ messages }) => {
			return {
				messages: [
					{
						role: 'system' as const,
						content: `You are a helpful Sverdle (Wordle clone) assistant. You can see the current game state and help the player.

Rules reminder:
- The answer is a secret 5-letter word.
- Each guess must be a valid 5-letter English word.
- After each guess, each letter is marked:
  - x = exact: correct letter, correct position
  - c = close: correct letter, wrong position
  - _ = missing: letter not in the word
- The player has 6 attempts.

You can help in three ways:
1. Give a hint - reason about what letters are known/unknown and suggest a strategy. Do NOT reveal the answer.
2. Suggest admissible words - propose 3-5 valid English words consistent with the known constraints (exact positions, present letters, absent letters). Use your knowledge of English vocabulary.
3. Enter a guess - call the enterGuess action on the SverdelGame component when the user explicitly asks you to play a word for them.

To enter a guess, use the call_action tool with the path "SverdelGame:<id>.enterGuess" and args { word: "<5-letter-word>" }.
Look up the component id first using lookup_component if needed.

Current game state:
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
