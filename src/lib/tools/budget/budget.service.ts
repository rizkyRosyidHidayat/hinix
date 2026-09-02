import type { BudgetTransaction, BudgetSummary } from '../../types/budget';
import type { BudgetRepository } from '../../repositories/budget.repository';

export class BudgetService {
	constructor(private repository: BudgetRepository) {}

	async addExpense(
		amount: number,
		category?: string,
		description?: string
	): Promise<BudgetTransaction> {
		const transaction: BudgetTransaction = {
			id: crypto.randomUUID(),
			type: 'expense',
			amount,
			category,
			description,
			date: new Date().toISOString().split('T')[0],
			createdAt: new Date().toISOString()
		};
		return await this.repository.create(transaction);
	}

	async addIncome(amount: number, description?: string): Promise<BudgetTransaction> {
		const transaction: BudgetTransaction = {
			id: crypto.randomUUID(),
			type: 'income',
			amount,
			description,
			category: 'Income',
			date: new Date().toISOString().split('T')[0],
			createdAt: new Date().toISOString()
		};
		return await this.repository.create(transaction);
	}

	async list(): Promise<BudgetTransaction[]> {
		return await this.repository.list();
	}

	async listToday(): Promise<BudgetTransaction[]> {
		return await this.repository.listByDateRange(
			new Date().toISOString().split('T')[0],
			new Date().toISOString().split('T')[0]
		);
	}

	async getSummary(startDate: string, endDate: string): Promise<BudgetSummary> {
		const transactions = await this.repository.listByDateRange(startDate, endDate);

		let income = 0;
		let expenses = 0;
		const byCategory: Record<string, number> = {};

		for (const t of transactions) {
			if (t.type === 'income') {
				income += t.amount;
			} else {
				expenses += t.amount;
				const cat = t.category || 'Uncategorized';
				byCategory[cat] = (byCategory[cat] || 0) + t.amount;
			}
		}

		return {
			income,
			expenses,
			remaining: income - expenses,
			byCategory
		};
	}
}
