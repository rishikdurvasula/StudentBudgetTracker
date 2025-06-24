import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  price: number;
  checked: boolean;
}

interface ShoppingListData {
  id: string;
  userId: string;
  store: string;
  items: any;
  totalCost: number;
  createdAt: Date;
  updatedAt: Date;
}

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

    if (!shoppingList) {
      // Return an empty shopping list if none exists
      return NextResponse.json({
        id: "",
        userId: user.id,
        store: "",
        items: [],
        totalCost: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Ensure items is properly parsed if it's stored as a string
    const items = typeof shoppingList.items === 'string' 
      ? JSON.parse(shoppingList.items) 
      : shoppingList.items;

    return NextResponse.json({
      ...shoppingList,
      items: Array.isArray(items) ? items : [],
    });
  } catch (error) {
    console.error("Error fetching shopping list:", error);
    return new NextResponse(
      `Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
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

    const body = await req.json();
    const { store, items } = body;

    // Get the latest shopping list
    const existingList = await prisma.shoppingList.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (existingList) {
      console.log("Updating existing shopping list");
      // Parse existing items if they're stored as a string
      const existingItems = Array.isArray(existingList.items) 
        ? existingList.items 
        : JSON.parse(existingList.items as string || '[]');

      // Use provided items or keep existing ones
      const updatedItems = items || existingItems;
      
      // Calculate total cost considering quantity
      const totalCost = updatedItems.reduce((sum: number, item: any) => 
        sum + ((item.price || 0) * (item.quantity || 1)), 0);

      const updatedList = await prisma.shoppingList.update({
        where: { id: existingList.id },
        data: {
          store: store !== undefined ? store : existingList.store,
          items: updatedItems,
          totalCost,
        },
      });

      // Parse items before sending response
      const parsedItems = Array.isArray(updatedList.items) 
        ? updatedList.items 
        : JSON.parse(updatedList.items as string || '[]');

      return NextResponse.json({
        ...updatedList,
        items: parsedItems,
        totalCost
      });
    } else {
      console.log("Creating new shopping list");
      const newItems = items || [];
      const totalCost = newItems.reduce((sum: number, item: any) => 
        sum + ((item.price || 0) * (item.quantity || 1)), 0);

      const newList = await prisma.shoppingList.create({
        data: {
          userId: user.id,
          store: store || "",
          items: newItems,
          totalCost,
        },
      });

      return NextResponse.json({
        ...newList,
        items: newItems,
        totalCost
      });
    }
  } catch (error) {
    console.error("Error updating shopping list:", error);
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
    console.log("Creating new shopping list");
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

    const body = await req.json();
    console.log("Shopping list data:", body);

    const { store, items } = body;

    // Calculate total cost
    const totalCost = items.reduce((sum: number, item: any) => {
      return sum + (item.price || 0);
    }, 0);

    console.log("Creating shopping list in database");
    const shoppingList = await prisma.shoppingList.create({
      data: {
        userId: user.id,
        store: store || "",
        items,
        totalCost,
      },
    });

    console.log("Shopping list created:", shoppingList.id);
    return NextResponse.json({
      ...shoppingList,
      items: Array.isArray(shoppingList.items) ? shoppingList.items : JSON.parse(shoppingList.items as string || '[]')
    });
  } catch (error) {
    console.error("Error creating shopping list:", error);
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