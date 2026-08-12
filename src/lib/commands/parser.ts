export interface ParsedCommand {
  command: string;
  args: string[];
}

export function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim();
  if (!trimmed) {
    return { command: '', args: [] };
  }

  // Regex to match words or quoted strings
  const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
  const matches = [];
  let match;

  while ((match = regex.exec(trimmed)) !== null) {
    // If it's a quoted string, use the captured group, otherwise use the whole match
    matches.push(match[1] || match[2] || match[0]);
  }

  if (matches.length === 0) {
    return { command: '', args: [] };
  }

  const command = matches[0].toLowerCase();
  const args = matches.slice(1);

  return { command, args };
}
