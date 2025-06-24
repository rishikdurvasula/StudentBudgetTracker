import cron from 'node-cron';
import prisma from './prisma';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, subWeeks } from 'date-fns';

const MONTHLY_BUDGET = 500; // Hardcoded budget for now

interface BudgetCheckResult {
  userId: string;
  userEmail: string;
  userName: string;
  totalSpent: number;
  percentageUsed: number;
  isOver80Percent: boolean;
  isOverBudget: boolean;
}

interface WeeklyDigestData {
  userId: string;
  totalSpent: number;
  categoryBreakdown: Record<string, number>;
  weekStart: Date;
  weekEnd: Date;
}

class BudgetScheduler {
  private static instance: BudgetScheduler;

  private constructor() {
    this.initializeScheduler();
  }

  public static getInstance(): BudgetScheduler {
    if (!BudgetScheduler.instance) {
      BudgetScheduler.instance = new BudgetScheduler();
    }
    return BudgetScheduler.instance;
  }

  private initializeScheduler() {
    // Run every Sunday at 9:00 AM
    cron.schedule('0 9 * * 0', async () => {
      console.log('Running weekly budget check and digest generation...');
      await this.runWeeklyTasks();
    });

    console.log('Budget scheduler initialized - running weekly on Sundays at 9:00 AM');
  }

  private async runWeeklyTasks() {
    try {
      // Check budget alerts
      await this.checkBudgetAlerts();
      
      // Generate weekly digests
      await this.generateWeeklyDigests();
      
      console.log('Weekly tasks completed successfully');
    } catch (error) {
      console.error('Error running weekly tasks:', error);
    }
  }

  private async checkBudgetAlerts(): Promise<void> {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    for (const user of users) {
      if (!user.email) continue;

      const budgetResult = await this.calculateUserBudget(user.id);
      
      if (budgetResult.isOver80Percent || budgetResult.isOverBudget) {
        await this.createBudgetAlert(user.id, budgetResult);
      }
    }
  }

  private async calculateUserBudget(userId: string): Promise<BudgetCheckResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!user || !user.email) {
      throw new Error('User not found or no email');
    }

    // Get current month's expenses
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    });

    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const percentageUsed = (totalSpent / MONTHLY_BUDGET) * 100;

    return {
      userId: user.id,
      userEmail: user.email,
      userName: user.name || 'User',
      totalSpent,
      percentageUsed,
      isOver80Percent: percentageUsed >= 80,
      isOverBudget: percentageUsed >= 100,
    };
  }

  private async createBudgetAlert(userId: string, budgetResult: BudgetCheckResult): Promise<void> {
    const alertType = budgetResult.isOverBudget ? 'budget_exceeded' : 'budget_warning';
    
    let message: string;
    if (budgetResult.isOverBudget) {
      message = `You've exceeded your monthly budget! You've spent $${budgetResult.totalSpent.toFixed(2)} out of $${MONTHLY_BUDGET.toFixed(2)} (${budgetResult.percentageUsed.toFixed(1)}%).`;
    } else {
      message = `Budget warning: You've used ${budgetResult.percentageUsed.toFixed(1)}% of your monthly budget. You've spent $${budgetResult.totalSpent.toFixed(2)} out of $${MONTHLY_BUDGET.toFixed(2)}.`;
    }

    await prisma.budgetAlert.create({
      data: {
        userId,
        type: alertType,
        message,
        amount: budgetResult.totalSpent,
        budget: MONTHLY_BUDGET,
        percentage: budgetResult.percentageUsed,
      },
    });

    console.log(`Created budget alert for user ${budgetResult.userEmail}: ${message}`);
  }

  private async generateWeeklyDigests(): Promise<void> {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    for (const user of users) {
      if (!user.email) continue;

      const digestData = await this.calculateWeeklyDigest(user.id);
      if (digestData) {
        await this.createWeeklyDigest(user.id, digestData);
      }
    }
  }

  private async calculateWeeklyDigest(userId: string): Promise<WeeklyDigestData | null> {
    // Get last week's data
    const now = new Date();
    const weekStart = startOfWeek(subWeeks(now, 1));
    const weekEnd = endOfWeek(subWeeks(now, 1));

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    });

    if (expenses.length === 0) {
      return null; // No expenses last week
    }

    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Group by category
    const categoryBreakdown: Record<string, number> = {};
    expenses.forEach(expense => {
      const category = expense.category === 'other' ? expense.customCategoryName || 'Other' : expense.category;
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + expense.amount;
    });

    return {
      userId,
      totalSpent,
      categoryBreakdown,
      weekStart,
      weekEnd,
    };
  }

  private async createWeeklyDigest(userId: string, digestData: WeeklyDigestData): Promise<void> {
    const message = `You spent $${digestData.totalSpent.toFixed(2)} this week.`;

    await prisma.weeklyDigest.create({
      data: {
        userId,
        weekStart: digestData.weekStart,
        weekEnd: digestData.weekEnd,
        totalSpent: digestData.totalSpent,
        categoryBreakdown: digestData.categoryBreakdown,
        message,
      },
    });

    console.log(`Created weekly digest for user ${userId}: ${message}`);
  }

  // Manual trigger methods for testing
  public async triggerWeeklyTasks(): Promise<void> {
    console.log('Manually triggering weekly tasks...');
    await this.runWeeklyTasks();
  }

  public async checkBudgetForUser(userId: string): Promise<BudgetCheckResult | null> {
    try {
      return await this.calculateUserBudget(userId);
    } catch (error) {
      console.error('Error checking budget for user:', error);
      return null;
    }
  }
}

export default BudgetScheduler;

// Initialize scheduler on app startup
export function initializeScheduler() {
  if (typeof window === 'undefined') { // Only run on server
    BudgetScheduler.getInstance();
  }
} 