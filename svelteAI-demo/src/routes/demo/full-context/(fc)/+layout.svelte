<script lang="ts">
	import { base } from '$app/paths'
	import { page } from '$app/state'
	import ChatPanel from './ChatPanel.svelte'
	import { createChat } from './agent.js'
	import { svelteAI } from './svelteai.js'

	let { children } = $props()

	// API key — always supplied by the user at runtime
	let apiKeyInput = $state('')
	let activeKey = $state('')

	// Chat is null until a key is confirmed
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

	// Context snapshot — polled while the details panel is open
	let contextSnapshot = $state('')
	let contextOpen = $state(false)

	$effect(() => {
		if (!contextOpen) return
		contextSnapshot = svelteAI.getContext()
		const id = setInterval(() => {
			contextSnapshot = svelteAI.getContext()
		}, 1000)
		return () => clearInterval(id)
	})

	function handleContextToggle(e: Event) {
		contextOpen = (e.currentTarget as HTMLDetailsElement).open
	}

	const navLinks = [
		{ href: `${base}/demo/full-context`, label: 'Overview' },
		{ href: `${base}/demo/full-context/thermostats`, label: 'Thermostats' },
		{ href: `${base}/demo/full-context/energy`, label: 'Energy' },
		{ href: `${base}/demo/full-context/settings`, label: 'Settings' },
	]
</script>

<div class="fc-layout">
	<header class="fc-header">
		<a href="{base}/demo" class="back-link">← Demo index</a>
		<h1>Full Context Demo</h1>
		<p class="subtitle">
			AI assistant reads annotated state and can navigate between pages via tool calls.
		</p>
		<nav class="tab-nav">
			{#each navLinks as link (link.href)}
				<a
					href={link.href}
					class="tab-link"
					class:active={page.url.pathname === link.href}
				>{link.label}</a>
			{/each}
		</nav>
	</header>

	<div class="fc-body">
		<!-- Left: page content -->
		<main class="content-panel">
			{@render children()}
		</main>

		<!-- Right: chat + context -->
		<aside class="chat-aside">
			<!-- API key input -->
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
						Your key stays in this browser tab and goes directly to OpenAI — never sent elsewhere.
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

			<div class="chat-container" class:chat-disabled={!chat}>
				{#if chat}
					<ChatPanel {chat} />
				{:else}
					<div class="chat-placeholder">Enter your OpenAI API key above to start chatting.</div>
				{/if}
			</div>

			<!-- Context snapshot -->
			<details ontoggle={handleContextToggle}>
				<summary class="context-summary">
					<h3>Context snapshot</h3>
				</summary>
				<p class="context-hint">
					What <code>svelteAI.getContext()</code> sends to the model. Polls every second while open.
				</p>
				<pre class="context-live"><code>{contextSnapshot || '(open to load)'}</code></pre>
			</details>
		</aside>
	</div>
</div>

<style>
	.fc-layout {
		max-width: 1400px;
		margin: 0 auto;
		padding: 1.5rem;
		font-family: system-ui, sans-serif;
	}

	.fc-header {
		margin-bottom: 1.5rem;
	}

	.back-link {
		font-size: 0.875rem;
		color: #64748b;
		text-decoration: none;
	}

	.back-link:hover {
		color: #334155;
	}

	h1 {
		margin: 0.5rem 0 0.25rem;
		font-size: 1.75rem;
		color: #0f172a;
	}

	.subtitle {
		margin: 0 0 1rem;
		color: #64748b;
		font-size: 0.95rem;
	}

	.tab-nav {
		display: flex;
		gap: 0.25rem;
		border-bottom: 1px solid #e2e8f0;
		padding-bottom: 0;
	}

	.tab-link {
		padding: 0.4rem 0.9rem;
		font-size: 0.875rem;
		color: #64748b;
		text-decoration: none;
		border-radius: 0.375rem 0.375rem 0 0;
		border: 1px solid transparent;
		border-bottom: none;
		margin-bottom: -1px;
	}

	.tab-link:hover {
		color: #1e293b;
		background: #f1f5f9;
	}

	.tab-link.active {
		color: #1e293b;
		background: white;
		border-color: #e2e8f0;
		font-weight: 600;
	}

	.fc-body {
		display: grid;
		grid-template-columns: 1fr 380px;
		gap: 1.5rem;
		align-items: start;
	}

	@media (max-width: 960px) {
		.fc-body {
			grid-template-columns: 1fr;
		}
	}

	.content-panel {
		min-width: 0;
	}

	.chat-aside {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		position: sticky;
		top: 1.5rem;
	}

	.chat-container {
		height: 380px;
		display: flex;
		flex-direction: column;
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
		color: #94a3b8;
		font-size: 0.875rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		background: white;
		text-align: center;
		padding: 1rem;
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
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
	}

	.key-btn {
		padding: 0.4rem 0.9rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		cursor: pointer;
		white-space: nowrap;
	}

	.key-btn:hover:not(:disabled) {
		background: #2563eb;
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

	/* Context snapshot */
	details {
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	details[open] summary {
		border-bottom: 1px solid #e2e8f0;
	}

	.context-summary {
		display: flex;
		align-items: center;
		padding: 0.5rem 0.75rem;
		cursor: pointer;
		list-style: none;
		background: #f8fafc;
		user-select: none;
	}

	.context-summary::-webkit-details-marker {
		display: none;
	}

	h3 {
		margin: 0;
		font-size: 0.85rem;
		font-weight: 600;
		color: #334155;
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	h3::before {
		content: '▶';
		font-size: 0.6rem;
		color: #94a3b8;
		transition: transform 0.15s;
	}

	details[open] h3::before {
		transform: rotate(90deg);
	}

	.context-hint {
		padding: 0.4rem 0.75rem 0;
		font-size: 0.8rem;
		color: #64748b;
		margin: 0;
	}

	code {
		font-family: 'Fira Mono', monospace;
		font-size: 0.8rem;
		background: #f1f5f9;
		padding: 0.1em 0.3em;
		border-radius: 0.2em;
	}

	.context-live {
		margin: 0;
		background: #1e293b;
		color: #e2e8f0;
		border-radius: 0;
		padding: 0.75rem 1rem;
		overflow-x: auto;
		font-size: 0.75rem;
		line-height: 1.6;
		min-height: 4rem;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.context-live code {
		background: none;
		padding: 0;
		color: inherit;
		font-size: inherit;
	}
</style>
