import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/meal-plan/:path*",
    "/recipes/:path*",
    "/groceries/:path*",
    "/shopping-list/:path*",
  ],
}; 