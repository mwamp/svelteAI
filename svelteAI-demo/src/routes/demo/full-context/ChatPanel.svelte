<script lang="ts">
	import type { Chat } from '@ai-sdk/svelte'

	let { chat }: { chat: Chat } = $props()

	let input = $state('')
	let messagesEl = $state<HTMLDivElement | null>(null)

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault()
		const text = input.trim()
		if (!text) return
		input = ''
		chat.sendMessage({ text })
	}

	$effect(() => {
		// Scroll to bottom when messages change
		if (messagesEl && chat.messages.length > 0) {
			messagesEl.scrollTop = messagesEl.scrollHeight
		}
	})
</script>

<div class="chat-panel">
	<div class="messages" bind:this={messagesEl}>
		{#if chat.messages.length === 0}
			<p class="empty-hint">Ask the assistant to adjust your thermostats…</p>
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
		{#if chat.status === 'streaming' || chat.status === 'submitted'}
			<div class="message assistant thinking">
				<span class="role-label">Assistant</span>
				<div class="content"><span class="dots">···</span></div>
			</div>
		{/if}
		{#if chat.error}
			<div class="error-msg">Error: {chat.error.message}</div>
		{/if}
	</div>

	<form class="input-row" onsubmit={handleSubmit}>
		<input
			type="text"
			bind:value={input}
			placeholder="Ask about your home…"
			disabled={chat.status === 'streaming' || chat.status === 'submitted'}
		/>
		<button
			type="submit"
			disabled={!input.trim() || chat.status === 'streaming' || chat.status === 'submitted'}
			aria-label="Send message"
		>Send</button>
	</form>
</div>

<style>
	.chat-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
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
		background: #3b82f6;
		color: white;
	}

	.content p {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.5;
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

	.input-row {
		display: flex;
		gap: 0.5rem;
		padding: 0.75rem;
		border-top: 1px solid #e2e8f0;
	}

	.input-row input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.375rem;
		font-size: 0.9rem;
		outline: none;
	}

	.input-row input:focus {
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
	}

	.input-row button {
		padding: 0.5rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.9rem;
		cursor: pointer;
		white-space: nowrap;
	}

	.input-row button:hover:not(:disabled) {
		background: #2563eb;
	}

	.input-row button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
