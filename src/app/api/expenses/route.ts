import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

const expenseSchema = z.object({
  amount: z.number({ required_error: "Amount is required" }).min(0.01, "Amount must be greater than 0"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(["academic", "groceries", "transport", "leisure", "rent", "other"], { required_error: "Category is required" }),
  customCategoryName: z.string().optional(),
  date: z.string({ required_error: "Date is required" }).datetime(),
}).refine(
  (data) => {
    if (data.category === "other") {
      return !!data.customCategoryName && data.customCategoryName.trim().length > 0;
    }
    return true;
  },
  {
    message: "Custom category name is required when category is other",
    path: ["customCategoryName"],
  }
);

export async function POST(request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = expenseSchema.parse(body);

    // Create the expense
    const expense = await prisma.expense.create({
      data: {
        amount: validatedData.amount,
        description: validatedData.description,
        category: validatedData.category,
        customCategoryName: validatedData.customCategoryName,
        date: new Date(validatedData.date),
        userId: user.id,
      },
    });

    return NextResponse.json(
      { 
        message: "Expense created successfully", 
        expense 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating expense:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range");
    let dateFilter = {};
    const now = new Date();
    if (range === "day") {
      dateFilter = {
        gte: startOfDay(now),
        lte: endOfDay(now),
      };
    } else if (range === "week") {
      dateFilter = {
        gte: startOfWeek(now),
        lte: endOfWeek(now),
      };
    } else if (range === "month") {
      dateFilter = {
        gte: startOfMonth(now),
        lte: endOfMonth(now),
      };
    }

    // Build where clause
    const where: any = {
      userId: user.id,
    };
    if (range === "day" || range === "week" || range === "month") {
      where.date = dateFilter;
    }

    // Get expenses sorted by date descending
    const expenses = await prisma.expense.findMany({
      where,
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 