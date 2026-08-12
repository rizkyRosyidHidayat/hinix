import type { BudgetTransaction } from '../types/budget';
import { db } from '../db/database';

export class BudgetRepository {
  async create(transaction: BudgetTransaction): Promise<BudgetTransaction> {
    await db.budgetTransactions.add(transaction);
    return transaction;
  }

  async list(): Promise<BudgetTransaction[]> {
    return db.budgetTransactions.orderBy('date').reverse().toArray();
  }
  
  async listByDateRange(startDate: string, endDate: string): Promise<BudgetTransaction[]> {
    return db.budgetTransactions
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
  }

  async getById(id: string): Promise<BudgetTransaction | undefined> {
    return db.budgetTransactions.get(id);
  }

  async update(id: string, changes: Partial<BudgetTransaction>): Promise<BudgetTransaction> {
    await db.budgetTransactions.update(id, changes);
    const updated = await this.getById(id);
    if (!updated) throw new Error('Transaction not found');
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.budgetTransactions.delete(id);
  }
}
