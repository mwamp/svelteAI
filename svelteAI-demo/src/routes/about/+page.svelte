<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>About — SvelteAI</title>
	<meta name="description" content="SvelteAI — AI integration library for Svelte" />
</svelte:head>

<div class="page">
	<!-- Hero -->
	<section class="hero">
		<h1>SvelteAI</h1>
		<p class="tagline">
			A developer-friendly library for building AI-integrated Svelte apps — with minimal syntax and
			maximum control.
		</p>
	</section>

	<!-- Why -->
	<section class="section">
		<h2>Why SvelteAI?</h2>
		<p>
			AI agents can already browse the web and fill forms on their own. But when an agent is
			<em>integrated into your app</em>, you gain three things that browser automation cannot give
			you:
		</p>
		<div class="cards">
			<div class="card">
				<div class="card-icon">🔒</div>
				<h3>Controllability</h3>
				<p>
					You decide exactly which state the model can read and which actions it can trigger. No
					accidental access to sensitive data or destructive operations.
				</p>
			</div>
			<div class="card">
				<div class="card-icon">⚡</div>
				<h3>Efficiency</h3>
				<p>
					One typed tool call replaces dozens of browser actions. Smaller models perform better,
					latency drops, and costs fall.
				</p>
			</div>
			<div class="card">
				<div class="card-icon">🎯</div>
				<h3>Better UX</h3>
				<p>
					The model sees structured, typed state — not raw HTML. It reasons more accurately and
					responds faster, making the experience feel genuinely intelligent.
				</p>
			</div>
		</div>
	</section>

	<!-- Key goals -->
	<section class="section">
		<h2>Key goals</h2>
		<ul class="goals">
			<li>
				<strong>Minimal syntax.</strong> A handful of JSDoc tags (<code>@ai</code>,
				<code>@access</code>, <code>@description</code>) is all you need. No wrappers, no stores,
				no boilerplate.
			</li>
			<li>
				<strong>Localised information.</strong> Annotations live next to the code they describe —
				inside the component, alongside the variable or function.
			</li>
			<li>
				<strong>Model agnostic.</strong> SvelteAI produces a plain context string and plain tool
				definitions. Wire them into OpenAI, Anthropic, Vercel AI SDK, or any other provider.
			</li>
			<li>
				<strong>Reactive by default.</strong> The context snapshot is always fresh — it re-reads
				live Svelte state on every agent turn, so the model never acts on stale data.
			</li>
		</ul>
	</section>

	<!-- How it works -->
	<section class="section">
		<h2>How it works</h2>
		<ol class="steps">
			<li>
				<span class="step-num">1</span>
				<div>
					<strong>Annotate</strong> — add <code>@ai</code> JSDoc tags to the reactive variables and
					functions you want to expose. Mark them <code>r</code> (read-only) or <code>rw</code>
					(read-write).
				</div>
			</li>
			<li>
				<span class="step-num">2</span>
				<div>
					<strong>Get context</strong> — call <code>svelteAI.getContext()</code> to get a formatted
					snapshot of the current app state, ready to drop into a system prompt.
				</div>
			</li>
			<li>
				<span class="step-num">3</span>
				<div>
					<strong>Use tools</strong> — <code>svelteAI.tools.setState</code> and
					<code>svelteAI.tools.callAction</code> are ready-made Vercel AI SDK tool definitions. The
					model writes directly to Svelte reactive state; the UI updates immediately.
				</div>
			</li>
		</ol>
	</section>

	<!-- CTA -->
	<section class="cta">
		<a href={resolve('/demo/local-context')} class="btn">See the live demo →</a>
	</section>
</div>

<style>
	.page {
		max-width: 52rem;
		margin: 0 auto;
		padding: 2rem 1rem 4rem;
		display: flex;
		flex-direction: column;
		gap: 3rem;
	}

	/* Hero */
	.hero {
		text-align: center;
		padding: 2rem 0 1rem;
	}

	.hero h1 {
		font-size: 3rem;
		font-weight: 700;
		color: var(--color-theme-1);
		margin: 0 0 0.75rem;
	}

	.tagline {
		font-size: 1.15rem;
		max-width: 36rem;
		margin: 0 auto;
		line-height: 1.6;
		color: var(--color-text);
	}

	/* Sections */
	.section h2 {
		font-size: 1.4rem;
		font-weight: 700;
		color: var(--color-theme-2);
		border-bottom: 2px solid var(--color-theme-2);
		padding-bottom: 0.4rem;
		margin: 0 0 1.25rem;
	}

	.section p {
		margin: 0 0 1.25rem;
		line-height: 1.7;
	}

	/* Cards */
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
		gap: 1rem;
	}

	.card {
		background: rgba(255, 255, 255, 0.6);
		border-radius: 0.5rem;
		padding: 1.25rem 1.25rem 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
	}

	.card-icon {
		font-size: 1.75rem;
		margin-bottom: 0.5rem;
	}

	.card h3 {
		font-size: 1rem;
		font-weight: 700;
		margin: 0 0 0.5rem;
	}

	.card p {
		font-size: 0.9rem;
		margin: 0;
		line-height: 1.6;
	}

	/* Goals list */
	.goals {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.goals li {
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.5);
		border-left: 3px solid var(--color-theme-1);
		border-radius: 0 0.375rem 0.375rem 0;
		line-height: 1.6;
	}

	/* Steps */
	.steps {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.steps li {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.5);
		border-radius: 0.5rem;
		line-height: 1.6;
	}

	.step-num {
		flex-shrink: 0;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: var(--color-theme-2);
		color: white;
		font-weight: 700;
		font-size: 0.9rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	code {
		font-family: var(--font-mono);
		font-size: 0.85em;
		background: rgba(0, 0, 0, 0.07);
		padding: 0.1em 0.35em;
		border-radius: 3px;
	}

	/* CTA */
	.cta {
		text-align: center;
	}

	.btn {
		display: inline-block;
		padding: 0.75rem 2rem;
		background: var(--color-theme-1);
		color: white;
		font-weight: 700;
		font-size: 1rem;
		border-radius: 0.375rem;
		text-decoration: none;
		transition: opacity 0.15s;
	}

	.btn:hover {
		opacity: 0.85;
		text-decoration: none;
	}
</style>
