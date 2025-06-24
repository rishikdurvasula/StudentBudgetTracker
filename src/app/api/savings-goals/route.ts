import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const createSavingsGoalSchema = z.object({
  goalName: z.string().min(1, "Goal name is required"),
  targetAmount: z.number().min(0.01, "Target amount must be greater than 0"),
  targetDate: z.string().datetime(),
  category: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSavingsGoalSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const savingsGoal = await prisma.savingsGoal.create({
      data: {
        userId: user.id,
        goalName: validatedData.goalName,
        targetAmount: validatedData.targetAmount,
        targetDate: new Date(validatedData.targetDate),
        category: validatedData.category,
        currentAmount: 0,
        isCompleted: false,
      },
    });

    return NextResponse.json(savingsGoal, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating savings goal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const savingsGoals = await prisma.savingsGoal.findMany({
      where: { userId: user.id },
      orderBy: [
        { isCompleted: "asc" },
        { targetDate: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(savingsGoals);
  } catch (error) {
    console.error("Error fetching savings goals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 