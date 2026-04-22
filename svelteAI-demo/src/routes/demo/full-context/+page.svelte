<script lang="ts">
	import { resolve } from '$app/paths'
	import ThermostatWidget from './ThermostatWidget.svelte'
	import ChatPanel from './ChatPanel.svelte'
	import { createChat } from './agent.js'
	import { total_watts, peak_today } from './energy.svelte.js'
	import { svelteAI } from './svelteai.js'

	const rooms = [
		{ name: 'bedroom', defaultTemp: 20 },
		{ name: 'living room', defaultTemp: 22 },
	]

	// Create the chat instance once — agent reads svelteAI.getContext() on each turn
	const chat = createChat()

	// Live context snapshot — auto-updates reactively; refresh button forces a re-read
	let contextSnapshot = $derived(svelteAI.getContext())
	let manualSnapshot = $state<string | null>(null)
	let contextOpen = $state(false)

	function refreshContext() {
		manualSnapshot = svelteAI.getContext()
	}

	// When the collapsible opens, seed the manual snapshot so it's immediately visible
	function handleToggle(e: Event) {
		contextOpen = (e.currentTarget as HTMLDetailsElement).open
		if (contextOpen && manualSnapshot === null) {
			manualSnapshot = svelteAI.getContext()
		}
	}

	// Keep the reactive snapshot in sync when the panel is open
	$effect(() => {
		if (contextOpen) {
			manualSnapshot = contextSnapshot
		}
	})

	// Code examples stored as strings to avoid Svelte parser treating <script> as a tag.
	// The decorator prefixes are split with string concatenation to prevent the svelteAI
	// preprocessor regex from matching them inside this string literal.
	const AT = '@'
	const codeAnnotate = [
		'<!-- ThermostatWidget.svelte -->',
		'<' + 'script module>',
		`  ${AT}component({ description: 'A thermostat control widget.' })`,
		'</' + 'script>',
		'',
		'<' + 'script lang="ts">',
		`  ${AT}ai({ access: 'r', description: 'Room name.' })`,
		'  let room_name = $derived(room.name)',
		'',
		`  ${AT}ai({ access: 'rw', description: 'Target temperature.' })`,
		'  let temperature = $state(room.defaultTemp)',
		'',
		`  ${AT}ai({ description: 'Resets to default.' })`,
		'  function resetTemperature() { ... }',
		'</' + 'script>',
	].join('\n')

	const codeAgent = [
		'const agent = new ToolLoopAgent({',
		"  model: openai('gpt-4o-mini'),",
		"  instructions: 'You are a smart home assistant.',",
		'  tools: {',
		'    ...svelteAI.tools.callAction,',
		'    ...svelteAI.tools.setState,',
		'  },',
		'  prepareStep: async ({ messages }) => ({',
		'    messages: [',
		"      { role: 'system', content: svelteAI.getContext() },",
		"      ...messages.filter(m => m.role !== 'system')",
		'    ]',
		'  })',
		'})',
	].join('\n')
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
			</div>

			<div class="widgets">
				{#each rooms as room (room.name)}
					<ThermostatWidget {room} />
				{/each}
			</div>

			<div class="chat-container">
				<ChatPanel {chat} />
			</div>
		</section>

		<!-- Right panel: developer docs -->
		<section class="docs-panel">
			<h2>Developer Docs</h2>

			<div class="doc-section">
				<h3>1. Annotate your components</h3>
				<p>
					Add <code>@ai(&#123;...&#125;)</code> decorators to reactive state and functions.
					The preprocessor transforms them into registry registrations at build time.
				</p>
				<pre class="code-block"><code>{codeAnnotate}</code></pre>
			</div>

			<div class="doc-section">
				<h3>2. Wire up the agent</h3>
				<p>
					Pass <code>svelteAI.getContext()</code> into the system prompt.
					Use <code>svelteAI.tools</code> for ready-made tool definitions.
				</p>
				<pre class="code-block"><code>{codeAgent}</code></pre>
			</div>

			<div class="doc-section">
					<details ontoggle={handleToggle}>
						<summary class="context-summary">
							<h3>3. Live context snapshot</h3>
							<button
								class="refresh-btn"
								onclick={(e) => { e.preventDefault(); refreshContext() }}
								aria-label="Refresh context snapshot"
								title="Refresh"
							>↺</button>
						</summary>
						<p class="context-hint">
							What <code>svelteAI.getContext()</code> sends to the model right now.
							Auto-syncs while open; click ↺ to force a re-read.
						</p>
						<pre class="code-block context-live"><code>{manualSnapshot ?? '(open to load)'}</code></pre>
					</details>
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

	.chat-container {
		height: 400px;
		display: flex;
		flex-direction: column;
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

	.code-block {
		margin: 0;
		background: #0f172a;
		color: #e2e8f0;
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
		overflow-x: auto;
		font-size: 0.78rem;
		line-height: 1.6;
	}

	.code-block code {
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

	.refresh-btn {
		background: none;
		border: 1px solid #cbd5e1;
		border-radius: 0.375rem;
		padding: 0.15rem 0.45rem;
		font-size: 1rem;
		cursor: pointer;
		color: #64748b;
		line-height: 1;
		transition: background 0.1s, color 0.1s;
	}

	.refresh-btn:hover {
		background: #e2e8f0;
		color: #1e293b;
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
</style>
