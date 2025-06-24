import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
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

    // Get the most recent grocery day
    const groceryDay = await prisma.groceryDay.findFirst({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(groceryDay);
  } catch (error) {
    console.error("Error fetching grocery day:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
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

    const body = await req.json();
    const { date } = body;

    if (!date) {
      return new NextResponse("Missing date", { status: 400 });
    }

    const groceryDay = await prisma.groceryDay.create({
      data: {
        date: new Date(date),
        userId: user.id,
      },
    });

    return NextResponse.json(groceryDay);
  } catch (error) {
    console.error("Error setting grocery day:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 