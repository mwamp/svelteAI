<script lang="ts">
	import type { Chat } from '@ai-sdk/svelte'

	let { chat }: { chat: Chat } = $props()

	let input = $state('')
	let messagesEl = $state<HTMLDivElement | null>(null)

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault()
		send(input.trim())
	}

	function send(text: string) {
		if (!text) return
		input = ''
		chat.sendMessage({ text })
	}

	$effect(() => {
		if (messagesEl && chat.messages.length > 0) {
			messagesEl.scrollTop = messagesEl.scrollHeight
		}
	})

	const busy = $derived(chat.status === 'streaming' || chat.status === 'submitted')
</script>

<div class="chat-panel">
	<div class="messages" bind:this={messagesEl}>
		{#if chat.messages.length === 0}
			<p class="empty-hint">Ask the assistant for a hint, word suggestions, or let it play a guess.</p>
		{/if}
		{#each chat.messages as message (message.id)}
			{#if message.role !== 'system'}
				<div class="message {message.role}">
					<span class="role-label">{message.role === 'user' ? 'You' : 'Assistant'}</span>
					<div class="content">
						{#each message.parts as part}
							{#if part.type === 'text'}
								<p>{part.text}</p>
							{/if}
						{/each}
					</div>
				</div>
			{/if}
		{/each}
		{#if busy}
			<div class="message assistant thinking">
				<span class="role-label">Assistant</span>
				<div class="content"><span class="dots">···</span></div>
			</div>
		{/if}
		{#if chat.error}
			<div class="error-msg">Error: {chat.error.message}</div>
		{/if}
	</div>

	<div class="quick-actions">
		<button class="quick-btn" disabled={busy} onclick={() => send('Give me a hint')}>
			💡 Hint
		</button>
		<button class="quick-btn" disabled={busy} onclick={() => send('Suggest some admissible words')}>
			📋 Suggest words
		</button>
		<button class="quick-btn" disabled={busy} onclick={() => send('Play the best guess for me')}>
			🎯 Play a guess
		</button>
	</div>

	<form class="input-row" onsubmit={handleSubmit}>
		<input
			type="text"
			bind:value={input}
			placeholder="Ask for a hint, words, or say 'play crane'…"
			disabled={busy}
		/>
		<button type="submit" disabled={!input.trim() || busy} aria-label="Send message">Send</button>
	</form>
</div>

<style>
	.chat-panel {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		overflow: hidden;
		background: white;
	}

	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-height: 0;
	}

	.empty-hint {
		color: #94a3b8;
		font-size: 0.875rem;
		text-align: center;
		margin: auto;
		line-height: 1.5;
	}

	.message {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		max-width: 85%;
	}

	.message.user {
		align-self: flex-end;
	}

	.message.assistant {
		align-self: flex-start;
	}

	.role-label {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #94a3b8;
	}

	.message.user .role-label {
		text-align: right;
	}

	.content {
		background: #f1f5f9;
		border-radius: 0.5rem;
		padding: 0.5rem 0.75rem;
	}

	.message.user .content {
		background: #ff3e00;
		color: white;
	}

	.content p {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.5;
		white-space: pre-wrap;
	}

	.dots {
		font-size: 1.25rem;
		letter-spacing: 0.1em;
		color: #94a3b8;
	}

	.error-msg {
		color: #ef4444;
		font-size: 0.875rem;
		padding: 0.5rem;
		background: #fef2f2;
		border-radius: 0.375rem;
	}

	.quick-actions {
		display: flex;
		gap: 0.4rem;
		padding: 0.5rem 0.75rem 0;
		flex-wrap: wrap;
	}

	.quick-btn {
		padding: 0.3rem 0.65rem;
		font-size: 0.78rem;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 999px;
		cursor: pointer;
		color: #475569;
		white-space: nowrap;
		transition: background 0.1s, border-color 0.1s;
	}

	.quick-btn:hover:not(:disabled) {
		background: #e2e8f0;
		border-color: #cbd5e1;
	}

	.quick-btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.input-row {
		display: flex;
		gap: 0.5rem;
		padding: 0.6rem 0.75rem 0.75rem;
		border-top: 1px solid #e2e8f0;
		margin-top: 0.5rem;
	}

	.input-row input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.375rem;
		font-size: 0.9rem;
		outline: none;
		font-family: inherit;
	}

	.input-row input:focus {
		border-color: #ff3e00;
		box-shadow: 0 0 0 2px rgba(255, 62, 0, 0.15);
	}

	.input-row button {
		padding: 0.5rem 1rem;
		background: #ff3e00;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.9rem;
		cursor: pointer;
		white-space: nowrap;
	}

	.input-row button:hover:not(:disabled) {
		background: #e03600;
	}

	.input-row button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
