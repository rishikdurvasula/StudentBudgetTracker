export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range");
    let dateFilter = {};
    const now = new Date();
    if (range === "day") {
      dateFilter = { gte: startOfDay(now), lte: endOfDay(now) };
    } else if (range === "week") {
      dateFilter = { gte: startOfWeek(now), lte: endOfWeek(now) };
    } else if (range === "month") {
      dateFilter = { gte: startOfMonth(now), lte: endOfMonth(now) };
    }
    const where: any = { userId: user.id };
    if (range === "day" || range === "week" || range === "month") {
      where.date = dateFilter;
    }
    const summary = await prisma.expense.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
    });
    const result = summary.map((item) => ({
      category: item.category,
      total: item._sum.amount || 0,
    }));
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching expense summary:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 