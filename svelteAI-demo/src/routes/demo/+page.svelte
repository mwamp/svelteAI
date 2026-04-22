<script lang="ts">
	import { resolve } from '$app/paths'
</script>

<div class="demo-index">
	<h1>SvelteAI Demos</h1>
	<ul>
		<li>
			<a href={resolve('/demo/full-context')}>
				<strong>Full Context</strong> — AI assistant reads all annotated component state and adjusts thermostats via tool calls
			</a>
		</li>
		<li>
			<a href={resolve('/demo/playwright')}>Playwright test demo</a>
		</li>
	</ul>
</div>

<style>
	.demo-index {
		max-width: 600px;
		margin: 3rem auto;
		padding: 0 1.5rem;
		font-family: system-ui, sans-serif;
	}

	h1 {
		font-size: 1.75rem;
		color: #0f172a;
		margin-bottom: 1.5rem;
	}

	ul {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	li a {
		display: block;
		padding: 0.75rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		text-decoration: none;
		color: #1e293b;
		background: #f8fafc;
	}

	li a:hover {
		background: #e2e8f0;
	}
</style>
