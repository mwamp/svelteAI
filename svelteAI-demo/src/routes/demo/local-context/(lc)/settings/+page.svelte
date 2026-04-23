<script lang="ts">
	import {
		settings,
		setTemperatureUnit,
		setEnergyAlertThreshold,
		setAlertsEnabled,
	} from '../settings.svelte.js'
</script>

<div class="settings-page">
	<div class="setting-group">
		<h3>Temperature</h3>
		<div class="setting-row">
			<label for="temp-unit">Display unit</label>
			<select
				id="temp-unit"
				value={settings.temperature_unit}
				onchange={(e) => setTemperatureUnit((e.currentTarget as HTMLSelectElement).value as 'celsius' | 'fahrenheit')}
			>
				<option value="celsius">Celsius (°C)</option>
				<option value="fahrenheit">Fahrenheit (°F)</option>
			</select>
		</div>
	</div>

	<div class="setting-group">
		<h3>Energy alerts</h3>
		<div class="setting-row">
			<label for="alerts-toggle">Enable alerts</label>
			<input
				id="alerts-toggle"
				type="checkbox"
				checked={settings.alerts_enabled}
				onchange={(e) => setAlertsEnabled((e.currentTarget as HTMLInputElement).checked)}
			/>
		</div>
		<div class="setting-row" class:disabled={!settings.alerts_enabled}>
			<label for="alert-threshold">Alert threshold (W)</label>
			<input
				id="alert-threshold"
				type="number"
				min="500"
				max="5000"
				step="100"
				value={settings.energy_alert_threshold}
				oninput={(e) => setEnergyAlertThreshold(Number((e.currentTarget as HTMLInputElement).value))}
				disabled={!settings.alerts_enabled}
			/>
		</div>
		{#if settings.alerts_enabled}
			<p class="setting-hint">
				Alert triggers when consumption exceeds <strong>{settings.energy_alert_threshold}W</strong>.
			</p>
		{/if}
	</div>
</div>

<style>
	.settings-page {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1.5rem 0;
	}

	.setting-group {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	h3 {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: #1e293b;
		border-bottom: 1px solid #e2e8f0;
		padding-bottom: 0.5rem;
	}

	.setting-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.setting-row.disabled {
		opacity: 0.5;
	}

	label {
		font-size: 0.875rem;
		color: #475569;
	}

	select,
	input[type='number'] {
		padding: 0.35rem 0.6rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		background: white;
		color: #1e293b;
		outline: none;
	}

	select:focus,
	input[type='number']:focus {
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
	}

	input[type='number'] {
		width: 100px;
		text-align: right;
	}

	input[type='checkbox'] {
		width: 1rem;
		height: 1rem;
		cursor: pointer;
	}

	.setting-hint {
		margin: 0;
		font-size: 0.8rem;
		color: #64748b;
	}
</style>
