import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    console.log("Fetching meal plans");
    const session = await getServerSession(authOptions);
    console.log("Session:", session ? "Found" : "Not found");

    if (!session?.user?.email) {
      console.log("No user session or email found");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("Looking up user with email:", session.user.email);
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      console.log("User not found in database");
      return new NextResponse("User not found", { status: 404 });
    }

    // Get date range from query parameters
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    console.log("Date range:", { startDate, endDate });

    // Build where clause
    const where: any = {
      userId: user.id,
    };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    console.log("Fetching meal plans with filter:", where);
    const mealPlans = await prisma.mealPlan.findMany({
      where,
      orderBy: {
        date: "asc",
      },
    });

    console.log("Found meal plans:", mealPlans.length);
    return NextResponse.json(mealPlans);
  } catch (error) {
    console.error("Error fetching meal plans:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack
      });
    }
    return new NextResponse(
      `Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    console.log("Creating new meal plan");
    const session = await getServerSession(authOptions);
    console.log("Session:", session ? "Found" : "Not found");

    if (!session?.user?.email) {
      console.log("No user session or email found");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("Looking up user with email:", session.user.email);
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      console.log("User not found in database");
      return new NextResponse("User not found", { status: 404 });
    }

    console.log("Found user:", user.id);
    const body = await req.json();
    console.log("Meal plan data:", body);

    const { date, mealType } = body;

    if (!date || !mealType) {
      console.log("Missing required fields");
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Check if meal plan already exists for this date and meal type
    const existingMealPlan = await prisma.mealPlan.findFirst({
      where: {
        userId: user.id,
        date: new Date(date),
        mealType: mealType.toLowerCase(),
      },
    });

    if (existingMealPlan) {
      console.log("Meal plan already exists for this date and meal type");
      return new NextResponse("Meal plan already exists", { status: 400 });
    }

    console.log("Creating meal plan in database");
    const mealPlan = await prisma.mealPlan.create({
      data: {
        date: new Date(date),
        mealType: mealType.toLowerCase(),
        userId: user.id,
      },
    });

    console.log("Meal plan created:", {
      id: mealPlan.id,
      date: mealPlan.date,
      mealType: mealPlan.mealType
    });

    return NextResponse.json(mealPlan);
  } catch (error) {
    console.error("Error creating meal plan:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack
      });
    }
    return new NextResponse(
      `Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    );
  }
} 