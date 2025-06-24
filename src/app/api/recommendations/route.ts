import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Sample recipe websites for variety
const RECIPE_WEBSITES = [
  "allrecipes.com",
  "foodnetwork.com",
  "epicurious.com",
  "bonappetit.com",
  "seriouseats.com",
  "cooking.nytimes.com",
  "jamieoliver.com",
  "bbcgoodfood.com"
];

export async function GET(req: Request) {
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

    // Get the latest shopping list for the user
    const shoppingList = await prisma.shoppingList.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    // Generate recommendations based on the shopping list
    const recommendations = await generateRecommendations(shoppingList);

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return new NextResponse(
      `Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { store, items } = body;

    // Generate new recommendations based on the provided data
    const recommendations = await generateRecommendations({ store, items });

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return new NextResponse(
      `Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    );
  }
}

function generateRecommendations(shoppingList: any) {
  // This is a placeholder for the actual recommendation generation logic
  // You would typically integrate with an AI service or use predefined rules
  return {
    healthAndNutrition: [
      "Consider adding more leafy greens to your list",
      "Try to include a variety of colorful vegetables",
      "Look for whole grain options when available"
    ],
    financialOptimization: [
      "Check for store brand alternatives",
      "Consider buying in bulk for frequently used items",
      "Look for items on sale or with coupons"
    ],
    shoppingStrategy: [
      "Group similar items together for efficient shopping",
      "Check store layout to minimize backtracking",
      "Consider shopping during off-peak hours"
    ],
    recipeSuggestions: [
      {
        title: "Quick and Healthy Stir Fry",
        description: "A nutritious meal using your shopping list items",
        ingredients: [
          "2 cups mixed vegetables",
          "1 cup protein of choice",
          "2 tbsp cooking oil",
          "2 tbsp soy sauce"
        ],
        difficulty: "Easy",
        prepTime: "15 minutes",
        cookTime: "10 minutes",
        source: "Recipe Source",
        url: "https://example.com/recipe"
      },
      {
        title: "Simple Salad Bowl",
        description: "A refreshing and customizable salad",
        ingredients: [
          "4 cups mixed greens",
          "1 cup protein of choice",
          "1/4 cup nuts or seeds",
          "2 tbsp dressing"
        ],
        difficulty: "Easy",
        prepTime: "10 minutes",
        cookTime: "0 minutes",
        source: "Recipe Source",
        url: "https://example.com/recipe"
      }
    ]
  };
} 