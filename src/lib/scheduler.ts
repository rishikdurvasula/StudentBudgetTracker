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
      // Generate weekly digests
      await this.generateWeeklyDigests();
      
      console.log('Weekly tasks completed successfully');
    } catch (error) {
      console.error('Error running weekly tasks:', error);
    }
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

    const totalSpent = expenses.reduce((sum: number, expense: { amount: number }) => sum + expense.amount, 0);
    
    // Group by category
    const categoryBreakdown: Record<string, number> = {};
    expenses.forEach((expense: { amount: number; category: string; customCategoryName: string | null }) => {
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
}

export default BudgetScheduler;

// Initialize scheduler on app startup
export function initializeScheduler() {
  if (typeof window === 'undefined') { // Only run on server
    BudgetScheduler.getInstance();
  }
} 