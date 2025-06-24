import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const updateSavingsGoalSchema = z.object({
  currentAmount: z.number().min(0, "Current amount cannot be negative"),
  isCompleted: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateSavingsGoalSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the goal belongs to the user
    const existingGoal = await prisma.savingsGoal.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: "Savings goal not found" }, { status: 404 });
    }

    // Check if goal is completed based on current amount
    const isCompleted = validatedData.currentAmount >= existingGoal.targetAmount;

    const updatedGoal = await prisma.savingsGoal.update({
      where: { id: params.id },
      data: {
        currentAmount: validatedData.currentAmount,
        isCompleted: isCompleted,
        ...(validatedData.isCompleted !== undefined && { isCompleted: validatedData.isCompleted }),
      },
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating savings goal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if the goal belongs to the user
    const existingGoal = await prisma.savingsGoal.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: "Savings goal not found" }, { status: 404 });
    }

    await prisma.savingsGoal.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Savings goal deleted successfully" });
  } catch (error) {
    console.error("Error deleting savings goal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 