import type { CommandDefinition, CommandContext } from '../../commands/types';
import { BudgetService } from './budget.service';

export const budgetCommand: CommandDefinition = {
  name: 'budget',
  aliases: ['b'],
  namespace: 'budget',
  description: 'Manage budget and expenses',
  usage: 'budget [add <amount> <category> <description> | income <amount> <description> | list]',
  examples: [
    'budget add 50000 food "Lunch"',
    'budget income 15000000 "Salary"',
    'budget list'
  ],
  subcommands: [
    { name: 'add', description: 'Add an expense', usage: 'add <amount> <category> <description>' },
    { name: 'income', description: 'Add income', usage: 'income <amount> <description>' },
    { name: 'list', description: 'List all transactions' },
  ],
  async execute(args: string[], context: CommandContext) {
    const service = new BudgetService(context.repositories.budget);

    if (args.length === 0) {
      return { type: 'navigate', path: '/budget' };
    }

    const subCommand = args[0].toLowerCase();

    switch (subCommand) {
      case 'list': {
        const transactions = await service.list();
        if (transactions.length === 0) return { type: 'text', output: 'No transactions found.' };
        const output = transactions.map(t => 
          `[${t.type === 'income' ? '+' : '-'}] ${t.amount} - ${t.category || ''} (${t.description || ''})`
        ).join('\n');
        return { type: 'text', output };
      }

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
