<script module>
	// @ts-nocheck
	@component({ description: 'The active Sverdle (Wordle) game board. The agent can read the current guesses and their results, and submit a new guess.' })
</script>

<script lang="ts">
	import { enhance } from '$app/forms'
	import { resolve } from '$app/paths'
	import { confetti } from '@neoconfetti/svelte'
	import { MediaQuery } from 'svelte/reactivity'
	import type { PageProps } from './$types'

	let { data }: { data: PageProps['data'] } = $props()

	const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)')

	let shake = $state(false)

	let won = $derived(data.answers.at(-1) === 'xxxxx')
	let i = $derived(won ? -1 : data.answers.length)
	let currentGuess = $derived(data.guesses[i] || '')
	let submittable = $derived(currentGuess.length === 5)

	// @ts-ignore
	@ai({ access: 'r', description: 'Number of guesses made so far (0-6).' })
	let guess_count = $derived(data.answers.length)

	// @ts-ignore
	@ai({ access: 'r', description: 'Whether the player has won the current game.' })
	let game_won = $derived(won)

	// @ts-ignore
	@ai({ access: 'r', description: 'Whether the game is over (won or 6 guesses used).' })
	let game_over = $derived(won || data.answers.length >= 6)

	// @ts-ignore
	@ai({ access: 'r', description: 'Summary of all guesses so far. Each entry is an object with "word" (the guessed word) and "result" (a 5-char string: x=exact, c=close, _=missing).' })
	let guesses_summary = $derived(
		data.answers.map((answer, idx) => ({ word: data.guesses[idx], result: answer }))
	)

	// @ts-ignore
	@ai({ access: 'r', description: 'The current partially-typed guess (may be empty or 1-4 letters if not yet submitted).' })
	let current_input = $derived(currentGuess)

	// @ts-ignore
	@ai({ description: 'Enters a 5-letter word as the current guess and submits it. The word must be a valid English word. Returns ok:true on success or error on failure.' })
	async function enterGuess({ word }: { word: string }) {
		const w = (word as string).toLowerCase().trim()
		if (w.length !== 5) return { error: 'Word must be exactly 5 letters' }
		if (won || data.answers.length >= 6) return { error: 'Game is already over' }

		const tick = () => new Promise<void>(r => setTimeout(r, 0))

		// Clear current input first (backspace until empty)
		const backspaceBtn = document.querySelector<HTMLButtonElement>('[data-key="backspace"]')
		for (let k = 0; k < 5; k++) {
			backspaceBtn?.click()
		}
		await tick()

		// Type each letter
		for (const letter of w) {
			const btn = document.querySelector<HTMLButtonElement>(`[data-key="${letter}"]`)
			if (!btn) return { error: `Letter "${letter}" not found on keyboard` }
			btn.click()
		}

		// Wait for Svelte to flush reactive updates so the enter button becomes enabled
		await tick()

		// Submit
		const enterBtn = document.querySelector<HTMLButtonElement>('[data-key="enter"]')
		if (!enterBtn || enterBtn.disabled) return { error: 'Cannot submit - word may not be valid or game is over' }
		enterBtn.click()

		return { ok: true, word: w }
	}

	const { classnames, description } = $derived.by(() => {
		let classnames: Record<string, 'exact' | 'close' | 'missing'> = {}
		let description: Record<string, string> = {}
		data.answers.forEach((answer, i) => {
			const guess = data.guesses[i]
			for (let i = 0; i < 5; i += 1) {
				const letter = guess[i]
				if (answer[i] === 'x') {
					classnames[letter] = 'exact'
					description[letter] = 'correct'
				} else if (!classnames[letter]) {
					classnames[letter] = answer[i] === 'c' ? 'close' : 'missing'
					description[letter] = answer[i] === 'c' ? 'present' : 'absent'
				}
			}
		})
		return { classnames, description }
	})

	// @ts-ignore
	@ai({ access: 'r', description: 'Known letter statuses derived from all guesses so far. Each key is a letter; value is "exact" (correct position), "close" (present but wrong position), or "missing" (not in the word).' })
	let letter_statuses = $derived(classnames)

	function update(event: MouseEvent) {
		event.preventDefault()
		const key = (event.target as HTMLButtonElement).getAttribute('data-key')
		if (key === 'backspace') {
			currentGuess = currentGuess.slice(0, -1)
			shake = false
		} else if (currentGuess.length < 5) {
			currentGuess += key
		}
	}

	function keydown(event: KeyboardEvent) {
		if (event.metaKey) return
		const tag = (event.target as HTMLElement).tagName
		if (tag === 'INPUT' || tag === 'TEXTAREA') return
		if (event.key === 'Enter' && !submittable) return
		document
			.querySelector(`[data-key="${event.key}" i]`)
			?.dispatchEvent(new MouseEvent('click', { cancelable: true, bubbles: true }))
	}
</script>

<svelte:window onkeydown={keydown} />

<h1 class="visually-hidden">Sverdle</h1>

<form
	method="post"
	action="?/enter"
	use:enhance={() => {
		return ({ result, update }) => {
			shake = result.type === 'failure'
			update({ reset: false })
		}
	}}
>
	<a class="how-to-play" href={resolve('/sverdle/how-to-play')}>How to play</a>

	<div class="grid" class:playing={!won} class:shake onanimationend={() => (shake = false)}>
		{#each Array.from(Array(6).keys()) as row (row)}
			{@const current = row === i}
			<h2 class="visually-hidden">Row {row + 1}</h2>
			<div class="row" class:current>
				{#each Array.from(Array(5).keys()) as column (column)}
					{@const guess = current ? currentGuess : data.guesses[row]}
					{@const answer = data.answers[row]?.[column]}
					{@const value = guess?.[column] ?? ''}
					{@const selected = current && column === guess.length}
					{@const exact = answer === 'x'}
					{@const close = answer === 'c'}
					{@const missing = answer === '_'}
					<div class="letter" class:exact class:close class:missing class:selected>
						{value}
						<span class="visually-hidden">
							{#if exact}
								(correct)
							{:else if close}
								(present)
							{:else if missing}
								(absent)
							{:else}
								empty
							{/if}
						</span>
						<input name="guess" disabled={!current} type="hidden" {value} />
					</div>
				{/each}
			</div>
		{/each}
	</div>

	<div class="controls">
		{#if won || data.answers.length >= 6}
			{#if !won && data.answer}
				<p>the answer was "{data.answer}"</p>
			{/if}
			<button data-key="enter" class="restart selected" formaction="?/restart">
				{won ? 'you won :)' : `game over :(`} play again?
			</button>
		{:else}
			<div class="keyboard">
				<button data-key="enter" class:selected={submittable} disabled={!submittable}>enter</button>

				<button
					onclick={update}
					data-key="backspace"
					formaction="?/update"
					name="key"
					value="backspace"
				>
					back
				</button>

				{#each ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'] as row (row)}
					<div class="row">
						{#each row as letter, index (index)}
							<button
								onclick={update}
								data-key={letter}
								class={classnames[letter]}
								disabled={submittable}
								formaction="?/update"
								name="key"
								value={letter}
								aria-label="{letter} {description[letter] || ''}"
							>
								{letter}
							</button>
						{/each}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</form>

{#if won}
	<div
		style="position: absolute; left: 50%; top: 30%"
		use:confetti={{
			particleCount: reducedMotion.current ? 0 : undefined,
			force: 0.7,
			stageWidth: window.innerWidth,
			stageHeight: window.innerHeight,
			colors: ['#ff3e00', '#40b3ff', '#676778']
		}}
	></div>
{/if}

<style>
	form {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		flex: 1;
	}

	.how-to-play {
		color: var(--color-text);
	}

	.how-to-play::before {
		content: 'i';
		display: inline-block;
		font-size: 0.8em;
		font-weight: 900;
		width: 1em;
		height: 1em;
		padding: 0.2em;
		line-height: 1;
		border: 1.5px solid var(--color-text);
		border-radius: 50%;
		text-align: center;
		margin: 0 0.5em 0 0;
		position: relative;
		top: -0.05em;
	}

	.grid {
		--width: min(100vw, 40vh, 380px);
		max-width: var(--width);
		align-self: center;
		justify-self: center;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
	}

	.grid .row {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		grid-gap: 0.2rem;
		margin: 0 0 0.2rem 0;
	}

	@media (prefers-reduced-motion: no-preference) {
		.grid.shake .row.current {
			animation: wiggle 0.5s;
		}
	}

	.grid.playing .row.current {
		filter: drop-shadow(3px 3px 10px var(--color-bg-0));
	}

	.letter {
		aspect-ratio: 1;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		box-sizing: border-box;
		text-transform: lowercase;
		border: none;
		font-size: calc(0.08 * var(--width));
		border-radius: 2px;
		background: white;
		margin: 0;
		color: rgba(0, 0, 0, 0.7);
	}

	.letter.missing {
		background: rgba(255, 255, 255, 0.5);
		color: rgba(0, 0, 0, 0.5);
	}

	.letter.exact {
		background: var(--color-theme-2);
		color: white;
	}

	.letter.close {
		border: 2px solid var(--color-theme-2);
	}

	.selected {
		outline: 2px solid var(--color-theme-1);
	}

	.controls {
		text-align: center;
		justify-content: center;
		height: min(18vh, 10rem);
	}

	.keyboard {
		--gap: 0.2rem;
		position: relative;
		display: flex;
		flex-direction: column;
		gap: var(--gap);
		height: 100%;
	}

	.keyboard .row {
		display: flex;
		justify-content: center;
		gap: 0.2rem;
		flex: 1;
	}

	.keyboard button,
	.keyboard button:disabled {
		--size: min(8vw, 4vh, 40px);
		background-color: white;
		color: black;
		width: var(--size);
		border: none;
		border-radius: 2px;
		font-size: calc(var(--size) * 0.5);
		margin: 0;
	}

	.keyboard button.exact {
		background: var(--color-theme-2);
		color: white;
	}

	.keyboard button.missing {
		opacity: 0.5;
	}

	.keyboard button.close {
		border: 2px solid var(--color-theme-2);
	}

	.keyboard button:focus {
		background: var(--color-theme-1);
		color: white;
		outline: none;
	}

	.keyboard button[data-key='enter'],
	.keyboard button[data-key='backspace'] {
		position: absolute;
		bottom: 0;
		width: calc(1.5 * var(--size));
		height: calc(1 / 3 * (100% - 2 * var(--gap)));
		text-transform: uppercase;
		font-size: calc(0.3 * var(--size));
		padding-top: calc(0.15 * var(--size));
	}

	.keyboard button[data-key='enter'] {
		right: calc(50% + 3.5 * var(--size) + 0.8rem);
	}

	.keyboard button[data-key='backspace'] {
		left: calc(50% + 3.5 * var(--size) + 0.8rem);
	}

	.keyboard button[data-key='enter']:disabled {
		opacity: 0.5;
	}

	.restart {
		width: 100%;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.5);
		border-radius: 2px;
		border: none;
	}

	.restart:focus,
	.restart:hover {
		background: var(--color-theme-1);
		color: white;
		outline: none;
	}

	@keyframes wiggle {
		0% { transform: translateX(0); }
		10% { transform: translateX(-2px); }
		30% { transform: translateX(4px); }
		50% { transform: translateX(-6px); }
		70% { transform: translateX(+4px); }
		90% { transform: translateX(-2px); }
		100% { transform: translateX(0); }
	}
</style>
