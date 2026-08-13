import type { CommandDefinition } from '../../commands/types';
import { CalculatorService } from './calculator.service';

export const calculatorCommand: CommandDefinition = {
  name: 'calc',
  aliases: ['c'],
  category: 'utility',
  keywords: ['math', 'calculate', 'arithmetic', 'numbers', 'calculator'],
  description: 'Evaluate a mathematical expression safely',
  usage: 'calc <expression>',
  example: 'calc 10 * 1.5',
  async execute(args: string[]) {
    if (args.length === 0) {
      return { type: 'navigate', path: '/calculator' };
    }

    const expression = args.join(' ');
    const service = new CalculatorService();

    try {
      const result = service.calculate(expression);
      return { type: 'success', output: `${result}` };
    } catch (e: any) {
      return { type: 'error', output: e.message };
    }
  }
};
