# Why SvelteAI?

SvelteAI bridges the gap between Svelte's reactive component model and AI-powered applications. Instead of manually wiring up AI context, state serialization, and tool definitions, SvelteAI lets you annotate your existing Svelte code and have it automatically exposed to language models.

## The Problem

Building AI-aware UIs today requires duplicating your application state: once for the UI and once for the AI context. You write components, then separately describe those components to the model, keep them in sync, and manually define tools for every action the AI should be able to take.

## The SvelteAI Approach

SvelteAI uses a preprocessor and a registry to automatically extract context from your annotated Svelte components. The AI sees a live, structured view of your application state — no duplication, no drift.

- **Annotations** — mark state, stores, and functions directly in your `.svelte` files
- **Registry** — a runtime tree of all annotated nodes, always up to date
- **Adapters** — connect the registry to any AI SDK (Vercel AI, OpenAI, etc.)

## When to Use It

SvelteAI is a good fit when your AI needs to read or act on UI state that already lives in Svelte components. If your AI only needs static data or a fixed set of tools, a simpler approach may suffice.
