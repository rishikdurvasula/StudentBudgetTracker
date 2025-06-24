import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import BudgetScheduler from "@/lib/scheduler";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow in development
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Only available in development" }, { status: 403 });
    }

    const scheduler = BudgetScheduler.getInstance();
    await scheduler.triggerWeeklyTasks();

    return NextResponse.json({ 
      message: "Weekly tasks triggered successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error triggering weekly tasks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 