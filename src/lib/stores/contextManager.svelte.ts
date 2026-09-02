/**
 * Reactive context manager using Svelte 5 $state rune.
 * Tracks which command namespace the user is currently "inside".
 * The user still types full commands — context is purely visual/navigational.
 */
class CommandContextManager {
	namespace = $state<string | null>(null);

	enter(ns: string): void {
		this.namespace = ns;
	}

	exit(): void {
		this.namespace = null;
	}

	isActive(): boolean {
		return this.namespace !== null;
	}
}

export const contextManager = new CommandContextManager();
