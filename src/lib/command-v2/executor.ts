import type { ParsedCommand } from './types';
export function buildExecutionPlan(command: ParsedCommand) {
	return {
		operation: `${command.domain}.${command.action}`,
		entities: command.entities,
		requiresConfirmation: command.needsConfirmation
	};
}
