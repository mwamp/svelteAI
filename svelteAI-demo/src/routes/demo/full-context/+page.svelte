<script lang="ts">
	import { resolve } from '$app/paths'
	import ThermostatWidget from './ThermostatWidget.svelte'
	import ChatPanel from './ChatPanel.svelte'
	import { createChat } from './agent.js'
	import { total_watts, peak_today } from './energy.svelte.js'
	import { svelteAI } from './svelteai.js'
	import DocAnnotate from './doc-annotate.md'
	import DocAgent from './doc-agent.md'

	const rooms = [
		{ name: 'bedroom', defaultTemp: 20 },
		{ name: 'living room', defaultTemp: 22 },
	]

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

	let showWidgets = $state(true)

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

</script>

<div class="page">
	<header class="page-header">
		<a href={resolve('/demo')} class="back-link">← Demo index</a>
		<h1>Full Context Demo</h1>
		<p class="subtitle">
			The AI assistant reads all annotated component state and can adjust thermostats via tool calls.
		</p>
	</header>

	<div class="demo-layout">
		<!-- Left panel: live demo -->
		<section class="demo-panel">
			<h2>Live Demo</h2>

			<div class="energy-bar">
					<span>⚡ Total: <strong>{total_watts}W</strong></span>
					<span>Peak today: <strong>{peak_today}W</strong></span>
					<button
						class="toggle-widgets-btn"
						onclick={() => (showWidgets = !showWidgets)}
						aria-label={showWidgets ? 'Hide thermostat widgets' : 'Show thermostat widgets'}
					>
						{showWidgets ? 'Hide widgets' : 'Show widgets'}
					</button>
				</div>
	
				{#if showWidgets}
					<div class="widgets">
						{#each rooms as room (room.name)}
							<ThermostatWidget {room} />
						{/each}
					</div>
				{/if}

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
							Your key stays in this browser tab and goes directly to OpenAI — it is never sent to any other server.
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
		</section>

		<!-- Right panel: developer docs -->
		<section class="docs-panel">
			<h2>Developer Docs</h2>

			<div class="doc-section">
				<details ontoggle={handleContextToggle}>
					<summary class="context-summary">
						<h3>Context snapshot</h3>
					</summary>
					<p class="context-hint">
						What <code>svelteAI.getContext()</code> sends to the model. Polls every second while open.
					</p>
					<pre class="code-block context-live"><code>{contextSnapshot || '(open to load)'}</code></pre>
				</details>
			</div>

			<div class="doc-section">
				<DocAnnotate />
			</div>

			<div class="doc-section">
				<DocAgent />
			</div>
		</section>
	</div>
</div>

<style>
	.page {
		max-width: 1400px;
		margin: 0 auto;
		padding: 1.5rem;
		font-family: system-ui, sans-serif;
	}

	.page-header {
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
		margin: 0;
		color: #64748b;
		font-size: 0.95rem;
	}

	.demo-layout {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		align-items: start;
	}

	@media (max-width: 900px) {
		.demo-layout {
			grid-template-columns: 1fr;
		}
	}

	section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	h2 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: #1e293b;
		border-bottom: 1px solid #e2e8f0;
		padding-bottom: 0.5rem;
	}

	.energy-bar {
		display: flex;
		gap: 1.5rem;
		font-size: 0.875rem;
		color: #475569;
		background: #f8fafc;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid #e2e8f0;
	}

	.widgets {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.toggle-widgets-btn {
		margin-left: auto;
		background: none;
		border: 1px solid #cbd5e1;
		border-radius: 0.375rem;
		padding: 0.15rem 0.6rem;
		font-size: 0.75rem;
		cursor: pointer;
		color: #64748b;
	}

	.toggle-widgets-btn:hover {
		background: #e2e8f0;
		color: #1e293b;
	}

	.chat-container {
		height: 400px;
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

	/* Docs panel */
	.doc-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	h3 {
		margin: 0;
		font-size: 0.9rem;
		font-weight: 600;
		color: #334155;
	}

	p {
		margin: 0;
		font-size: 0.875rem;
		color: #475569;
		line-height: 1.5;
	}

	code {
		font-family: 'Fira Mono', monospace;
		font-size: 0.8rem;
		background: #f1f5f9;
		padding: 0.1em 0.3em;
		border-radius: 0.2em;
	}

	.code-block,
	.doc-section :global(pre) {
		margin: 0;
		background: #0f172a;
		color: #e2e8f0;
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
		overflow-x: auto;
		font-size: 0.78rem;
		line-height: 1.6;
	}

	.code-block code,
	.doc-section :global(pre code) {
		background: none;
		padding: 0;
		color: inherit;
		font-size: inherit;
	}

	.context-live {
		background: #1e293b;
		min-height: 6rem;
		white-space: pre-wrap;
		word-break: break-word;
	}

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
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		cursor: pointer;
		list-style: none;
		background: #f8fafc;
		user-select: none;
	}

	.context-summary::-webkit-details-marker {
		display: none;
	}

	.context-summary h3 {
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.context-summary h3::before {
		content: '▶';
		font-size: 0.6rem;
		color: #94a3b8;
		transition: transform 0.15s;
	}

	details[open] .context-summary h3::before {
		transform: rotate(90deg);
	}


	.context-hint {
		padding: 0.4rem 0.75rem 0;
		font-size: 0.8rem;
		color: #64748b;
	}

	details .code-block {
		border-radius: 0;
		margin: 0;
	}

	.doc-section :global(details) {
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		overflow: hidden;
		margin-top: 0.25rem;
	}

	.doc-section :global(details[open] summary) {
		border-bottom: 1px solid #e2e8f0;
	}

	.doc-section :global(summary) {
		padding: 0.4rem 0.75rem;
		cursor: pointer;
		background: #f8fafc;
		font-size: 0.8rem;
		font-weight: 600;
		color: #475569;
		user-select: none;
		list-style: none;
	}

	.doc-section :global(summary::-webkit-details-marker) {
		display: none;
	}

	.doc-section :global(details p) {
		padding: 0.5rem 0.75rem 0;
		font-size: 0.8rem;
		color: #64748b;
		margin: 0;
	}

	.doc-section :global(details pre) {
		border-radius: 0;
		margin: 0;
	}
</style>
