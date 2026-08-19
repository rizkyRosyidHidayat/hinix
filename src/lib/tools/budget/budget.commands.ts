import type { CommandDefinition, CommandContext } from '../../commands/types';
import { BudgetService } from './budget.service';

export const budgetCommand: CommandDefinition = {
  name: 'budget',
  aliases: ['b'],
  namespace: 'budget',
  category: 'finance',
  keywords: ['money', 'expense', 'income', 'spending', 'finance'],
  description: 'Manage budget and expenses',
  usage: 'budget [add <amount> <category> <description> | income <amount> <description> | list]',
  subcommands: [
    { name: 'add', description: 'Add an expense', usage: 'add <amount> <category> <description>', example: 'add 50000 food "Lunch"' },
    { name: 'income', description: 'Add income', usage: 'income <amount> <description>', example: 'income 15000000 "Salary"' },
    { name: 'list', description: 'List all transactions', usage: 'list', example: 'list' },
  ],
  async execute(args: string[], context: CommandContext) {
    const service = new BudgetService(context.repositories.budget);

    if (args.length === 0 || args[0].toLowerCase() === 'list') {
      return { type: 'navigate', path: '/budget' };
    }

    const subCommand = args[0].toLowerCase();

    switch (subCommand) {
      case 'add': {
        const amount = parseInt(args[1], 10);
        if (isNaN(amount)) return { type: 'error', output: 'Amount must be a number.' };

        const category = args[2];
        const description = args.slice(3).join(' ');

        const transaction = await service.addExpense(amount, category, description);
        return { type: 'success', output: `Expense added: -${transaction.amount} for ${category || 'Uncategorized'}` };
      }

      case 'income': {
        const amount = parseInt(args[1], 10);
        if (isNaN(amount)) return { type: 'error', output: 'Amount must be a number.' };

        const description = args.slice(2).join(' ');

        const transaction = await service.addIncome(amount, description);
        return { type: 'success', output: `Income added: +${transaction.amount}` };
      }

      default:
        return { type: 'error', output: `Unknown subcommand: ${subCommand}` };
    }
  }
};
