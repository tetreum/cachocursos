<script lang="ts">
	interface SliderProps {
		value: number;
		min: number;
		max: number;
		step?: number;
		label: string;
		scale?: 'linear' | 'log';
		unit?: string;
		hint?: string;
		disabled?: boolean;
		format?: (value: number) => string;
	}

	let {
		value = $bindable(),
		min,
		max,
		step = 0.01,
		label,
		scale = 'linear',
		unit,
		hint,
		disabled = false,
		format
	}: SliderProps = $props();

	const SLIDER_STEPS = 1000;

	function toSlider(actual: number): number {
		if (scale === 'linear') return actual;
		const low = Math.log10(min);
		const high = Math.log10(max);
		return ((Math.log10(Math.max(actual, min)) - low) / (high - low)) * SLIDER_STEPS;
	}

	function fromSlider(position: number): number {
		if (scale === 'linear') return position;
		const low = Math.log10(min);
		const high = Math.log10(max);
		return Math.pow(10, low + (position / SLIDER_STEPS) * (high - low));
	}

	const sliderValue = $derived(toSlider(value));
	const display = $derived(format ? format(value) : value.toFixed(2));

	function handleInput(event: Event): void {
		const target = event.currentTarget as HTMLInputElement;
		value = fromSlider(Number(target.value));
	}
</script>

<div class="e-slider" class:e-slider--disabled={disabled}>
	<div class="e-slider__head">
		<span class="e-slider__label">{label}</span>
		<span class="e-slider__value">
			{display}{#if unit}<span class="e-slider__unit">{unit}</span>{/if}
		</span>
	</div>
	<input
		class="e-slider__input"
		type="range"
		min={scale === 'linear' ? min : 0}
		max={scale === 'linear' ? max : SLIDER_STEPS}
		step={scale === 'linear' ? step : 1}
		value={sliderValue}
		{disabled}
		aria-label={label}
		oninput={handleInput}
	/>
	{#if hint}
		<p class="e-slider__hint">{hint}</p>
	{/if}
</div>

<style lang="scss">
	.e-slider {
		display: flex;
		flex-direction: column;
		gap: var(--e-space-2xs);

		&--disabled {
			opacity: 0.5;
		}

		&__head {
			display: flex;
			align-items: baseline;
			justify-content: space-between;
		}

		&__label {
			font-size: var(--e-text-xs);
			font-weight: var(--e-weight-semibold);
			color: var(--e-fg-muted);
			letter-spacing: var(--e-tracking-wide);
			text-transform: uppercase;
		}

		&__value {
			@include mono;

			font-size: var(--e-text-md);
			font-weight: var(--e-weight-semibold);
			color: var(--e-accent);
		}

		&__unit {
			margin-left: 0.15em;
			font-size: var(--e-text-xs);
			color: var(--e-fg-dim);
		}

		&__input {
			width: 100%;
			height: 20px;
			accent-color: var(--e-accent);
			background: none;

			@include focus-ring;
		}

		&__hint {
			font-size: var(--e-text-2xs);
			color: var(--e-fg-dim);
		}
	}
</style>
