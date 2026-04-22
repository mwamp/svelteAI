<script lang="ts">
    @component({ description: 'A thermostat control widget for a single room. The agent may read the room name, read or adjust the target temperature, and reset it to the room default.' })

	interface Room {
		name: string
		defaultTemp: number
	}

	let { room }: { room: Room } = $props()

	@ai({ access: 'r', description: 'The name of the room this widget controls.' })
	let room_name = $derived(room.name)

	@ai({ access: 'rw', description: 'Current target temperature in Celsius. Agent may set between 16 and 30.' })
	let temperature = $state(room.defaultTemp)

	@ai({ description: 'Resets the temperature to the room default.' })
	function resetTemperature() {
		temperature = room.defaultTemp
	}
</script>

<div class="thermostat-widget">
	<h3 class="room-name">{room_name}</h3>

	<div class="temp-display">
		<span class="temp-value">{temperature}°C</span>
	</div>

	<div class="temp-controls">
		<button
			aria-label="Decrease temperature"
			onclick={() => { temperature = Math.max(16, temperature - 1) }}
		>−</button>
		<input
			type="range"
			min="16"
			max="30"
			bind:value={temperature}
			aria-label="Temperature slider"
		/>
		<button
			aria-label="Increase temperature"
			onclick={() => { temperature = Math.min(30, temperature + 1) }}
		>+</button>
	</div>

	<button class="reset-btn" onclick={resetTemperature}>
		Reset to default ({room.defaultTemp}°C)
	</button>
</div>

<style>
	.thermostat-widget {
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1.25rem;
		background: white;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-width: 200px;
	}

	.room-name {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: #1e293b;
		text-transform: capitalize;
	}

	.temp-display {
		text-align: center;
	}

	.temp-value {
		font-size: 2.5rem;
		font-weight: 700;
		color: #0f172a;
	}

	.temp-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.temp-controls button {
		width: 2rem;
		height: 2rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.375rem;
		background: #f8fafc;
		cursor: pointer;
		font-size: 1.25rem;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.temp-controls button:hover {
		background: #e2e8f0;
	}

	.temp-controls input[type='range'] {
		flex: 1;
	}

	.reset-btn {
		font-size: 0.75rem;
		color: #64748b;
		background: none;
		border: none;
		cursor: pointer;
		text-decoration: underline;
		padding: 0;
		text-align: left;
	}

	.reset-btn:hover {
		color: #334155;
	}
</style>
