<script lang="ts">
	import ThermostatWidget from '../ThermostatWidget.svelte'
	import { total_watts, peak_today } from '../energy.svelte.js'

	const rooms = [
		{ name: 'bedroom', defaultTemp: 20 },
		{ name: 'living room', defaultTemp: 22 },
		{ name: 'kitchen', defaultTemp: 19 },
		{ name: 'office', defaultTemp: 21 },
	]

	let showWidgets = $state(true)
</script>

<div class="thermostats-page">
	<div class="energy-bar">
		<span>⚡ Total: <strong>{total_watts}W</strong></span>
		<span>Peak today: <strong>{peak_today}W</strong></span>
		<button
			class="toggle-btn"
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
</div>

<style>
	.thermostats-page {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem 0;
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
		align-items: center;
	}

	.toggle-btn {
		margin-left: auto;
		background: none;
		border: 1px solid #cbd5e1;
		border-radius: 0.375rem;
		padding: 0.15rem 0.6rem;
		font-size: 0.75rem;
		cursor: pointer;
		color: #64748b;
	}

	.toggle-btn:hover {
		background: #e2e8f0;
		color: #1e293b;
	}

	.widgets {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}
</style>
