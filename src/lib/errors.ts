/**
 * HiNix Error Hierarchy
 *
 * All domain errors extend HiNixError so the command executor
 * can distinguish intentional user-facing errors from unexpected failures.
 */

export class HiNixError extends Error {
	constructor(
		message: string,
		public readonly hint?: string
	) {
		super(message);
		this.name = 'HiNixError';
	}
}

/** Thrown when user input fails validation (bad args, missing fields, etc.) */
export class ValidationError extends HiNixError {
	constructor(message: string, hint?: string) {
		super(message, hint);
		this.name = 'ValidationError';
	}
}

/** Thrown when a requested entity does not exist */
export class NotFoundError extends HiNixError {
	constructor(entity: string, id?: string) {
		super(id ? `${entity} not found: ${id}` : `${entity} not found.`, undefined);
		this.name = 'NotFoundError';
	}
}

/** Thrown when a storage / database operation fails */
export class StorageError extends HiNixError {
	constructor(message: string) {
		super(message);
		this.name = 'StorageError';
	}
}

/** Thrown when a command itself has a logical error */
export class CommandError extends HiNixError {
	constructor(message: string, hint?: string) {
		super(message, hint);
		this.name = 'CommandError';
	}
}
