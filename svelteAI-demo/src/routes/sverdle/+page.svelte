<script lang="ts">
	import type { PageProps } from './$types'
	import SverdelGame from './SverdelGame.svelte'
	import SverdelChat from './SverdelChat.svelte'
	import { createChat } from './agent.js'

	let { data }: PageProps = $props()

	let apiKeyInput = $state('')
	let activeKey = $state('')

	// svelte-ignore state_referenced_locally
	let chat = $state<ReturnType<typeof createChat> | null>(null)

	function applyKey() {
		const k = apiKeyInput.trim()
		if (!k) return
		activeKey = k
		chat = createChat(k)
	}

	function handleKeyFormSubmit(e: SubmitEvent) {
		e.preventDefault()
		applyKey()
	}
</script>

<svelte:head>
	<title>Sverdle</title>
	<meta name="description" content="A Wordle clone written in SvelteKit" />
</svelte:head>

<div class="page-layout">
	<div class="game-col">
		<SverdelGame {data} />
	</div>

	<aside class="chat-col">
		<div class="chat-header">
			<h2>AI Assistant</h2>
			<details class="how-it-works">
				<summary>How it works</summary>
				<div class="how-body">
					<p>
						This demo shows how to make an existing Svelte component AI-aware using
						<strong>svelteAI</strong> decorators — no rewrite needed.
					</p>

					<h3>1. Register the component</h3>
					<p>Add a <code>&lt;script module&gt;</code> block with <code>@component</code>:</p>
					<pre><code>&lt;script module&gt;
	 @component(&#123; description: 'The active Sverdle game board.' &#125;)
&lt;/script&gt;</code></pre>

					<h3>2. Expose state to the agent</h3>
					<p>Annotate derived values with <code>@ai</code> — the agent sees them as read-only context:</p>
					<pre><code>@ai(&#123; access: 'r', description: 'Summary of all guesses so far.' &#125;)
let guesses_summary = $derived(
	 data.answers.map((answer, idx) =&gt;
	   (&#123; word: data.guesses[idx], result: answer &#125;))
)

@ai(&#123; access: 'r', description: 'Known letter statuses.' &#125;)
let letter_statuses = $derived(classnames)</code></pre>

					<h3>3. Expose an action</h3>
					<p>Annotate a function with <code>@ai</code> — the agent can call it as a tool:</p>
					<pre><code>@ai(&#123; description: 'Enters a 5-letter word and submits it.' &#125;)
async function enterGuess(&#123; word &#125;: &#123; word: string &#125;) &#123;
	 // types letters via DOM clicks, then submits
	 ...
	 return &#123; ok: true, word &#125;
&#125;</code></pre>

					<h3>4. Wire up the agent</h3>
					<p>
						In <code>agent.ts</code>, inject the live game state into the system prompt on every
						turn via <code>svelteAI.getContext()</code>. The agent can then call
						<code>enterGuess</code> as a tool when asked to play a word.
					</p>
				</div>
			</details>
			{#if !activeKey}
				<form class="key-form" onsubmit={handleKeyFormSubmit}>
					<label for="api-key" class="key-label">OpenAI API key</label>
					<div class="key-row">
						<input
							id="api-key"
							type="password"
							bind:value={apiKeyInput}
							placeholder="sk-..."
							autocomplete="off"
							class="key-input"
						/>
						<button type="submit" class="key-btn" disabled={!apiKeyInput.trim()}>
							Start
						</button>
					</div>
					<p class="key-hint">
						Your key stays in this tab and goes directly to OpenAI.
					</p>
				</form>
			{:else}
				<div class="key-active-row">
					<span class="key-active-label">🔑 Key set</span>
					<button
						class="key-change-btn"
						onclick={() => { activeKey = ''; chat = null; apiKeyInput = '' }}
					>Change</button>
				</div>
			{/if}
		</div>

		<div class="chat-container" class:chat-disabled={!chat}>
			{#if chat}
				<SverdelChat {chat} />
			{:else}
				<div class="chat-placeholder">
					Enter your OpenAI API key above to get hints, word suggestions, or let the AI play a guess.
				</div>
			{/if}
		</div>
	</aside>
</div>

<style>
	.page-layout {
		display: grid;
		grid-template-columns: 1fr 340px;
		gap: 1.5rem;
		width: 100%;
		height: 100%;
		min-height: 0;
		align-items: stretch;
	}

	@media (max-width: 800px) {
		.page-layout {
			grid-template-columns: 1fr;
		}
	}

	.game-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: 0;
	}

	.chat-col {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-height: calc(100vh - 8rem);
		min-height: 0;
	}

	.chat-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	h2 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: #1e293b;
		border-bottom: 1px solid #e2e8f0;
		padding-bottom: 0.4rem;
	}

	.how-it-works {
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #f8fafc;
		font-size: 0.8rem;
	}

	.how-it-works summary {
		cursor: pointer;
		padding: 0.5rem 0.75rem;
		font-weight: 600;
		color: #475569;
		user-select: none;
		list-style: none;
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.how-it-works summary::before {
		content: '▶';
		font-size: 0.6rem;
		transition: transform 0.15s;
		color: #94a3b8;
	}

	.how-it-works[open] summary::before {
		transform: rotate(90deg);
	}

	.how-body {
		padding: 0 0.75rem 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		overflow-y: auto;
		max-height: 60vh;
	}

	.how-body p {
		margin: 0;
		color: #475569;
		line-height: 1.5;
	}

	.how-body h3 {
		margin: 0.5rem 0 0;
		font-size: 0.78rem;
		font-weight: 700;
		color: #334155;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.how-body pre {
		margin: 0;
		background: #1e293b;
		color: #e2e8f0;
		border-radius: 0.375rem;
		padding: 0.6rem 0.75rem;
		font-size: 0.72rem;
		line-height: 1.5;
		overflow-x: auto;
		white-space: pre;
	}

	.how-body code {
		font-family: 'Fira Mono', monospace;
	}

	.chat-container {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.chat-disabled {
		opacity: 0.5;
		pointer-events: none;
	}

	.chat-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		min-height: 200px;
		color: #94a3b8;
		font-size: 0.875rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		background: white;
		text-align: center;
		padding: 1.5rem;
		line-height: 1.5;
	}

	.key-form {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 0.75rem;
	}

	.key-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: #334155;
	}

	.key-row {
		display: flex;
		gap: 0.5rem;
	}

	.key-input {
		flex: 1;
		padding: 0.4rem 0.6rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-family: 'Fira Mono', monospace;
		outline: none;
	}

	.key-input:focus {
		border-color: #ff3e00;
		box-shadow: 0 0 0 2px rgba(255, 62, 0, 0.15);
	}

	.key-btn {
		padding: 0.4rem 0.9rem;
		background: #ff3e00;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		cursor: pointer;
		white-space: nowrap;
	}

	.key-btn:hover:not(:disabled) {
		background: #e03600;
	}

	.key-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.key-hint {
		font-size: 0.75rem;
		color: #94a3b8;
		margin: 0;
	}

	.key-active-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.8rem;
		color: #475569;
	}

	.key-active-label {
		font-weight: 600;
		color: #16a34a;
	}

	.key-change-btn {
		background: none;
		border: 1px solid #cbd5e1;
		border-radius: 0.375rem;
		padding: 0.15rem 0.5rem;
		font-size: 0.75rem;
		cursor: pointer;
		color: #64748b;
	}

	.key-change-btn:hover {
		background: #f1f5f9;
	}
</style>
