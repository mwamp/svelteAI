<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	if (browser) {
		goto('/guide/why', { replaceState: true });
	}
</script>
