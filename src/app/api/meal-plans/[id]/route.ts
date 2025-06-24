import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Updating meal plan:", params.id);
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

    console.log("Looking up meal plan:", params.id);
    const existingMealPlan = await prisma.mealPlan.findUnique({
      where: { id: params.id },
    });

    if (!existingMealPlan) {
      console.log("Meal plan not found");
      return new NextResponse("Meal plan not found", { status: 404 });
    }

    if (existingMealPlan.userId !== user.id) {
      console.log("Meal plan does not belong to user");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    console.log("Update data:", body);

    console.log("Updating meal plan in database");
    const updatedMealPlan = await prisma.mealPlan.update({
      where: { id: params.id },
      data: {},
    });

    console.log("Meal plan updated:", updatedMealPlan.id);
    return NextResponse.json(updatedMealPlan);
  } catch (error) {
    console.error("Error updating meal plan:", error);
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