<script lang="ts">
	let { message = 'Hello from svelteAI library!' }: { message?: string } = $props();
</script>

<div class="test-component">
	<h2>{message}</h2>
	<p>This component is from the svelteAI library.</p>
</div>

<style>
	.test-component {
		padding: 1rem;
		border: 2px solid #ff3e00;
		border-radius: 0.5rem;
		background-color: #f0f0f0;
	}

	h2 {
		color: #ff3e00;
		margin: 0 0 0.5rem 0;
	}

	p {
		margin: 0;
		color: #333;
	}
</style>
