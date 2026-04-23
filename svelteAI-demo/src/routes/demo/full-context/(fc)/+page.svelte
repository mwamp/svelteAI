<script lang="ts">
	import { base } from '$app/paths'
</script>

<div class="overview">
	<h2>Smart Home Demo</h2>
	<p>
		This demo shows the <strong>full-context pattern</strong>: the AI assistant reads all annotated
		component state and can navigate between pages using route-aware tools.
	</p>

	<ul class="page-list">
		<li>
			<a href="{base}/demo/full-context/thermostats">
				<strong>Thermostats</strong>
				<span>Read and adjust room temperatures. The agent can set values and reset to defaults.</span>
			</a>
		</li>
		<li>
			<a href="{base}/demo/full-context/energy">
				<strong>Energy</strong>
				<span>View current energy consumption and peak usage today.</span>
			</a>
		</li>
		<li>
			<a href="{base}/demo/full-context/settings">
				<strong>Settings</strong>
				<span>Configure temperature units and alert thresholds.</span>
			</a>
		</li>
	</ul>

	<p class="hint">
		Try asking the assistant: <em>"Show me the thermostats"</em> or <em>"What's the energy usage?"</em>
	</p>
</div>

<style>
	.overview {
		padding: 1.5rem 0;
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
