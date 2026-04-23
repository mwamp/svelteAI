/**
 * Shared settings state for the full-context demo.
 * Annotated with @ai so the model can read and update preferences.
 */
// @ts-nocheck

// svelte-ignore state_referenced_locally
@ai({ access: 'rw', description: 'Settings state: temperature_unit ("celsius"|"fahrenheit"), energy_alert_threshold (watts), alerts_enabled (boolean).' })
export let settings = $state({
	temperature_unit: 'celsius' as 'celsius' | 'fahrenheit',
	energy_alert_threshold: 2000,
	alerts_enabled: true,
})

export function setTemperatureUnit(value: 'celsius' | 'fahrenheit') {
	settings.temperature_unit = value
}

export function setEnergyAlertThreshold(value: number) {
	settings.energy_alert_threshold = value
}

export function setAlertsEnabled(value: boolean) {
	settings.alerts_enabled = value
}
