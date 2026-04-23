<script lang="ts">
	import { base } from '$app/paths'
	import DocAnnotate from './doc-annotate.md'
	import DocAgent from './doc-agent.md'
</script>

<div class="overview">
	<h2>Smart Home Demo</h2>
	<p>
		This demo shows the <strong>local-context pattern</strong>: the AI assistant reads all annotated
		component state and can navigate between pages using route-aware tools.
	</p>

	<ul class="page-list">
		<li>
			<a href="{base}/demo/local-context/thermostats">
				<strong>Thermostats</strong>
				<span>Read and adjust room temperatures. The agent can set values and reset to defaults.</span>
			</a>
		</li>
		<li>
			<a href="{base}/demo/local-context/energy">
				<strong>Energy</strong>
				<span>View current energy consumption and peak usage today.</span>
			</a>
		</li>
		<li>
			<a href="{base}/demo/local-context/settings">
				<strong>Settings</strong>
				<span>Configure temperature units and alert thresholds.</span>
			</a>
		</li>
	</ul>

	<p class="hint">
		Try asking the assistant: <em>"Show me the thermostats"</em> or <em>"What's the energy usage?"</em>
	</p>

	<div class="dev-docs">
		<DocAnnotate></DocAnnotate>
		<DocAgent></DocAgent>
	</div>
</div>

<style>
	.overview {
		padding: 1.5rem 0;
	}

	.dev-docs {
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e2e8f0;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		font-size: 0.875rem;
		color: #334155;
		line-height: 1.6;
	}

	.dev-docs :global(h3) {
		margin: 0 0 0.75rem;
		font-size: 0.95rem;
		color: #0f172a;
	}

	.dev-docs :global(p) {
		margin: 0 0 0.75rem;
		color: #475569;
	}

	/* Inline code */
	.dev-docs :global(:not(pre) > code) {
		font-family: var(--font-mono, 'Fira Mono', monospace);
		font-size: 0.875em;
		background: rgba(0, 0, 0, 0.07);
		padding: 0.15em 0.4em;
		border-radius: 4px;
		color: #c7254e;
	}

	/* Code blocks — Tokyo Night, same as guide */
	.dev-docs :global(pre[class*='language-']),
	.dev-docs :global(pre:not([class])) {
		margin: 0.75rem 0;
		border-radius: 8px;
		overflow-x: auto;
		font-size: 0.8rem;
		line-height: 1.65;
		background: #1a1b26;
		color: #c0caf5;
		padding: 1rem 1.25rem;
		border: 1px solid rgba(255, 255, 255, 0.06);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2), 0 1px 4px rgba(0, 0, 0, 0.15);
		white-space: pre;
		word-break: normal;
		word-wrap: normal;
		tab-size: 2;
	}

	.dev-docs :global(pre code) {
		background: none;
		padding: 0;
		font-family: var(--font-mono, 'Fira Mono', monospace);
		color: inherit;
		font-size: inherit;
		white-space: inherit;
	}

	/* Prism token colours — Tokyo Night palette */
	.dev-docs :global(.token.comment),
	.dev-docs :global(.token.prolog),
	.dev-docs :global(.token.doctype),
	.dev-docs :global(.token.cdata) { color: #565f89; font-style: italic; }
	.dev-docs :global(.token.punctuation) { color: #89ddff; }
	.dev-docs :global(.token.property),
	.dev-docs :global(.token.tag),
	.dev-docs :global(.token.boolean),
	.dev-docs :global(.token.number),
	.dev-docs :global(.token.constant),
	.dev-docs :global(.token.symbol) { color: #ff9e64; }
	.dev-docs :global(.token.selector),
	.dev-docs :global(.token.attr-name),
	.dev-docs :global(.token.string),
	.dev-docs :global(.token.char),
	.dev-docs :global(.token.builtin) { color: #9ece6a; }
	.dev-docs :global(.token.operator),
	.dev-docs :global(.token.entity),
	.dev-docs :global(.token.url),
	.dev-docs :global(.token.variable) { color: #89ddff; }
	.dev-docs :global(.token.keyword),
	.dev-docs :global(.token.control) { color: #bb9af7; }
	.dev-docs :global(.token.function),
	.dev-docs :global(.token.function-name) { color: #7aa2f7; }
	.dev-docs :global(.token.class-name) { color: #2ac3de; }
	.dev-docs :global(.token.regex),
	.dev-docs :global(.token.important) { color: #e0af68; }
	.dev-docs :global(.token.atrule),
	.dev-docs :global(.token.attr-value) { color: #9ece6a; }
	.dev-docs :global(.token.important),
	.dev-docs :global(.token.bold) { font-weight: bold; }
	.dev-docs :global(.token.italic) { font-style: italic; }

	/* details/summary for preprocessor output block */
	.dev-docs :global(details) {
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		overflow: hidden;
		margin-top: 0.5rem;
	}

	.dev-docs :global(summary) {
		padding: 0.4rem 0.75rem;
		cursor: pointer;
		background: #f8fafc;
		font-size: 0.8rem;
		color: #64748b;
		user-select: none;
	}

	.dev-docs :global(details pre) {
		border-radius: 0;
		margin: 0;
	}

	h2 {
		margin: 0 0 0.5rem;
		font-size: 1.25rem;
		color: #0f172a;
	}

	p {
		margin: 0 0 1.25rem;
		font-size: 0.9rem;
		color: #475569;
		line-height: 1.6;
	}

	.page-list {
		list-style: none;
		padding: 0;
		margin: 0 0 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.page-list a {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.75rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		text-decoration: none;
		color: #1e293b;
		background: #f8fafc;
	}

	.page-list a:hover {
		background: #e2e8f0;
	}

	.page-list strong {
		font-size: 0.9rem;
	}

	.page-list span {
		font-size: 0.8rem;
		color: #64748b;
	}

	.hint {
		font-size: 0.8rem;
		color: #94a3b8;
		font-style: italic;
		margin: 0;
	}
</style>
