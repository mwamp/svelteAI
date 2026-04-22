# Getting Started

This guide walks you through setting up SvelteAI in a SvelteKit project and exposing your first component to an AI model.

## Prerequisites

- A SvelteKit project (v2+)
- Svelte 5 with runes mode
- An AI SDK (e.g. Vercel AI SDK)

## Overview

SvelteAI works in three steps:

1. **Install** the package and configure the preprocessor
2. **Annotate** your Svelte components with `@ai(...)` decorators
3. **Connect** the registry to your AI adapter and start a conversation

## Your First AI-Aware Component

Once installed, annotate a reactive state value in any `.svelte` file:

```svelte
<script lang="ts">
  @ai({ access: 'rw', description: 'Current temperature setpoint in Celsius.' })
  let temperature = $state(21);
</script>
```

The preprocessor picks up the decorator and emits registry registration code. Your AI model can now read and write `temperature` as part of its context — no extra wiring needed.

## Next Steps

- Follow the [Installation](/guide/installation) guide to set up the preprocessor
- Learn about [State and Components](/guide/annotations/state-and-components) annotations
