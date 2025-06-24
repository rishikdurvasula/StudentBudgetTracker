import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MealPlan } from "@prisma/client";

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  price: number;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const { startDate, endDate } = await req.json();

    // Get meal plans within the date range
    const mealPlans = await prisma.mealPlan.findMany({
      where: {
        userId: user.id,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    }) as MealPlan[];

    console.log("Found meal plans:", mealPlans.length);

    // Process ingredients and combine quantities
    const ingredientMap = new Map<string, Ingredient>();

    mealPlans.forEach((plan: MealPlan) => {
      // If you want to aggregate ingredients, you need to adjust this logic to match your actual MealPlan model structure.
    });

    // Convert map to array and calculate total cost
    const items = Array.from(ingredientMap.values()).map(item => ({
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      checked: false
    }));

    const totalCost = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create shopping list
    const shoppingList = await prisma.shoppingList.create({
      data: {
        userId: user.id,
        store: "",
        items: JSON.stringify(Array.from(ingredientMap.values())),
        totalCost,
      },
    });

    // Create grocery items for each ingredient
    await Promise.all(items.map(item => 
      prisma.grocery.create({
        data: {
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          price: item.price,
          checked: false,
          userId: user.id,
          shoppingListId: shoppingList.id,
        },
      })
    ));

    return NextResponse.json({
      ...shoppingList,
      items: JSON.parse(shoppingList.items as string),
    });
  } catch (error) {
    console.error("Error generating grocery list:", error);
    return new NextResponse(
      `Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    );
  }
} 