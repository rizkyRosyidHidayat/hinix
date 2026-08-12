import type { CommandDefinition, CommandContext } from '../../commands/types';
import { CalculatorService } from './calculator.service';

export const calculatorCommand: CommandDefinition = {
  name: 'calc',
  aliases: ['c'],
  description: 'Evaluate a mathematical expression safely',
  usage: 'calc <expression>',
  examples: [
    'calc 50 * 20',
    'calc 100 / 3'
  ],
  async execute(args: string[], context: CommandContext) {
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
