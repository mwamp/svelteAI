<script lang="ts">
	import { total_watts, peak_today } from '../energy.svelte.js'

	// Simulated hourly data for the chart
	const hours = Array.from({ length: 24 }, (_, i) => i)
	const usage = [
		820, 750, 700, 680, 690, 720, 900, 1200, 1450, 1380, 1300, 1250,
		1180, 1220, 1300, 1400, 1600, 1900, 2100, 1950, 1700, 1400, 1100, 950,
	]
	const maxUsage = Math.max(...usage)
</script>

<div class="energy-page">
	<div class="stat-cards">
		<div class="stat-card">
			<span class="stat-label">Current consumption</span>
			<span class="stat-value">{total_watts}<span class="stat-unit">W</span></span>
		</div>
		<div class="stat-card">
			<span class="stat-label">Peak today</span>
			<span class="stat-value">{peak_today}<span class="stat-unit">W</span></span>
		</div>
		<div class="stat-card">
			<span class="stat-label">Daily average</span>
			<span class="stat-value">{Math.round(usage.reduce((a, b) => a + b, 0) / usage.length)}<span class="stat-unit">W</span></span>
		</div>
	</div>

	<div class="chart-section">
		<h3>Usage today (hourly)</h3>
		<div class="bar-chart" role="img" aria-label="Hourly energy usage chart">
			{#each hours as hour (hour)}
				<div class="bar-col">
					<div
						class="bar"
						style="height: {(usage[hour] / maxUsage) * 100}%"
						title="{hour}:00 — {usage[hour]}W"
					></div>
					{#if hour % 6 === 0}
						<span class="bar-label">{hour}h</span>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.energy-page {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1.5rem 0;
	}

	.stat-cards {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.stat-card {
		flex: 1;
		min-width: 140px;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stat-label {
		font-size: 0.75rem;
		color: #64748b;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.stat-value {
		font-size: 1.75rem;
		font-weight: 700;
		color: #0f172a;
		line-height: 1;
	}

	.stat-unit {
		font-size: 0.9rem;
		font-weight: 400;
		color: #64748b;
		margin-left: 0.2rem;
	}

	.chart-section {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1rem 1.25rem;
	}

	h3 {
		margin: 0 0 1rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: #334155;
	}

	.bar-chart {
		display: flex;
		align-items: flex-end;
		gap: 2px;
		height: 120px;
	}

	.bar-col {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		height: 100%;
		justify-content: flex-end;
		gap: 2px;
	}

	.bar {
		width: 100%;
		background: #3b82f6;
		border-radius: 2px 2px 0 0;
		min-height: 2px;
		transition: background 0.15s;
	}

	.bar:hover {
		background: #2563eb;
	}

	.bar-label {
		font-size: 0.65rem;
		color: #94a3b8;
	}
</style>
