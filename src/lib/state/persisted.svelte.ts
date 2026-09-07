import { browser } from '$app/environment';

export interface PersistedValue<Stored> {
	readonly value: Stored;
	readonly hydrated: boolean;
	hydrate(): void;
	replace(next: Stored): void;
	update(mutate: (draft: Stored) => void): void;
}

export function persisted<Stored>(
	key: string,
	createInitial: () => Stored,
	migrate: (raw: unknown) => Stored | null,
	legacyKey?: string
): PersistedValue<Stored> {
	let current = $state<Stored>(createInitial());
	let hasHydrated = $state(false);

	function flush(): void {
		if (!browser) return;
		try {
			localStorage.setItem(key, JSON.stringify($state.snapshot(current)));
		} catch {
			return;
		}
	}

	return {
		get value(): Stored {
			return current;
		},
		get hydrated(): boolean {
			return hasHydrated;
		},
		hydrate(): void {
			if (!browser || hasHydrated) return;
			hasHydrated = true;
			try {
				const raw =
					localStorage.getItem(key) ?? (legacyKey ? localStorage.getItem(legacyKey) : null);
				if (raw === null) return;
				const restored = migrate(JSON.parse(raw));
				if (restored !== null) {
					current = restored;
					flush();
				}
			} catch {
				return;
			}
		},
		replace(next: Stored): void {
			current = next;
			flush();
		},
		update(mutate: (draft: Stored) => void): void {
			mutate(current);
			flush();
		}
	};
}
