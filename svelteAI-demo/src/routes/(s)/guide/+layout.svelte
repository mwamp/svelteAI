<script lang="ts">
	import { page } from '$app/state';

	let { children } = $props();

	const nav = [
		{
			label: 'Guide',
			items: [
				{ label: 'Why SvelteAI?', href: '/guide/why' },
				{ label: 'Getting Started', href: '/guide/getting-started' },
				{ label: 'Installation', href: '/guide/installation' }
			]
		},
		{
			label: 'Annotations',
			items: [
				{ label: 'State and Components', href: '/guide/annotations/state-and-components' },
				{ label: 'Stores', href: '/guide/annotations/stores' },
				{ label: 'Functions', href: '/guide/annotations/functions' }
			]
		},
		{
			label: 'Wire Up your Agent',
			items: [
				{ label: 'Adapters', href: '/guide/wire-up/adapters' },
				{ label: 'Tools', href: '/guide/wire-up/tools' },
				{ label: 'Context Building', href: '/guide/wire-up/context-building' }
			]
		},
		{
			label: 'Concepts',
			items: [
				{ label: 'Registry', href: '/guide/concepts/registry' },
				{ label: 'Built-in Tools', href: '/guide/concepts/built-in-tools' }
			]
		},
		{
			label: 'Recipes',
			items: [
				{ label: 'Local context', href: '/guide/recipes/local-context' },
				{ label: 'Digging Context', href: '/guide/recipes/digging-context' },
				{ label: 'Workflow Based', href: '/guide/recipes/workflow-based' }
			]
		}
	];
</script>

<div class="guide-layout">
	<aside class="sidebar">
		<nav>
			{#each nav as section (section.label)}
				<div class="nav-section">
					<span class="nav-section-label">{section.label}</span>
					<ul>
						{#each section.items as item (item.href)}
							<li aria-current={page.url.pathname === item.href ? 'page' : undefined}>
								<a href={item.href}>{item.label}</a>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</nav>
	</aside>

	<article class="content">
		{@render children()}
	</article>
</div>

<style>
	:global(main) {
		max-width: 100% !important;
		padding: 0 !important;
	}

	.guide-layout {
		display: flex;
		gap: 2rem;
		min-height: calc(100vh - 6rem);
		width: 100%;
		max-width: 72rem;
		margin: 0 auto;
		padding: 2rem 1.5rem;
		box-sizing: border-box;
	}

	.sidebar {
		width: 14rem;
		flex-shrink: 0;
	}

	.sidebar nav {
		position: sticky;
		top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.nav-section {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.nav-section-label {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-theme-2);
		padding: 0 0.5rem;
		margin-bottom: 0.25rem;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	li a {
		display: block;
		padding: 0.3rem 0.5rem;
		border-radius: 4px;
		font-size: 0.875rem;
		color: var(--color-text);
		text-decoration: none;
		transition:
			background 0.15s,
			color 0.15s;
	}

	li a:hover {
		background: rgba(255, 255, 255, 0.6);
		color: var(--color-theme-1);
	}

	li[aria-current='page'] a {
		background: rgba(255, 255, 255, 0.8);
		color: var(--color-theme-1);
		font-weight: 600;
	}

	.content {
		flex: 1;
		min-width: 0;
		background: rgba(255, 255, 255, 0.5);
		border-radius: 8px;
		padding: 2rem 2.5rem;
		box-sizing: border-box;
	}

	/* Markdown typography */
	.content :global(h1) {
		font-size: 2rem;
		font-weight: 700;
		margin-top: 0;
		margin-bottom: 1rem;
		color: rgba(0, 0, 0, 0.85);
	}

	.content :global(h2) {
		font-size: 1.25rem;
		font-weight: 600;
		margin-top: 2rem;
		margin-bottom: 0.75rem;
		color: rgba(0, 0, 0, 0.8);
	}

	.content :global(h3) {
		font-size: 1rem;
		font-weight: 600;
		margin-top: 1.5rem;
		margin-bottom: 0.5rem;
	}

	.content :global(p) {
		line-height: 1.7;
		margin-bottom: 1rem;
	}

	/* Inline code */
	.content :global(:not(pre) > code) {
		font-family: var(--font-mono);
		font-size: 0.875em;
		background: rgba(0, 0, 0, 0.07);
		padding: 0.15em 0.4em;
		border-radius: 4px;
		color: #c7254e;
	}

	/* Code blocks — mdsvex uses Prism with language-* classes */
	.content :global(pre[class*='language-']),
	.content :global(pre:not([class])) {
		margin: 1.25rem 0;
		border-radius: 8px;
		overflow-x: auto;
		font-size: 0.875rem;
		line-height: 1.65;
		background: #1a1b26;
		color: #c0caf5;
		padding: 1.25rem 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.06);
		box-shadow:
			0 4px 16px rgba(0, 0, 0, 0.2),
			0 1px 4px rgba(0, 0, 0, 0.15);
		/* Horizontal scroll — preserves indentation */
		white-space: pre;
		word-break: normal;
		word-wrap: normal;
		tab-size: 2;
	}

	/* Styled scrollbar for code blocks */
	.content :global(pre[class*='language-']::-webkit-scrollbar),
	.content :global(pre:not([class])::-webkit-scrollbar) {
		height: 6px;
	}

	.content :global(pre[class*='language-']::-webkit-scrollbar-track),
	.content :global(pre:not([class])::-webkit-scrollbar-track) {
		background: rgba(255, 255, 255, 0.04);
		border-radius: 0 0 8px 8px;
	}

	.content :global(pre[class*='language-']::-webkit-scrollbar-thumb),
	.content :global(pre:not([class])::-webkit-scrollbar-thumb) {
		background: rgba(255, 255, 255, 0.15);
		border-radius: 3px;
	}

	.content :global(pre[class*='language-']::-webkit-scrollbar-thumb:hover),
	.content :global(pre:not([class])::-webkit-scrollbar-thumb:hover) {
		background: rgba(255, 255, 255, 0.28);
	}

	.content :global(pre code) {
		background: none;
		padding: 0;
		font-family: var(--font-mono);
		color: inherit;
		font-size: inherit;
		white-space: inherit;
	}

	/* ── Prism token colours (Tokyo Night palette) ── */
	.content :global(.token.comment),
	.content :global(.token.prolog),
	.content :global(.token.doctype),
	.content :global(.token.cdata) {
		color: #565f89;
		font-style: italic;
	}

	.content :global(.token.punctuation) {
		color: #89ddff;
	}

	.content :global(.token.property),
	.content :global(.token.tag),
	.content :global(.token.boolean),
	.content :global(.token.number),
	.content :global(.token.constant),
	.content :global(.token.symbol) {
		color: #ff9e64;
	}

	.content :global(.token.selector),
	.content :global(.token.attr-name),
	.content :global(.token.string),
	.content :global(.token.char),
	.content :global(.token.builtin) {
		color: #9ece6a;
	}

	.content :global(.token.operator),
	.content :global(.token.entity),
	.content :global(.token.url),
	.content :global(.token.variable) {
		color: #89ddff;
	}

	.content :global(.token.keyword),
	.content :global(.token.control) {
		color: #bb9af7;
	}

	.content :global(.token.function),
	.content :global(.token.function-name) {
		color: #7aa2f7;
	}

	.content :global(.token.class-name) {
		color: #2ac3de;
	}

	.content :global(.token.regex),
	.content :global(.token.important) {
		color: #e0af68;
	}

	.content :global(.token.atrule),
	.content :global(.token.attr-value) {
		color: #9ece6a;
	}

	.content :global(.token.important),
	.content :global(.token.bold) {
		font-weight: bold;
	}

	.content :global(.token.italic) {
		font-style: italic;
	}

	.content :global(ul),
	.content :global(ol) {
		padding-left: 1.5rem;
		margin-bottom: 1rem;
	}

	.content :global(li) {
		margin-bottom: 0.4rem;
		line-height: 1.6;
	}

	.content :global(hr) {
		border: none;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
		margin: 2rem 0;
	}

	/* Tables */
	.content :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin: 1.5rem 0;
		font-size: 0.875rem;
	}

	.content :global(th) {
		text-align: left;
		padding: 0.5rem 0.75rem;
		background: rgba(0, 0, 0, 0.05);
		border-bottom: 2px solid rgba(0, 0, 0, 0.1);
		font-weight: 600;
	}

	.content :global(td) {
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.07);
	}

	.content :global(tr:last-child td) {
		border-bottom: none;
	}

	@media (max-width: 640px) {
		.guide-layout {
			flex-direction: column;
			padding: 1rem;
		}

		.sidebar {
			width: 100%;
		}

		.sidebar nav {
			position: static;
		}

		.content {
			padding: 1.25rem;
		}
	}
</style>
